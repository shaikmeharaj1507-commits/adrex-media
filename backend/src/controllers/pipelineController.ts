import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLeads = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const leads = await prisma.pipelineLead.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { companyName, contactName, email, phone, value, stage, notes } = req.body;

    const newLead = await prisma.pipelineLead.create({
      data: {
        agencyId: user.agencyId,
        companyName,
        contactName,
        email,
        phone,
        value: parseFloat(value) || 0,
        stage: stage || 'LEAD',
        notes
      }
    });

    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { companyName, contactName, email, phone, value, stage, notes } = req.body;

    const updatedLead = await prisma.pipelineLead.update({
      where: { id, agencyId: user.agencyId },
      data: {
        companyName,
        contactName,
        email,
        phone,
        value: value ? parseFloat(value) : undefined,
        stage,
        notes
      }
    });

    res.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    await prisma.pipelineLead.delete({
      where: { id, agencyId: user.agencyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
