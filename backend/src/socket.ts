import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

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
    socket.on('send_team_message', (data: { text: string }) => {
      if (!data.text) return;
      
      const messagePayload = {
        id: Date.now().toString(),
        userId: user.userId,
        text: data.text,
        timestamp: new Date().toISOString()
      };

      io.to(agencyRoom).emit('receive_team_message', messagePayload);
    });

    // PRIVATE MESSAGING - 1:1 Chat
    socket.on('send_private_message', async (data: { receiverId: string; content: string }) => {
      if (!data.receiverId || !data.content) return;

      const messagePayload = {
        id: Date.now().toString(),
        senderId: user.userId,
        receiverId: data.receiverId,
        content: data.content,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const receiverRoom = `user_${data.receiverId}`;
      io.to(receiverRoom).emit('receive_private_message', messagePayload);
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
