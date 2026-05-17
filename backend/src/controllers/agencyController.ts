import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const AgencyUpdateSchema = z.object({
  name: z.string().min(2, 'Agency name must be at least 2 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
  country: z.string().optional(),
});

export const getAgency = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const agency = await prisma.agency.findUnique({
      where: { id: user.agencyId },
    });

    if (!agency) return res.status(404).json({ error: 'Agency not found' });

    res.json(agency);
  } catch (error: any) {
    console.error('Error fetching agency:', error);
    res.status(500).json({ error: 'Failed to fetch agency' });
  }
};

export const updateAgency = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = AgencyUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { name, website, industry, teamSize, country } = validation.data;

    const updatedAgency = await prisma.agency.update({
      where: { id: user.agencyId },
      data: {
        ...(name && { name }),
        ...(website !== undefined && { website }),
        ...(industry && { industry }),
        ...(teamSize && { teamSize }),
        ...(country && { country }),
      },
    });

    res.json(updatedAgency);
  } catch (error: any) {
    console.error('Error updating agency:', error);
    res.status(500).json({ error: 'Failed to update agency' });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    const updatedAgency = await prisma.agency.update({
      where: { id: user.agencyId },
      data: { logo: logoUrl },
    });

    res.json({ message: 'Logo uploaded', logoUrl, agency: updatedAgency });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};
