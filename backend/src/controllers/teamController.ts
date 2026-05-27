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
    const { role, isActive, firstName, lastName, email } = req.body;

    const updatedMember = await prisma.user.update({
      where: { id, agencyId: user.agencyId },
      data: { role, isActive, firstName, lastName, email },
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

    if (id === user.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

    await prisma.user.delete({
      where: { id, agencyId: user.agencyId },
    });

    res.json({ message: 'Team member deleted' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const teams = await prisma.team.findMany({
      where: { agencyId: user.agencyId },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });

    const team = await prisma.team.create({
      data: {
        agencyId: user.agencyId,
        name,
        members: memberIds ? {
          connect: memberIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { name, memberIds } = req.body;

    const existing = await prisma.team.findFirst({
      where: { id, agencyId: user.agencyId }
    });
    if (!existing) return res.status(404).json({ error: 'Team not found' });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (memberIds) {
      await prisma.user.updateMany({
        where: { teamId: id },
        data: { teamId: null }
      });
      updateData.members = {
        connect: memberIds.map((mid: string) => ({ id: mid }))
      };
    }

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    });

    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const existing = await prisma.team.findFirst({
      where: { id, agencyId: user.agencyId }
    });
    if (!existing) return res.status(404).json({ error: 'Team not found' });

    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
};

