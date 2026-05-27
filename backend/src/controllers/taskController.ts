import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logActivity, createNotification } from '../utils/activityLogger';

const prisma = new PrismaClient();

// Helper: check if user has access to a specific task
async function userCanAccessTask(userId: string, userRole: string, agencyId: string, task: any): Promise<boolean> {
  if (userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') return true;
  if (task.assigneeId === userId) return true;

  // TEAM_MEMBER role is strictly restricted to assigned tasks
  if (userRole === 'TEAM_MEMBER') return false;

  // Check if the task belongs to a campaign the user is assigned to
  if (task.campaignId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true, email: true }
    });
    if (!dbUser) return false;

    let influencerId: string | null = null;
    if (userRole === 'INFLUENCER') {
      const influencer = await prisma.influencer.findFirst({
        where: { email: dbUser.email, agencyId }
      });
      if (influencer) influencerId = influencer.id;
    }

    const assignment = await prisma.campaignAssignment.findFirst({
      where: {
        campaignId: task.campaignId,
        OR: [
          { userId },
          ...(dbUser.teamId ? [{ teamId: dbUser.teamId }] : []),
          ...(influencerId ? [{ influencerId }] : [])
        ]
      }
    });
    if (assignment) return true;
  }

  return false;
}

export const getTasks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
      // Admins see everything
      const tasks = await prisma.task.findMany({
        where: { agencyId: user.agencyId },
        orderBy: { createdAt: 'desc' },
        include: {
          assigneeUser: { select: { firstName: true, lastName: true, avatar: true, role: true } },
          campaignObj: { select: { id: true, name: true } }
        }
      });
      return res.json(tasks);
    }

    if (user.role === 'TEAM_MEMBER') {
      // Team members strictly see tasks assigned to them
      const tasks = await prisma.task.findMany({
        where: {
          agencyId: user.agencyId,
          assigneeId: user.userId
        },
        orderBy: { createdAt: 'desc' },
        include: {
          assigneeUser: { select: { firstName: true, lastName: true, avatar: true, role: true } },
          campaignObj: { select: { id: true, name: true } }
        }
      });
      return res.json(tasks);
    }

    // Other roles: get tasks assigned to them + tasks from campaigns they're assigned to
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { teamId: true, email: true }
    });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    let influencerId: string | null = null;
    if (user.role === 'INFLUENCER') {
      const influencer = await prisma.influencer.findFirst({
        where: { email: dbUser.email, agencyId: user.agencyId }
      });
      if (influencer) influencerId = influencer.id;
    }

    // Get campaign IDs the user is assigned to
    const assignedCampaigns = await prisma.campaignAssignment.findMany({
      where: {
        campaign: { agencyId: user.agencyId },
        OR: [
          { userId: user.userId },
          ...(dbUser.teamId ? [{ teamId: dbUser.teamId }] : []),
          ...(influencerId ? [{ influencerId }] : [])
        ]
      },
      select: { campaignId: true }
    });

    const campaignIds = assignedCampaigns.map(a => a.campaignId);

    const tasks = await prisma.task.findMany({
      where: {
        agencyId: user.agencyId,
        OR: [
          { assigneeId: user.userId },
          ...(campaignIds.length > 0 ? [{ campaignId: { in: campaignIds } }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assigneeUser: { select: { firstName: true, lastName: true, avatar: true, role: true } },
        campaignObj: { select: { id: true, name: true } }
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, agencyId: user.agencyId },
      include: {
        assigneeUser: { select: { firstName: true, lastName: true, avatar: true, role: true } },
        campaignObj: { select: { id: true, name: true } }
      }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const hasAccess = await userCanAccessTask(user.userId, user.role, user.agencyId, task);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access Denied: You are not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, assignee, assigneeId, priority, campaign, campaignId, dueDate, status } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] as string;

    // 1. Direct Idempotency Key check
    if (idempotencyKey) {
      const existingKey = await prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey }
      });
      if (existingKey) {
        if (existingKey.response) {
          try {
            const parsed = JSON.parse(existingKey.response);
            return res.status(200).json({ ...parsed, _isDuplicate: true });
          } catch (e) {
            // fallback if JSON parsing fails
          }
        }
        return res.status(200).json({ message: 'Task already created', _isDuplicate: true });
      }
    }

    // 2. Database duplicate heuristic check (same details created in last 15 seconds)
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const heuristicDuplicate = await prisma.task.findFirst({
      where: {
        agencyId: user.agencyId,
        title,
        campaignId: campaignId || null,
        assigneeId: assigneeId || null,
        createdAt: {
          gte: fifteenSecondsAgo
        }
      }
    });

    if (heuristicDuplicate) {
      if (idempotencyKey) {
        await prisma.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          create: { key: idempotencyKey, response: JSON.stringify(heuristicDuplicate) },
          update: { response: JSON.stringify(heuristicDuplicate) }
        });
      }
      return res.status(200).json({ ...heuristicDuplicate, _isDuplicate: true });
    }

    // 3. Create the task since no duplicates were found
    const task = await prisma.task.create({
      data: {
        agencyId: user.agencyId,
        title,
        assignee,
        assigneeId: assigneeId || null,
        priority,
        campaign,
        campaignId: campaignId || null,
        dueDate,
        status: status || 'TODO'
      }
    });

    // 4. Save the idempotency key response
    if (idempotencyKey) {
      await prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          response: JSON.stringify(task)
        }
      });
    }

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
      io.to(`agency_${user.agencyId}`).emit('task_updated', {
        action: 'CREATE',
        taskId: task.id
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
    const { status, title, assignee, assigneeId, priority, campaign, campaignId, dueDate } = req.body;

    // Verify authorization
    const existingTask = await prisma.task.findFirst({
      where: { id, agencyId: user.agencyId }
    });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const hasAccess = await userCanAccessTask(user.userId, user.role, user.agencyId, existingTask);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access Denied: You are not authorized to modify this task' });
    }

    const task = await prisma.task.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(title && { title }),
        ...(assignee !== undefined && { assignee }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(priority && { priority }),
        ...(campaign !== undefined && { campaign }),
        ...(campaignId !== undefined && { campaignId }),
        ...(dueDate !== undefined && { dueDate }),
        ...(status && { status })
      }
    });

    await logActivity(user.agencyId, user.userId, 'UPDATE', 'TASK', id, `Status: ${status || 'unchanged'}`);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('task_updated', {
        action: 'UPDATE',
        taskId: id
      });
    }

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

    // Only admins can delete tasks
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only admins can delete tasks' });
    }

    await prisma.task.delete({ where: { id, agencyId: user.agencyId } });

    await logActivity(user.agencyId, user.userId, 'DELETE', 'TASK', id);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`agency_${user.agencyId}`).emit('task_updated', {
        action: 'DELETE',
        taskId: id
      });
    }

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

    // Fetch commenter user details manually since there is no schema-level Prisma relation
    const userIds = Array.from(new Set(comments.map(c => c.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, avatar: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const commentsWithUser = comments.map(c => {
      const { task, ...commentData } = c; // strip temporary task include
      return {
        ...commentData,
        user: userMap.get(c.userId) || { firstName: 'Unknown', lastName: 'User', avatar: null }
      };
    });

    res.json(commentsWithUser);
  } catch (error) {
    console.error('Error fetching comments:', error);
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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, firstName: true, lastName: true, avatar: true }
    });

    res.status(201).json({
      ...comment,
      user: dbUser || { firstName: 'Unknown', lastName: 'User', avatar: null }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
