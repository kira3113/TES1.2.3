import { useCallback } from 'react';
import { roleService } from '../services/roleService';
import type { Permission } from '../types/permission';

export function usePermissions(roleId: string) {
  const hasPermission = useCallback((permission: Permission) => {
    return roleService.hasPermission(roleId, permission);
  }, [roleId]);

  const hasAnyPermission = useCallback((permissions: Permission[]) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
} 