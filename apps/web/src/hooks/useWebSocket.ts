import { useEffect } from 'react';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { config } from '@/lib/config';

/**
 * Custom hook to simulate WebSocket notifications.
 * In a real application, this would connect to an actual WebSocket server.
 */
export const useWebSocket = (tasks: Task[] | undefined) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!currentUser || !tasks?.length) return;

    const interval = setInterval(() => {
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

      if (randomTask && Math.random() > config.websocket.notificationProbability) {
        const notifications = [
          {
            message: `${randomTask.title} foi atualizada`,
            read: false,
            type: 'info' as const,
          },
          {
            message: `Novo comentário em: ${randomTask.title}`,
            read: false,
            type: 'info' as const,
          },
          {
            message: `Tarefa próxima do prazo: ${randomTask.title}`,
            read: false,
            type: 'warning' as const,
          },
        ];

        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        addNotification(randomNotification);
      }
    }, config.websocket.interval);

    return () => clearInterval(interval);
  }, [currentUser, tasks, addNotification]);
};
