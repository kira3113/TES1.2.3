import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import type { Permission } from '../../types/permission';

interface AdminRouteProps {
  fallbackPath?: string;
}

export function AdminRoute({ fallbackPath = '/login' }: AdminRouteProps) {
  const { session } = useAuth();
  const { hasAllPermissions } = usePermissions(session?.roleId || '');

  if (!session) {
    return <Navigate to={fallbackPath} replace />;
  }

  const adminPermissions: Permission[] = [
    'manage_users',
    'view_users',
    'manage_products',
    'view_products',
    'manage_sales',
    'view_sales',
    'manage_customers',
    'view_customers',
    'view_reports',
    'manage_settings',
    'view_logs',
    'manage_backups'
  ];

  const hasAdminAccess = hasAllPermissions(adminPermissions);

  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
} 