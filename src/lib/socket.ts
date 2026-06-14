import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://order-hub-backend.vercel.app';

// The WebSocket server is hosted at the same base origin as the API (e.g. without "/api")
const SOCKET_URL = API_BASE.replace(/\/api$/, '');

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    // Return a mock placeholder socket for Next.js SSR build environments
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      connect: () => {},
      connected: false,
    } as unknown as Socket;
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }

  return socketInstance;
};
