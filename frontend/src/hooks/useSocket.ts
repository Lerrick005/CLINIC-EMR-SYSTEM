// frontend/src/hooks/useSocket.ts
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import notificationService from '../services/notificationService';

let socketInstance: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No token found, socket not initialized');
      return;
    }

    if (!socketInstance) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        console.log('🔌 Socket connected');
        setIsConnected(true);
        notificationService.initialize(socketInstance!);
      });

      socketInstance.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    setSocket(socketInstance);

    return () => {
      // Keep connection alive
    };
  }, []);

  return { socket, isConnected };
}
