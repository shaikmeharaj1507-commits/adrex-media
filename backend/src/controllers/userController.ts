import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });

    const { firstName, lastName, bio, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        bio,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        phone: true,
        agencyId: true,
      }
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
