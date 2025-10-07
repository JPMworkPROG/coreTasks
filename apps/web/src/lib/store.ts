import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification, User } from '@/lib/types';

const generateId = () => Math.random().toString(36).slice(2, 9);

interface AuthStore {
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: User; accessToken: string; refreshToken: string }) => void;
  setCurrentUser: (user: User | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          currentUser: user,
          accessToken,
          refreshToken,
        }),
      setCurrentUser: (user) =>
        set((state) => ({
          currentUser: user,
          accessToken: user ? state.accessToken : null,
          refreshToken: user ? state.refreshToken : null,
        })),
      setTokens: ({ accessToken, refreshToken }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          currentUser: state.currentUser,
        })),
      logout: () =>
        set({
          currentUser: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: 'coretasks-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

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
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
