import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  
  connect: (token: string) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      set({ isConnected: true, socket });
      console.log('Connected to WebSockets');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      console.log('Disconnected from WebSockets');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
