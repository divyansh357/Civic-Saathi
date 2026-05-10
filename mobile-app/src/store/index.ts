/**
 * State management store using Zustand
 */
import { create } from 'zustand';
import { Complaint, Notification, User } from '@/types';
import authService from '@services/api/authService';
import storageService from '@services/storage/storageService';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  hydrateUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const session = await authService.login(email, password);
      await storageService.saveAuthTokens(session.tokens);
      await storageService.saveUser(session.user);

      set({
        user: session.user,
        accessToken: session.tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      throw error;
    }
  },

  setUser: (user: User | null) => {
    if (user) {
      void storageService.saveUser(user);
    }

    set({
      user,
      accessToken: null,
      isAuthenticated: !!user,
      error: null
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error }),

  logout: async () => {
    set({ isLoading: true });

    const refreshToken = await storageService.getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Continue local cleanup even when server revocation fails.
      }
    }

    await storageService.clearAuthTokens();
    await storageService.clearUser();

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },

  hydrateUser: async () => {
    set({ isLoading: true, error: null });

    try {
      const accessToken = await storageService.getAccessToken();
      const refreshToken = await storageService.getRefreshToken();

      if (!accessToken) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      const session = await authService.restoreSession(accessToken, refreshToken ?? undefined);
      await storageService.saveAuthTokens(session.tokens);
      await storageService.saveUser(session.user);

      set({
        user: session.user,
        accessToken: session.tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      await storageService.clearAuthTokens();
      await storageService.clearUser();

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session restore failed'
      });
    }
  }
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
      void storageService.savePreferences('darkMode', !state.isDarkMode);
      return { isDarkMode: !state.isDarkMode };
    }),

  setLoading: (loading: boolean) => set({ isLoading: loading })
}));

/**
 * Complaint state
 */
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
      complaints: [complaint, ...state.complaints]
    })),

  updateComplaint: (id: string, complaint: Complaint) =>
    set((state) => ({
      complaints: state.complaints.map((item) => (item.id === id ? complaint : item))
    })),

  setSelectedComplaint: (complaint: Complaint | null) => set({ selectedComplaint: complaint }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  clearComplaints: () => set({ complaints: [], selectedComplaint: null })
}));

/**
 * Notification state
 */
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
      notifications: [notification, ...state.notifications]
    })),

  markAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),

  setUnreadCount: (count: number) => set({ unreadCount: count }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 })
}));
