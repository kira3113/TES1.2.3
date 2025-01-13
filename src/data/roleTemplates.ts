import type { Role } from '../types/permission';

export const roleTemplates: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    permissions: {
      manage_users: true,
      view_users: true,
      manage_products: true,
      view_products: true,
      manage_sales: true,
      view_sales: true,
      manage_customers: true,
      view_customers: true,
      view_reports: true,
      manage_settings: true,
      view_logs: true,
      manage_backups: true
    }
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Store management access',
    permissions: {
      manage_users: false,
      view_users: true,
      manage_products: true,
      view_products: true,
      manage_sales: true,
      view_sales: true,
      manage_customers: true,
      view_customers: true,
      view_reports: true,
      manage_settings: false,
      view_logs: true,
      manage_backups: false
    }
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Basic staff access',
    permissions: {
      manage_users: false,
      view_users: false,
      manage_products: false,
      view_products: true,
      manage_sales: true,
      view_sales: true,
      manage_customers: false,
      view_customers: true,
      view_reports: false,
      manage_settings: false,
      view_logs: false,
      manage_backups: false
    }
  }
]; 