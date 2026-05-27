import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getConversations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.userId }, { receiverId: user.userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatar: true } },
      },
    });

    const conversations: Record<string, any> = {};
    messages.forEach(msg => {
      const otherUser = msg.senderId === user.userId ? msg.receiver : msg.sender;
      if (otherUser && !conversations[otherUser.id]) {
        conversations[otherUser.id] = {
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread: msg.receiverId === user.userId && !msg.isRead,
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { userId } = req.params;
    let messages;

    if (userId === 'team') {
      messages = await prisma.message.findMany({
        where: {
          agencyId: user.agencyId,
          receiverId: null,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      messages = await prisma.message.findMany({
        where: {
          AND: [
            {
              OR: [
                { senderId: user.userId, receiverId: userId },
                { senderId: userId, receiverId: user.userId },
              ],
            },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      await prisma.message.updateMany({
        where: { senderId: userId, receiverId: user.userId, isRead: false },
        data: { isRead: true },
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content are required' });

    // Fetch sender user details to store senderName
    const sender = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { firstName: true, lastName: true },
    });
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Team Member';

    const isTeam = receiverId === 'team';

    const message = await prisma.message.create({
      data: {
        agencyId: user.agencyId,
        senderId: user.userId,
        senderName,
        receiverId: isTeam ? null : receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    await prisma.message.updateMany({
      where: { id, receiverId: user.userId },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};
