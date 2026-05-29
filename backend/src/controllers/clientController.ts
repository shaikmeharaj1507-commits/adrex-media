import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const ClientSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  monthlyBudget: z.string().or(z.number()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
});

const ClientUpdateSchema = ClientSchema.partial();

export const getClients = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const clients = await prisma.client.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = ClientSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { companyName, contactName, email, phone, monthlyBudget, status } = validation.data;

    const client = await prisma.client.create({
      data: {
        agencyId: user.agencyId,
        companyName,
        contactName,
        email,
        phone,
        monthlyBudget: (monthlyBudget && String(monthlyBudget).trim() !== '') ? parseFloat(String(monthlyBudget)) : 0,
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = ClientUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { id } = req.params;
    const { companyName, contactName, email, phone, monthlyBudget, status } = validation.data;

    const client = await prisma.client.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(companyName && { companyName }),
        ...(contactName && { contactName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(monthlyBudget !== undefined && { 
          monthlyBudget: (monthlyBudget && String(monthlyBudget).trim() !== '') ? parseFloat(String(monthlyBudget)) : 0 
        }),
        ...(status && { status })
      }
    });

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.client.delete({ where: { id, agencyId: user.agencyId } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
