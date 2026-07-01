import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PublicUser, Session } from '@school-chat/shared';
import { apiClient } from '../api/client';
import { authService } from '../services/authService';

interface AuthContextValue {
  session: Session | null;
  user: PublicUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (inviteCode: string, username: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides auth state and actions to the component tree. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      authService.logout();
      refresh();
    });

    authService.loadSession().finally(() => {
      setLoading(false);
      refresh();
    });

    return () => apiClient.setUnauthorizedHandler(null);
  }, [refresh]);

  const session = useMemo(() => authService.getSession(), [tick]);
  const user = useMemo(() => authService.getCurrentUser(), [tick]);

  const login = useCallback(async (username: string, password: string) => {
    await authService.login(username, password);
    refresh();
  }, [refresh]);

  const register = useCallback(
    async (inviteCode: string, username: string, password: string, displayName: string) => {
      await authService.register(inviteCode, username, password, displayName);
      refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    authService.logout();
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ session, user, loading, login, register, logout, refresh }),
    [session, user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access auth context from any child component. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
