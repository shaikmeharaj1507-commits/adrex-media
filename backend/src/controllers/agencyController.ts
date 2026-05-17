import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const { name, website, industry, teamSize, country } = req.body;

    const updatedAgency = await prisma.agency.update({
      where: { id: user.agencyId },
      data: {
        name,
        website,
        industry,
        teamSize,
        country,
      },
    });

    res.json(updatedAgency);
  } catch (error: any) {
    console.error('Error updating agency:', error);
    res.status(500).json({ error: 'Failed to update agency' });
  }
};
