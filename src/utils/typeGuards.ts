import type { RolePermissions } from '../types/permission';

export function isRolePermissions(permissions: any): permissions is RolePermissions {
  if (!permissions || typeof permissions !== 'object') return false;
  
  const requiredKeys = [
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

  return requiredKeys.every(key => 
    typeof permissions[key] === 'boolean'
  );
} 