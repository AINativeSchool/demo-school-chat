import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@school-chat/shared';
import { authService } from '../services/authService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (inviteCode: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides auth state and actions to the component tree. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const session = useMemo(() => authService.getSession(), [tick]);
  const user = useMemo(() => authService.getCurrentUser(), [tick]);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    refresh();
  }, [refresh]);

  const register = useCallback(
    async (inviteCode: string, email: string, password: string, displayName: string) => {
      await authService.register(inviteCode, email, password, displayName);
      refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    authService.logout();
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ session, user, login, register, logout, refresh }),
    [session, user, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access auth context from any child component. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
