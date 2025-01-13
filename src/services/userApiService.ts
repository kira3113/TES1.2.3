import { apiClient } from './apiClient';
import type { User } from '../types/user';

export const userApiService = {
  getUsers() {
    return apiClient.get<User[]>('/users', {
      requireAuth: true,
      requiredPermissions: ['view_users']
    });
  },

  createUser(userData: Omit<User, 'id'>) {
    return apiClient.post<User>('/users', userData, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    });
  },

  updateUser(userId: string, userData: Partial<User>) {
    return apiClient.put<User>(`/users/${userId}`, userData, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    });
  },

  deleteUser(userId: string) {
    return apiClient.delete<void>(`/users/${userId}`, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    });
  }
}; 