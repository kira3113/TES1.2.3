import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './usePermissions';
import type { Permission } from '../types/permission';

export function useAuthPermissions() {
  const { session } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions(session?.roleId || '');

  return {
    isAuthenticated: !!session,
    session,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role: session?.role
  };
} 