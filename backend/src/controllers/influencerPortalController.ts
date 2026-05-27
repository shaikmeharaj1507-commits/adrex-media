import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getInfluencerPortalData = async (req: Request, res: Response) => {
  try {
    const { influencerId } = req.params;

    // Get influencer
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: { agency: true }
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Get campaigns this influencer is assigned to
    const assignments = await prisma.campaignAssignment.findMany({
      where: { influencerId },
      include: {
        campaign: {
          include: {
            tasks: {
              orderBy: { dueDate: 'asc' }
            }
          }
        }
      }
    });

    const campaigns = assignments.map(a => a.campaign);

    // Flatten deliverables (tasks)
    const deliverables = campaigns.flatMap(c => c.tasks);

    // Find assigned SPOC (first team member assigned, or first SUPER_ADMIN in the agency)
    let spoc = null;
    
    // Check if there is an admin/manager user assigned to these campaigns
    const agencyAdmins = await prisma.user.findMany({
      where: { agencyId: influencer.agencyId, role: { in: ['SUPER_ADMIN', 'MANAGER'] } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true }
    });

    if (agencyAdmins.length > 0) {
      spoc = agencyAdmins[0];
    }

    // Find payments/expenses labeled for this influencer
    const payouts = await prisma.expense.findMany({
      where: {
        agencyId: influencer.agencyId,
        OR: [
          { description: { contains: influencer.name, mode: 'insensitive' } },
          { description: { contains: influencer.email || '___no_email___', mode: 'insensitive' } }
        ]
      },
      orderBy: { date: 'desc' }
    });

    // Find uploaded files tagged with influencerId
    const files = await prisma.file.findMany({
      where: {
        agencyId: influencer.agencyId,
        tags: { has: influencerId }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Find chat history with SPOC
    const spocId = spoc ? spoc.id : '';
    const messages = await prisma.message.findMany({
      where: {
        agencyId: influencer.agencyId,
        senderId: spocId,
        OR: [
          { senderName: { startsWith: `Influencer:${influencerId}` } },
          { senderName: `SPOC:${influencerId}` }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      influencer: {
        id: influencer.id,
        name: influencer.name,
        email: influencer.email,
        phone: influencer.phone,
        whatsapp: influencer.whatsapp,
        instagram: influencer.instagram,
        tiktok: influencer.tiktok,
        youtube: influencer.youtube,
        niche: influencer.niche,
        rating: influencer.rating,
        location: influencer.location,
        status: influencer.status,
        pricing: influencer.pricing,
        audienceStats: influencer.audienceStats
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status
      })),
      deliverables: deliverables.map(d => ({
        id: d.id,
        title: d.title,
        dueDate: d.dueDate,
        status: d.status,
        priority: d.priority,
        campaignName: campaigns.find(c => c.id === d.campaignId)?.name || 'General'
      })),
      spoc,
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        description: p.description,
        category: p.category
      })),
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        url: f.url,
        size: f.size,
        type: f.type,
        createdAt: f.createdAt
      })),
      messages: messages.map(m => ({
        id: m.id,
        senderName: m.senderName?.startsWith('Influencer:') ? influencer.name : (spoc ? `${spoc.firstName} ${spoc.lastName}` : 'SPOC'),
        isInfluencer: m.senderName?.startsWith('Influencer:'),
        content: m.content,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('Get influencer portal data error:', error);
    res.status(500).json({ error: 'Failed to fetch influencer portal data' });
  }
};

export const uploadInfluencerDeliverable = async (req: Request, res: Response) => {
  try {
    const { influencerId } = req.params;
    const { name, url, size, type } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'File name and URL are required' });
    }

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId }
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Find fallback uploader (first admin)
    const admins = await prisma.user.findMany({
      where: { agencyId: influencer.agencyId, role: { in: ['SUPER_ADMIN', 'MANAGER'] } },
      select: { id: true }
    });

    if (admins.length === 0) {
      return res.status(500).json({ error: 'No admin user found to associate file upload' });
    }

    const file = await prisma.file.create({
      data: {
        agencyId: influencer.agencyId,
        uploaderId: admins[0].id,
        name,
        url,
        size: size || 0,
        type: type || 'application/octet-stream',
        category: 'DELIVERABLE',
        tags: [influencerId, 'influencer_upload']
      }
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Upload deliverable error:', error);
    res.status(500).json({ error: 'Failed to upload deliverable file' });
  }
};

export const getInfluencerMessages = async (req: Request, res: Response) => {
  try {
    const { influencerId } = req.params;

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId }
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Get assigned SPOC
    const admins = await prisma.user.findMany({
      where: { agencyId: influencer.agencyId, role: { in: ['SUPER_ADMIN', 'MANAGER'] } },
      select: { id: true, firstName: true, lastName: true }
    });

    const spoc = admins.length > 0 ? admins[0] : null;
    const spocId = spoc ? spoc.id : '';

    const messages = await prisma.message.findMany({
      where: {
        agencyId: influencer.agencyId,
        senderId: spocId,
        OR: [
          { senderName: `Influencer:${influencerId}` },
          { senderName: `SPOC:${influencerId}` }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages.map(m => ({
      id: m.id,
      senderName: m.senderName === `Influencer:${influencerId}` ? influencer.name : (spoc ? `${spoc.firstName} ${spoc.lastName}` : 'SPOC'),
      isInfluencer: m.senderName === `Influencer:${influencerId}`,
      content: m.content,
      createdAt: m.createdAt
    })));
  } catch (error) {
    console.error('Get influencer messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendInfluencerMessage = async (req: Request, res: Response) => {
  try {
    const { influencerId } = req.params;
    const { content, isFromInfluencer } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId }
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    // Get assigned SPOC
    const admins = await prisma.user.findMany({
      where: { agencyId: influencer.agencyId, role: { in: ['SUPER_ADMIN', 'MANAGER'] } },
      select: { id: true, firstName: true, lastName: true }
    });

    const spoc = admins.length > 0 ? admins[0] : null;
    if (!spoc) {
      return res.status(500).json({ error: 'No SPOC available' });
    }

    // Create message under the SPOC's senderId with helper senderNames
    const message = await prisma.message.create({
      data: {
        agencyId: influencer.agencyId,
        senderId: spoc.id,
        senderName: isFromInfluencer ? `Influencer:${influencerId}` : `SPOC:${influencerId}`,
        content,
        receiverId: null
      }
    });

    res.status(201).json({
      id: message.id,
      senderName: isFromInfluencer ? influencer.name : `${spoc.firstName} ${spoc.lastName}`,
      isInfluencer: isFromInfluencer,
      content: message.content,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Send influencer message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
