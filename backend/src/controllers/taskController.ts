import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logActivity, createNotification } from '../utils/activityLogger';

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const tasks = await prisma.task.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: 'desc' },
      include: { assigneeUser: { select: { firstName: true, lastName: true, avatar: true } } }
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

    const { title, assignee, assigneeId, priority, campaign, dueDate, status } = req.body;

    const task = await prisma.task.create({
      data: {
        agencyId: user.agencyId,
        title,
        assignee,
        assigneeId: assigneeId || null,
        priority,
        campaign,
        dueDate,
        status: status || 'TODO'
      }
    });

    // Log activity
    await logActivity(user.agencyId, user.userId, 'CREATE', 'TASK', task.id, title);

    // Notify assignee if assigned
    if (assigneeId) {
      await createNotification(prisma, assigneeId, user.agencyId, 'New Task Assigned', `You have been assigned: "${title}"`, 'TASK');
    }

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('receive_notification', {
        title: 'New Task',
        message: `New task created: "${title}"`,
        type: 'TASK'
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
    const { status, title, assignee, assigneeId, priority, campaign, dueDate } = req.body;

    const task = await prisma.task.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(title && { title }),
        ...(assignee !== undefined && { assignee }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(priority && { priority }),
        ...(campaign !== undefined && { campaign }),
        ...(dueDate !== undefined && { dueDate }),
        ...(status && { status })
      }
    });

    await logActivity(user.agencyId, user.userId, 'UPDATE', 'TASK', id, `Status: ${status || 'unchanged'}`);

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.task.delete({ where: { id, agencyId: user.agencyId } });

    await logActivity(user.agencyId, user.userId, 'DELETE', 'TASK', id);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Task Comments
export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { taskId } = req.params;
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: { task: { select: { agencyId: true } } },
      orderBy: { createdAt: 'asc' }
    });

    // Verify task belongs to user's agency
    if (comments.length > 0 && comments[0].task.agencyId !== user.agencyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const createTaskComment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { taskId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Verify task exists and belongs to agency
    const task = await prisma.task.findFirst({ where: { id: taskId, agencyId: user.agencyId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await prisma.taskComment.create({
      data: { taskId, userId: user.userId, content }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
