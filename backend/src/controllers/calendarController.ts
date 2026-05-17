import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEvents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const events = await prisma.calendarEvent.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { date: 'asc' }
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, date, type, color } = req.body;

    const event = await prisma.calendarEvent.create({
      data: { agencyId: user.agencyId, title, date, type, color }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { title, date, type, color } = req.body;

    const event = await prisma.calendarEvent.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(title && { title }),
        ...(date && { date }),
        ...(type && { type }),
        ...(color && { color })
      }
    });

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.calendarEvent.delete({ where: { id, agencyId: user.agencyId } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
