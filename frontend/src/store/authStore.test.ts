import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });

    it('should have no tokens initially', () => {
      const { accessToken, refreshToken } = useAuthStore.getState();
      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();
    });

    it('should not be loading initially', () => {
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const { error } = useAuthStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should set access and refresh tokens', () => {
      useAuthStore.getState().setTokens('access-123', 'refresh-456');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-123');
      expect(state.refreshToken).toBe('refresh-456');
    });

    it('should set isAuthenticated to true', () => {
      useAuthStore.getState().setTokens('access', 'refresh');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should clear any existing error', () => {
      useAuthStore.setState({ error: 'Previous error' });
      useAuthStore.getState().setTokens('access', 'refresh');

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user data', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'analyst' as const,
        is_active: true,
      };

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@test.com', role: 'admin', is_active: true },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      useAuthStore.getState().setError('Invalid credentials');

      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    it('should clear error when set to null', () => {
      useAuthStore.setState({ error: 'Some error' });
      useAuthStore.getState().setError(null);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      useAuthStore.getState().setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      useAuthStore.setState({ isLoading: true });
      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Role Permissions', () => {
    describe('hasRole', () => {
      it('should return false when user is null', () => {
        expect(useAuthStore.getState().hasRole('viewer')).toBe(false);
      });

      it('should return true for admin with any role', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'admin@test.com', role: 'admin', is_active: true },
        });

        expect(useAuthStore.getState().hasRole('admin')).toBe(true);
        expect(useAuthStore.getState().hasRole('manager')).toBe(true);
        expect(useAuthStore.getState().hasRole('analyst')).toBe(true);
        expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      });

      it('should return correct permissions for manager', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'manager@test.com', role: 'manager', is_active: true },
        });

        expect(useAuthStore.getState().hasRole('admin')).toBe(false);
        expect(useAuthStore.getState().hasRole('manager')).toBe(true);
        expect(useAuthStore.getState().hasRole('analyst')).toBe(true);
        expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      });

      it('should return correct permissions for analyst', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'analyst@test.com', role: 'analyst', is_active: true },
        });

        expect(useAuthStore.getState().hasRole('admin')).toBe(false);
        expect(useAuthStore.getState().hasRole('manager')).toBe(false);
        expect(useAuthStore.getState().hasRole('analyst')).toBe(true);
        expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      });

      it('should return correct permissions for viewer', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        expect(useAuthStore.getState().hasRole('admin')).toBe(false);
        expect(useAuthStore.getState().hasRole('manager')).toBe(false);
        expect(useAuthStore.getState().hasRole('analyst')).toBe(false);
        expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      });
    });

    describe('canManage', () => {
      it('should return false for viewer', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        expect(useAuthStore.getState().canManage()).toBe(false);
      });

      it('should return true for manager', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'manager@test.com', role: 'manager', is_active: true },
        });

        expect(useAuthStore.getState().canManage()).toBe(true);
      });
    });

    describe('canAnalyze', () => {
      it('should return false for viewer', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        expect(useAuthStore.getState().canAnalyze()).toBe(false);
      });

      it('should return true for analyst', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'analyst@test.com', role: 'analyst', is_active: true },
        });

        expect(useAuthStore.getState().canAnalyze()).toBe(true);
      });
    });

    describe('canView', () => {
      it('should return true for any authenticated user', () => {
        useAuthStore.setState({
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        expect(useAuthStore.getState().canView()).toBe(true);
      });

      it('should return false for unauthenticated user', () => {
        expect(useAuthStore.getState().canView()).toBe(false);
      });
    });
  });
});
