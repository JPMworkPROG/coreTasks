import { create } from 'zustand';
import { Notification, User } from '@/lib/types';

const generateId = () => Math.random().toString(36).slice(2, 9);

interface AuthStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: generateId(),
          createdAt: new Date(),
        },
        ...state.notifications,
      ].slice(0, 10),
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
