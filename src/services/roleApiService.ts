import { apiClient } from './apiClient';
import type { Role } from '../types/permission';

export const roleApiService = {
  getRoles() {
    return apiClient.get<Role[]>('/roles', {
      requireAuth: true,
      requiredPermissions: ['view_users']
    });
  },

  createRole(roleData: Omit<Role, 'id'>) {
    return apiClient.post<Role>('/roles', roleData, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    });
  },

  updateRole(roleId: string, roleData: Partial<Role>) {
    return apiClient.put<Role>(`/roles/${roleId}`, roleData, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    });
  },

  deleteRole(roleId: string) {
    return apiClient.delete<void>(`/roles/${roleId}`, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    });
  }
}; 