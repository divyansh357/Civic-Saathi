import { create } from 'zustand';
import { User, Complaint, Assignment, Notification } from '../types';
import { apiGet, apiPost } from '../services/api/client';

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface MeResponse {
  userId: string;
  name: string;
  email: string;
  role?: string;
}

const ACCESS_KEY = 'civic.auth.accessToken';
const REFRESH_KEY = 'civic.auth.refreshToken';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: async () => {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!accessToken) { set({ isLoading: false }); return; }
    set({ isLoading: true });
    try {
      const me = await apiGet<MeResponse>('/auth/me', accessToken);
      set({
        user: { id: me.userId, name: me.name, email: me.email, role: (me.role ?? 'CITIZEN') as User['role'] },
        accessToken, refreshToken, isAuthenticated: true, isLoading: false
      });
    } catch {
      if (refreshToken) {
        try {
          const r = await apiPost<AuthResponse, { refreshToken: string }>('/auth/refresh', { refreshToken });
          const newToken = r.accessToken ?? r.token ?? '';
          const me = await apiGet<MeResponse>('/auth/me', newToken);
          localStorage.setItem(ACCESS_KEY, newToken);
          if (r.refreshToken) localStorage.setItem(REFRESH_KEY, r.refreshToken);
          set({
            user: { id: me.userId, name: me.name, email: me.email, role: (me.role ?? 'CITIZEN') as User['role'] },
            accessToken: newToken, refreshToken: r.refreshToken ?? refreshToken,
            isAuthenticated: true, isLoading: false
          });
          return;
        } catch { /* fall through */ }
      }
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const auth = await apiPost<AuthResponse, { email: string; password: string }>('/auth/login', { email, password });
      const accessToken = auth.accessToken ?? auth.token ?? '';
      if (!accessToken) throw new Error('No access token in response');
      const me = await apiGet<MeResponse>('/auth/me', accessToken);
      localStorage.setItem(ACCESS_KEY, accessToken);
      if (auth.refreshToken) localStorage.setItem(REFRESH_KEY, auth.refreshToken);
      set({
        user: { id: me.userId, name: me.name, email: me.email, role: (me.role ?? 'CITIZEN') as User['role'] },
        accessToken, refreshToken: auth.refreshToken ?? null,
        isAuthenticated: true, isLoading: false, error: null
      });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Login failed', isAuthenticated: false });
      throw e;
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      try { await apiPost('/auth/logout', { refreshToken }); } catch { /* ignore */ }
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  }
}));

// ─── Complaint Store ──────────────────────────────────────────────────────────

export interface ComplaintState {
  complaints: Complaint[];
  total: number;
  page: number;
  isLoading: boolean;
  error: string | null;
  setComplaints: (complaints: Complaint[], total?: number) => void;
  setPage: (page: number) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useComplaintStore = create<ComplaintState>((set) => ({
  complaints: [],
  total: 0,
  page: 0,
  isLoading: false,
  error: null,
  setComplaints: (complaints, total) => set({ complaints, total: total ?? complaints.length }),
  setPage: (page) => set({ page }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));

// ─── Assignment Store ─────────────────────────────────────────────────────────

export interface AssignmentState {
  assignments: Assignment[];
  overdueCount: number;
  isLoading: boolean;
  setAssignments: (a: Assignment[]) => void;
  setOverdueCount: (n: number) => void;
  setLoading: (v: boolean) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  overdueCount: 0,
  isLoading: false,
  setAssignments: (assignments) => set({ assignments }),
  setOverdueCount: (overdueCount) => set({ overdueCount }),
  setLoading: (isLoading) => set({ isLoading })
}));

// ─── Notification Store ───────────────────────────────────────────────────────

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (n: Notification[]) => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1)
    }))
}));
