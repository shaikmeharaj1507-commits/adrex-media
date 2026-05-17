import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    const count = await prisma.notification.count({
      where: { userId: user.userId, isRead: false }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.notification.update({
      where: { id, userId: user.userId },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.notification.delete({ where: { id, userId: user.userId } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

export const updateNotificationPrefs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    const prefs = req.body;
    await (prisma as any).user.update({
      where: { id: user.userId },
      data: { notificationPrefs: JSON.stringify(prefs) }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

export const getNotificationPrefs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: 'Unauthorized' });

    const dbUser = await (prisma as any).user.findUnique({
      where: { id: user.userId },
      select: { notificationPrefs: true }
    });

    const prefs = dbUser?.notificationPrefs
      ? JSON.parse(dbUser.notificationPrefs)
      : { emailCampaigns: true, emailTasks: true, emailInfluencers: false, browserAlerts: true, weeklyDigest: true };

    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};
