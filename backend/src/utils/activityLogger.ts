import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logActivity(
  agencyId: string,
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  try {
    await prisma.activityLog.create({
      data: { agencyId, userId, action, entity, entityId, details }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function createNotification(
  prisma: PrismaClient,
  userId: string,
  agencyId: string,
  title: string,
  message: string,
  type: string = 'INFO'
) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, agencyId, title, message, type }
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
