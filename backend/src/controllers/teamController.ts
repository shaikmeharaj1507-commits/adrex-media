import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const team = await prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { firstName, lastName, email, role, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'AdrexMedia123!', salt);

    const newMember = await prisma.user.create({
      data: {
        agencyId: user.agencyId,
        firstName,
        lastName,
        email,
        passwordHash,
        role: role || 'TEAM_MEMBER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
};

export const updateTeamMember = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { role, isActive } = req.body;

    const updatedMember = await prisma.user.update({
      where: { id, agencyId: user.agencyId },
      data: { role, isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

export const deleteTeamMember = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    if (id === user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    await prisma.user.delete({
      where: { id, agencyId: user.agencyId },
    });

    res.json({ message: 'Team member deleted' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};
