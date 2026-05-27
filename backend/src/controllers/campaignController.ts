import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const CampaignSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  clientId: z.string().uuid('Invalid client ID'),
  description: z.string().optional(),
  budget: z.string().or(z.number()).optional(),
  startDate: z.string().datetime().or(z.string().date()),
  endDate: z.string().datetime().or(z.string().date()),
  status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  assignedUserIds: z.array(z.string().uuid()).optional(),
  assignedTeamIds: z.array(z.string().uuid()).optional(),
  assignedInfluencerIds: z.array(z.string().uuid()).optional(),
});

const CampaignUpdateSchema = CampaignSchema.partial();

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    let campaigns;
    if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
      campaigns = await prisma.campaign.findMany({
        where: { agencyId: user.agencyId },
        include: {
          client: { select: { companyName: true } },
          assignments: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              team: { select: { id: true, name: true } },
              influencer: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { teamId: true, email: true }
      });

      if (!dbUser) return res.status(404).json({ error: 'User not found' });

      let influencerId: string | null = null;
      if (user.role === 'INFLUENCER') {
        const influencer = await prisma.influencer.findFirst({
          where: { email: dbUser.email, agencyId: user.agencyId }
        });
        if (influencer) influencerId = influencer.id;
      }

      campaigns = await prisma.campaign.findMany({
        where: {
          agencyId: user.agencyId,
          assignments: {
            some: {
              OR: [
                { userId: user.userId },
                ...(dbUser.teamId ? [{ teamId: dbUser.teamId }] : []),
                ...(influencerId ? [{ influencerId }] : [])
              ]
            }
          }
        },
        include: {
          client: { select: { companyName: true } },
          assignments: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              team: { select: { id: true, name: true } },
              influencer: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, agencyId: user.agencyId },
      include: {
        client: { select: { companyName: true } },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            team: { select: { id: true, name: true } },
            influencer: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    let isAuthorized = false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
      isAuthorized = true;
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { teamId: true, email: true }
      });

      if (dbUser) {
        let influencerId: string | null = null;
        if (user.role === 'INFLUENCER') {
          const influencer = await prisma.influencer.findFirst({
            where: { email: dbUser.email, agencyId: user.agencyId }
          });
          if (influencer) influencerId = influencer.id;
        }

        const assignment = await prisma.campaignAssignment.findFirst({
          where: {
            campaignId: id,
            OR: [
              { userId: user.userId },
              ...(dbUser.teamId ? [{ teamId: dbUser.teamId }] : []),
              ...(influencerId ? [{ influencerId }] : [])
            ]
          }
        });
        if (assignment) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access Denied: You are not assigned to this project' });
    }

    // Audit logs for project access
    await prisma.activityLog.create({
      data: {
        agencyId: user.agencyId,
        userId: user.userId,
        action: 'ACCESS',
        entity: 'CAMPAIGN',
        entityId: id,
        details: `Accessed campaign: "${campaign.name}"`
      }
    });

    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = CampaignSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const {
      name, clientId, description, budget, startDate, endDate, status,
      assignedUserIds, assignedTeamIds, assignedInfluencerIds
    } = validation.data;

    const campaign = await prisma.campaign.create({
      data: {
        agencyId: user.agencyId,
        clientId,
        name,
        description,
        budget: budget ? parseFloat(String(budget)) : 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'DRAFT'
      },
      include: { client: { select: { companyName: true } } }
    });

    // Create assignments
    if (assignedUserIds && assignedUserIds.length > 0) {
      await prisma.campaignAssignment.createMany({
        data: assignedUserIds.map((uid: string) => ({
          campaignId: campaign.id,
          userId: uid
        }))
      });
    }
    if (assignedTeamIds && assignedTeamIds.length > 0) {
      await prisma.campaignAssignment.createMany({
        data: assignedTeamIds.map((tid: string) => ({
          campaignId: campaign.id,
          teamId: tid
        }))
      });
    }
    if (assignedInfluencerIds && assignedInfluencerIds.length > 0) {
      await prisma.campaignAssignment.createMany({
        data: assignedInfluencerIds.map((iid: string) => ({
          campaignId: campaign.id,
          influencerId: iid
        }))
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('campaign_updated', {
        action: 'CREATE',
        campaignId: campaign.id
      });
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = CampaignUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { id } = req.params;
    const {
      name, clientId, description, budget, startDate, endDate, status,
      assignedUserIds, assignedTeamIds, assignedInfluencerIds
    } = validation.data;

    const campaign = await prisma.campaign.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(name && { name }),
        ...(clientId && { clientId }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget: parseFloat(String(budget)) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status })
      },
      include: { client: { select: { companyName: true } } }
    });

    // Reset and update assignments if any assignment fields are explicitly passed
    if (assignedUserIds !== undefined || assignedTeamIds !== undefined || assignedInfluencerIds !== undefined) {
      await prisma.campaignAssignment.deleteMany({
        where: { campaignId: id }
      });

      if (assignedUserIds && assignedUserIds.length > 0) {
        await prisma.campaignAssignment.createMany({
          data: assignedUserIds.map((uid: string) => ({
            campaignId: id,
            userId: uid
          }))
        });
      }
      if (assignedTeamIds && assignedTeamIds.length > 0) {
        await prisma.campaignAssignment.createMany({
          data: assignedTeamIds.map((tid: string) => ({
            campaignId: id,
            teamId: tid
          }))
        });
      }
      if (assignedInfluencerIds && assignedInfluencerIds.length > 0) {
        await prisma.campaignAssignment.createMany({
          data: assignedInfluencerIds.map((iid: string) => ({
            campaignId: id,
            influencerId: iid
          }))
        });
      }
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('campaign_updated', {
        action: 'UPDATE',
        campaignId: id
      });
    }

    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.campaign.delete({ where: { id, agencyId: user.agencyId } });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('campaign_updated', {
        action: 'DELETE',
        campaignId: id
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
