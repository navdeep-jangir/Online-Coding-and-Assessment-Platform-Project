import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoadingFallback } from '@/components/common/LoadingSkeleton';

export interface AdminRouteProps {
  children?: ReactNode;
  redirectTo?: string;
}

export function AdminRoute({
  children,
  redirectTo = '/dashboard',
}: AdminRouteProps) {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoadingFallback />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default AdminRoute;
