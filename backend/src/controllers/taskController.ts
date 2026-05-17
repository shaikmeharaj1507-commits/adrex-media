import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const tasks = await prisma.task.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, assignee, priority, campaign, dueDate, status } = req.body;

    const task = await prisma.task.create({
      data: {
        agencyId: user.agencyId,
        title,
        assignee,
        priority,
        campaign,
        dueDate,
        status: status || 'TODO'
      }
    });

    // Emit Real-Time Notification
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('receive_notification', {
        text: `New task created: "${title}"`,
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status, title, assignee, priority, campaign, dueDate } = req.body;

    const task = await prisma.task.update({
      where: { id, agencyId: user.agencyId },
      data: { status, title, assignee, priority, campaign, dueDate }
    });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    await prisma.task.delete({
      where: { id, agencyId: user.agencyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
