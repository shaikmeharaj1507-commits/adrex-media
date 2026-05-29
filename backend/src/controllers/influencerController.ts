import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';


const prisma = new PrismaClient();

const InfluencerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  niche: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  pricing: z.string().optional(),
  audienceStats: z.string().optional(),
});

const InfluencerUpdateSchema = InfluencerSchema.partial();

export const getInfluencers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const influencers = await prisma.influencer.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(influencers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createInfluencer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = InfluencerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { name, email, phone, whatsapp, instagram, tiktok, youtube, niche, rating, notes, location, status, pricing, audienceStats } = validation.data;

    const influencer = await prisma.influencer.create({
      data: {
        agencyId: user.agencyId,
        name,
        email: email === '' ? null : email,
        phone,
        whatsapp,
        instagram,
        tiktok,
        youtube,
        niche,
        rating: rating || 0,
        notes,
        location,
        status: status || 'APPROVED',
        pricing,
        audienceStats
      }
    });

    res.status(201).json(influencer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateInfluencer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = InfluencerUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { id } = req.params;
    const { name, email, phone, whatsapp, instagram, tiktok, youtube, niche, rating, notes, location, status, pricing, audienceStats } = validation.data;

    const influencer = await prisma.influencer.update({
      where: { id, agencyId: user.agencyId },
      data: { 
        name, 
        email: email === '' ? null : email, 
        phone, 
        whatsapp, 
        instagram, 
        tiktok, 
        youtube, 
        niche, 
        rating, 
        notes, 
        location, 
        status, 
        pricing, 
        audienceStats 
      }
    });

    res.json(influencer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteInfluencer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    await prisma.influencer.delete({
      where: { id, agencyId: user.agencyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const onboardInfluencer = async (req: Request, res: Response) => {
  try {
    const { agencyId } = req.params;
    
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });

    const validation = InfluencerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { name, email, phone, whatsapp, instagram, tiktok, youtube, niche, location, pricing, audienceStats } = validation.data;

    const influencer = await prisma.influencer.create({
      data: {
        agencyId,
        name,
        email: email === '' ? null : email,
        phone,
        whatsapp,
        instagram,
        tiktok,
        youtube,
        niche,
        rating: 0,
        location,
        status: 'PENDING',
        pricing,
        audienceStats
      }
    });

    // Notify all admins and managers in the agency
    const admins = await prisma.user.findMany({
      where: { agencyId, role: { in: ['SUPER_ADMIN', 'MANAGER'] } },
      select: { id: true }
    });

    await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            agencyId,
            userId: admin.id,
            title: 'New Creator Application',
            message: `${name} has submitted an onboarding application and is pending review.`,
            type: 'INFO'
          }
        })
      )
    );

    // Create activity log (use first admin as actor for system-generated logs)
    if (admins.length > 0) {
      await prisma.activityLog.create({
        data: {
          agencyId,
          userId: admins[0].id,
          action: 'CREATE',
          entity: 'INFLUENCER_ONBOARDING',
          entityId: influencer.id,
          details: `Creator "${name}" submitted onboarding form`
        }
      });
    }

    console.log(`New influencer onboarding: ${name} for agency ${agencyId}`);

    res.status(201).json({ message: 'Onboarding successful', influencerId: influencer.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createPortalUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const influencer = await prisma.influencer.findFirst({
      where: { id, agencyId: user.agencyId }
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    if (!influencer.email) {
      return res.status(400).json({ error: 'Influencer email is required to create portal credentials' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const existingUser = await prisma.user.findUnique({
      where: { email: influencer.email }
    });

    let portalUser;
    if (existingUser) {
      portalUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'INFLUENCER',
          passwordHash,
          firstName: influencer.name.split(' ')[0] || 'Creator',
          lastName: influencer.name.split(' ').slice(1).join(' ') || 'Partner',
        }
      });
    } else {
      portalUser = await prisma.user.create({
        data: {
          agencyId: user.agencyId,
          email: influencer.email,
          passwordHash,
          firstName: influencer.name.split(' ')[0] || 'Creator',
          lastName: influencer.name.split(' ').slice(1).join(' ') || 'Partner',
          role: 'INFLUENCER',
          isEmailVerified: true
        }
      });
    }

    await prisma.influencer.update({
      where: { id },
      data: { userId: portalUser.id }
    });

    res.json({ message: 'Portal access created successfully', email: influencer.email });
  } catch (error) {
    console.error('Create portal user error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

