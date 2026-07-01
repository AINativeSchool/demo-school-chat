import type { AuthResponse, InviteCode, PublicUser, Session } from '@school-chat/shared';
import { apiClient, ApiError } from '../api/client';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

let cachedUser: PublicUser | null = null;

/** Maps API errors to auth errors for the UI layer. */
function wrapAuthError(err: unknown): never {
  if (err instanceof ApiError) {
    throw new AuthError(err.message);
  }
  throw err;
}

/** Handles server-backed registration, login, and profile management. */
export const authService = {
  /** Restores the session from a stored JWT on app load. */
  async loadSession(): Promise<void> {
    if (!apiClient.getToken()) {
      cachedUser = null;
      return;
    }

    try {
      const { user } = await apiClient.get<{ user: PublicUser }>('/auth/me');
      cachedUser = user;
    } catch {
      apiClient.setToken(null);
      cachedUser = null;
    }
  },

  async register(
    inviteCode: string,
    username: string,
    password: string,
    displayName: string,
  ): Promise<PublicUser> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        inviteCode,
        username,
        password,
        displayName,
      });
      apiClient.setToken(response.token);
      cachedUser = response.user;
      return response.user;
    } catch (err) {
      wrapAuthError(err);
    }
  },

  async login(username: string, password: string): Promise<PublicUser> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { username, password });
      apiClient.setToken(response.token);
      cachedUser = response.user;
      return response.user;
    } catch (err) {
      wrapAuthError(err);
    }
  },

  logout(): void {
    apiClient.setToken(null);
    cachedUser = null;
  },

  getSession(): Session | null {
    if (!cachedUser || !apiClient.getToken()) return null;
    return {
      userId: cachedUser.id,
      username: cachedUser.username,
      displayName: cachedUser.displayName,
    };
  },

  getCurrentUser(): PublicUser | null {
    return cachedUser;
  },

  async updateProfile(updates: { displayName?: string; avatarUrl?: string }): Promise<PublicUser> {
    try {
      const { user } = await apiClient.patch<{ user: PublicUser }>('/auth/me', updates);
      cachedUser = user;
      return user;
    } catch (err) {
      wrapAuthError(err);
    }
  },

  async listMyInviteCodes(): Promise<InviteCode[]> {
    try {
      const { codes } = await apiClient.get<{ codes: InviteCode[] }>('/invites/mine');
      return codes;
    } catch (err) {
      wrapAuthError(err);
    }
  },

  async generateInviteCode(): Promise<string> {
    try {
      const { code } = await apiClient.post<{ code: string }>('/invites');
      return code;
    } catch (err) {
      wrapAuthError(err);
    }
  },
};
