import { AuthTokens, User, UserRole } from '@/types';
import { apiGet, apiPost, ApiClientError } from '@services/api/client';

interface BackendAuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
}

interface BackendCurrentUserResponse {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  roles?: string[];
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

const normalizeRole = (role?: string, roles?: string[]): UserRole => {
  // Prefer the single `role` field; fall back to first entry in `roles` array.
  const raw = role ?? (roles && roles.length > 0 ? roles[0] : undefined);
  const value = (raw ?? '').toUpperCase();
  if (value === 'WORKER') return 'WORKER';
  if (value === 'OFFICER') return 'OFFICER';
  if (value === 'ADMIN' || value === 'DEPARTMENT_ADMIN' || value === 'SUPERADMIN') return 'ADMIN';
  return 'CITIZEN';
};

const toUser = (payload: BackendCurrentUserResponse): User => ({
  id: payload.userId,
  name: payload.name,
  email: payload.email,
  phone: payload.phone,
  role: normalizeRole(payload.role, payload.roles)
});

const toAccessToken = (payload: BackendAuthResponse): string => {
  const token = payload.accessToken ?? payload.token;
  if (!token) {
    throw new ApiClientError('Access token missing in auth response');
  }
  return token;
};

class AuthService {
  async login(email: string, password: string): Promise<AuthSession> {
    const authResponse = await apiPost<BackendAuthResponse, { email: string; password: string }>(
      '/auth/login',
      { email, password }
    );

    const accessToken = toAccessToken(authResponse);
    const userPayload = await this.getCurrentUserPayload(accessToken);

    return {
      user: toUser(userPayload),
      tokens: {
        accessToken,
        refreshToken: authResponse.refreshToken
      }
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const refreshResponse = await apiPost<BackendAuthResponse, { refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    return {
      accessToken: toAccessToken(refreshResponse),
      refreshToken: refreshResponse.refreshToken ?? refreshToken
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await apiPost<void, { refreshToken: string }>('/auth/logout', { refreshToken });
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    const payload = await this.getCurrentUserPayload(accessToken);
    return toUser(payload);
  }

  async restoreSession(accessToken: string, refreshToken?: string): Promise<AuthSession> {
    try {
      const user = await this.getCurrentUser(accessToken);
      return {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      if (!(error instanceof ApiClientError) || error.status !== 401 || !refreshToken) {
        throw error;
      }

      const refreshedTokens = await this.refresh(refreshToken);
      const user = await this.getCurrentUser(refreshedTokens.accessToken);

      return {
        user,
        tokens: refreshedTokens
      };
    }
  }

  private getCurrentUserPayload(accessToken: string): Promise<BackendCurrentUserResponse> {
    return apiGet<BackendCurrentUserResponse>('/auth/me', accessToken);
  }
}

const authService = new AuthService();

export default authService;
