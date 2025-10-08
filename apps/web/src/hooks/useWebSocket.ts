import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { config } from '@/lib/config';
import { toast } from 'sonner';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { addNotification } = useNotificationStore();

  const connect = useCallback(() => {
    // Previne criação de múltiplos sockets
    if (socketRef.current) {
      console.log('⚠️  Socket already exists, skipping connection');
      return;
    }

    const wsUrl = config.api.websocketUrl || 'http://localhost:3003';
    
    console.log('🔌 Creating new WebSocket connection to', wsUrl);
    
    // Conexão SEM autenticação - apenas broadcast
    const socket = io(`${wsUrl}/notifications`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connected', (data: { userId: string; message: string }) => {
      console.log('✅ WebSocket connected:', JSON.stringify(data, null, 2));
    });

    // Evento principal de notificação
    socket.on('notification', (notification: any) => {
      console.log('🔔 New notification received:', JSON.stringify(notification, null, 2));
      
      // Filtrar: não notificar quem gerou a ação
      const currentUserId = useAuthStore.getState().currentUser?.id;
      if (currentUserId && notification.excludeUserId === currentUserId) {
        console.log('⏭️  Notification filtered (own action)');
        return;
      }
      
      // Adicionar ao store
      addNotification({
        message: notification.message,
        read: false,
        type: mapNotificationType(notification.type),
      });
      
      // Exibir toast
      toast.info(notification.message, {
        description: notification.taskId ? `Tarefa #${notification.taskId.slice(0, 8)}` : undefined,
        duration: 5000,
      });
    });

    // Debug: escutar TODOS os eventos
    socket.onAny((eventName, ...args) => {
      console.log(`[WebSocket Event] ${eventName}:`, args);
    });

    socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    socketRef.current = socket;
  }, [addNotification]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log('🔌 WebSocket disconnected manually');
    }
  }, []);

  useEffect(() => {
    // Conecta apenas uma vez quando o componente monta
    connect();

    // Desconecta quando o componente desmonta
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio = executa apenas na montagem

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
  };
}

function mapNotificationType(type: string): 'info' | 'success' | 'warning' | 'error' {
  const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    TASK_CREATED: 'info',
    TASK_UPDATED: 'info',
    TASK_ASSIGNED: 'success',
    TASK_STATUS_CHANGED: 'info',
    COMMENT_NEW: 'info',
  };

  return typeMap[type] || 'info';
}
