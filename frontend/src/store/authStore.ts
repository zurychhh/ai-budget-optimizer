import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  manager: 3,
  analyst: 2,
  viewer: 1,
};

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Permission helpers
  hasRole: (requiredRole: UserRole) => boolean;
  canManage: () => boolean;
  canAnalyze: () => boolean;
  canView: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          error: null,
        }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),

      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),

      // Permission helpers
      hasRole: (requiredRole) => {
        const { user } = get();
        if (!user) return false;
        return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
      },

      canManage: () => get().hasRole('manager'),
      canAnalyze: () => get().hasRole('analyst'),
      canView: () => get().hasRole('viewer'),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
