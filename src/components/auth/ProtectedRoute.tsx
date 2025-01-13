import { Navigate } from 'react-router-dom';
import { useAuthPermissions } from '../../hooks/useAuthPermissions';
import type { Permission } from '../../types/permission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requireAll = true,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, hasAllPermissions, hasAnyPermission } = useAuthPermissions();

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  const hasAccess = requiredPermissions.length === 0 ? true :
    requireAll ? hasAllPermissions(requiredPermissions) : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
} 