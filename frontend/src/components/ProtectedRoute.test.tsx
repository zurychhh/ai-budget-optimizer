import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Helper to render with custom routes
function renderWithRoutes(
  initialPath: string,
  requiredRole?: 'admin' | 'manager' | 'analyst' | 'viewer'
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <div>Admin Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute requiredRole="manager">
              <div>Manager Page</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
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

  describe('Authentication', () => {
    it('should redirect to login when not authenticated', () => {
      renderWithRoutes('/protected');

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when authenticated', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: '1', email: 'test@test.com', role: 'viewer', is_active: true },
      });

      renderWithRoutes('/protected');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access', () => {
    describe('Admin role', () => {
      it('should allow admin to access admin page', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'admin@test.com', role: 'admin', is_active: true },
        });

        renderWithRoutes('/admin');

        expect(screen.getByText('Admin Page')).toBeInTheDocument();
      });

      it('should allow admin to access manager page', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'admin@test.com', role: 'admin', is_active: true },
        });

        renderWithRoutes('/manager');

        expect(screen.getByText('Manager Page')).toBeInTheDocument();
      });
    });

    describe('Manager role', () => {
      it('should redirect manager from admin page to dashboard', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'manager@test.com', role: 'manager', is_active: true },
        });

        renderWithRoutes('/admin');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
      });

      it('should allow manager to access manager page', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'manager@test.com', role: 'manager', is_active: true },
        });

        renderWithRoutes('/manager');

        expect(screen.getByText('Manager Page')).toBeInTheDocument();
      });
    });

    describe('Analyst role', () => {
      it('should redirect analyst from admin page to dashboard', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'analyst@test.com', role: 'analyst', is_active: true },
        });

        renderWithRoutes('/admin');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      it('should redirect analyst from manager page to dashboard', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'analyst@test.com', role: 'analyst', is_active: true },
        });

        renderWithRoutes('/manager');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      it('should allow analyst to access analyst-level pages', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'analyst@test.com', role: 'analyst', is_active: true },
        });

        renderWithRoutes('/protected', 'analyst');

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('Viewer role', () => {
      it('should redirect viewer from admin page to dashboard', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        renderWithRoutes('/admin');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      it('should allow viewer to access viewer-level pages', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        renderWithRoutes('/protected', 'viewer');

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      it('should redirect viewer from analyst-level pages', () => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
        });

        renderWithRoutes('/protected', 'analyst');

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Without required role', () => {
    it('should render children for any authenticated user', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: '1', email: 'viewer@test.com', role: 'viewer', is_active: true },
      });

      renderWithRoutes('/protected');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
