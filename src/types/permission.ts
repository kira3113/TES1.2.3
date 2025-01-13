export type Permission = 
  | 'manage_users'
  | 'view_users'
  | 'manage_products'
  | 'view_products'
  | 'manage_sales'
  | 'view_sales'
  | 'manage_customers'
  | 'view_customers'
  | 'view_reports'
  | 'manage_settings'
  | 'view_logs'
  | 'manage_backups';

export type RolePermissions = Record<Permission, boolean>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  isSystem?: boolean;
  parentRoleId?: string;
}

export interface RoleHierarchy {
  role: Role;
  children: RoleHierarchy[];
} 