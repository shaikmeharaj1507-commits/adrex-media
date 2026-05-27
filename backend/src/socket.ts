import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SocketUser {
  userId: string;
  agencyId: string;
  role: string;
}

// Extend Socket interface to include our custom user
export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export const setupSocketIO = (httpServer: HttpServer) => {
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return socket.disconnect();

    console.log(`Socket connected: ${socket.id} (User: ${user.userId}, Agency: ${user.agencyId})`);

    // Join agency-specific room for multi-tenant broadcasting
    const agencyRoom = `agency_${user.agencyId}`;
    socket.join(agencyRoom);

    // CHAT FEATURE - Team Channel
    socket.on('send_team_message', async (data: { text: string }) => {
      if (!data.text) return;
      
      try {
        const sender = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, firstName: true, lastName: true, role: true, avatar: true }
        });

        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Team Member';

        const message = await prisma.message.create({
          data: {
            agencyId: user.agencyId,
            senderId: user.userId,
            senderName,
            receiverId: null,
            content: data.text,
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true
              }
            }
          }
        });

        io.to(agencyRoom).emit('receive_team_message', message);
      } catch (error) {
        console.error('Socket error in send_team_message:', error);
      }
    });

    // PRIVATE MESSAGING - 1:1 Chat
    socket.on('send_private_message', async (data: { receiverId: string; content: string }) => {
      if (!data.receiverId || !data.content) return;

      try {
        const sender = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, firstName: true, lastName: true, role: true, avatar: true }
        });

        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Team Member';

        const messagePayload = {
          id: Date.now().toString(),
          senderId: user.userId,
          senderName,
          receiverId: data.receiverId,
          content: data.content,
          isRead: false,
          createdAt: new Date().toISOString(),
          sender: sender || undefined
        };

        const receiverRoom = `user_${data.receiverId}`;
        io.to(receiverRoom).emit('receive_private_message', messagePayload);
      } catch (error) {
        console.error('Socket error in send_private_message:', error);
      }
    });

    // Join user-specific room for private messages
    const userRoom = `user_${user.userId}`;
    socket.join(userRoom);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
