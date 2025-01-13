import type { Session, SessionUser } from '../types/session';
import { roleService } from './roleService';

const SESSION_KEY = 'user_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const sessionService = {
  createSession(user: SessionUser): Session {
    const role = roleService.getRoles().find(r => r.id === user.roleId);
    if (!role) throw new Error('Invalid role');

    const session: Session = {
      id: crypto.randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      roleId: user.roleId,
      role,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  getSession(): Session | null {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session: Session = JSON.parse(sessionData);
    if (new Date(session.expiresAt) < new Date()) {
      this.clearSession();
      return null;
    }

    return session;
  },

  updateSession(updates: Partial<Session>): Session {
    const currentSession = this.getSession();
    if (!currentSession) throw new Error('No active session');

    const updatedSession = {
      ...currentSession,
      ...updates,
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  refreshSession(): Session | null {
    const currentSession = this.getSession();
    if (!currentSession) return null;

    return this.updateSession({});
  },

  isSessionValid(): boolean {
    const session = this.getSession();
    return !!session && new Date(session.expiresAt) > new Date();
  }
}; 