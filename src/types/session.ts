import type { Role } from './permission';

export interface Session {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  userId: string;
  userEmail: string;
  userName: string;
  roleId: string;
  role: Role;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
} 