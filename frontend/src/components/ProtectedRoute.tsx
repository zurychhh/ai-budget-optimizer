import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // User doesn't have required role, redirect to dashboard with error
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
