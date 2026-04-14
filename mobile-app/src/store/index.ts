/**
 * State management store using Zustand
 */
import { create } from 'zustand';
import { User } from '@/types';
import storageService from '@services/storage/storageService';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  hydrateUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user: User | null) => {
    if (user) {
      storageService.saveUser(user);
    }
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error }),

  logout: async () => {
    await storageService.clearAuthTokens();
    await storageService.clearUser();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  hydrateUser: async () => {
    try {
      const user = await storageService.getUser();
      if (user) {
        set({
          user,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error hydrating user:', error);
    }
  },
}));

/**
 * UI/Theme state
 */
export interface UIState {
  isDarkMode: boolean;
  isLoading: boolean;
  
  // Actions
  toggleDarkMode: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  isLoading: false,

  toggleDarkMode: () =>
    set((state) => {
      storageService.savePreferences('darkMode', !state.isDarkMode);
      return { isDarkMode: !state.isDarkMode };
    }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));

/**
 * Complaint state
 */
import { Complaint } from '@/types';

export interface ComplaintState {
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setComplaints: (complaints: Complaint[]) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (id: string, complaint: Complaint) => void;
  setSelectedComplaint: (complaint: Complaint | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearComplaints: () => void;
}

export const useComplaintStore = create<ComplaintState>((set) => ({
  complaints: [],
  selectedComplaint: null,
  isLoading: false,
  error: null,

  setComplaints: (complaints: Complaint[]) => set({ complaints }),

  addComplaint: (complaint: Complaint) =>
    set((state) => ({
      complaints: [complaint, ...state.complaints],
    })),

  updateComplaint: (id: string, complaint: Complaint) =>
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? complaint : c)),
    })),

  setSelectedComplaint: (complaint: Complaint | null) =>
    set({ selectedComplaint: complaint }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  clearComplaints: () => set({ complaints: [], selectedComplaint: null }),
}));

/**
 * Notification state
 */
import { Notification } from '@/types';

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications: Notification[]) => set({ notifications }),

  addNotification: (notification: Notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  markAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  setUnreadCount: (count: number) => set({ unreadCount: count }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
