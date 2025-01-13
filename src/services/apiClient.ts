import { sessionService } from './sessionService';
import type { Session } from '../types/session';

interface ApiError extends Error {
  status?: number;
}

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  requiredPermissions?: string[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getHeaders(session: Session | null = null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    return headers;
  }

  private checkPermissions(session: Session | null, requiredPermissions: string[] = []): boolean {
    if (!session || !requiredPermissions.length) return true;
    return requiredPermissions.every(permission => 
      session.role.permissions[permission as keyof typeof session.role.permissions]
    );
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = new Error('API request failed');
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {
      requireAuth = false,
      requiredPermissions = [],
      ...fetchOptions
    } = options;

    const session = sessionService.getSession();

    if (requireAuth && !session) {
      throw new Error('Authentication required');
    }

    if (!this.checkPermissions(session, requiredPermissions)) {
      throw new Error('Insufficient permissions');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(session),
        ...fetchOptions.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  // Helper methods for common HTTP methods
  async get<T>(endpoint: string, options: ApiOptions = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: ApiOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, options: ApiOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options: ApiOptions = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(); 