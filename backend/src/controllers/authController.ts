import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-adrex-key-12345';
const JWT_EXPIRES_IN = '7d';

const SignupSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  agencyName: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const data = SignupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: data.agencyName,
        }
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          agencyId: agency.id,
          role: 'SUPER_ADMIN' // First user of agency is super admin
        }
      });

      return { agency, user };
    });

    const token = jwt.sign(
      { userId: result.user.id, agencyId: result.agency.id, role: result.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Signup successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        agencyId: result.user.agencyId
      },
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, agencyId: user.agencyId, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        agencyId: user.agencyId
      },
      token
    });

  } catch (error) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Invalid current password' });

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: newHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- NEW PHASE 7 AUTHENTICATION ENDPOINTS ---

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Setup Nodemailer transport (for demo we use Ethereal or a placeholder)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass'
  }
});

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: '"Adrex Media OS" <noreply@adrexmedia.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset</h3>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset link' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) return res.status(400).json({ error: 'Invalid token' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    res.json({ message: 'Email successfully verified' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};
