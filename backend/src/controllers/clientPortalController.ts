import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClientPortalData = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { clientId } = req.params;

    // Verify client belongs to this agency
    const client = await prisma.client.findFirst({
      where: { id: clientId, agencyId: user.agencyId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get campaigns with tasks and assignments
    const campaigns = await prisma.campaign.findMany({
      where: { clientId, agencyId: user.agencyId },
      include: {
        tasks: {
          select: {
            id: true,
            status: true
          }
        },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            team: { select: { id: true, name: true } },
            influencer: { select: { id: true, name: true, instagram: true, tiktok: true, youtube: true, niche: true } }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where: { clientId, agencyId: user.agencyId },
      orderBy: { dueDate: 'desc' }
    });

    // Extract unique influencers assigned to these campaigns
    const influencerMap = new Map();
    campaigns.forEach(campaign => {
      campaign.assignments.forEach(assign => {
        if (assign.influencer) {
          influencerMap.set(assign.influencer.id, assign.influencer);
        }
      });
    });
    const influencers = Array.from(influencerMap.values());

    res.json({
      client: {
        id: client.id,
        companyName: client.companyName,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        status: client.status,
        monthlyBudget: client.monthlyBudget
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        budget: c.budget,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        tasksSummary: {
          total: c.tasks.length,
          todo: c.tasks.filter(t => t.status === 'TODO').length,
          inProgress: c.tasks.filter(t => t.status === 'IN_PROGRESS').length,
          review: c.tasks.filter(t => t.status === 'REVIEW').length,
          done: c.tasks.filter(t => t.status === 'DONE').length
        }
      })),
      invoices,
      influencers
    });
  } catch (error) {
    console.error('Get client portal data error:', error);
    res.status(500).json({ error: 'Failed to fetch client portal data' });
  }
};
