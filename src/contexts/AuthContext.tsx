import { createContext, useContext, useState, useEffect } from 'react';
import { sessionService } from '../services/sessionService';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import toast from 'react-hot-toast';
import type { Session, SessionUser } from '../types/session';

export interface AuthContextType {
  session: Session | null;
  user: {
    role?: {
      permissions?: Record<string, boolean>;
    };
  } | null;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => sessionService.getSession());
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    // Check session validity periodically
    const interval = setInterval(() => {
      if (!sessionService.isSessionValid()) {
        setSession(null);
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: signIn called with:', { email, password });
      const authenticatedUser = userService.authenticateUser(email, password);
      console.log('AuthContext: authentication result:', authenticatedUser);
      
      if (!authenticatedUser) {
        throw new Error('Invalid credentials');
      }

      // Get user role and permissions
      const userRole = roleService.getRoles().find(r => r.id === authenticatedUser.role);
      
      // Set user with role and permissions
      setUser({
        role: {
          permissions: userRole?.permissions || {}
        }
      });

      const sessionUser: SessionUser = {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        roleId: authenticatedUser.role
      };
      
      console.log('AuthContext: creating session for:', sessionUser);
      const newSession = sessionService.createSession(sessionUser);
      setSession(newSession);
      
      // Enhanced welcome message
      const lastLogin = new Date(authenticatedUser.lastLogin).toLocaleString();
      toast.success(
        <div>
          <p className="font-medium">Welcome back, {authenticatedUser.name}!</p>
          <p className="text-sm text-gray-600">Logged in as {userRole?.name || 'User'}</p>
          <p className="text-xs text-gray-500 mt-1">Last login: {lastLogin}</p>
        </div>,
        { 
          duration: 4000,
          icon: '👋',
          position: 'top-right',
          style: {
            borderLeft: '4px solid #4CAF50',
            padding: '16px'
          }
        }
      );
    } catch (error) {
      setUser(null);
      toast.error(
        <div>
          <p className="font-medium">Login Failed</p>
          <p className="text-sm text-gray-600">Please check your credentials</p>
        </div>,
        {
          icon: '❌',
          duration: 3000
        }
      );
      throw error;
    }
  };

  const logout = () => {
    sessionService.clearSession();
    setSession(null);
    setUser(null);
  };

  const refreshSession = () => {
    const refreshedSession = sessionService.refreshSession();
    setSession(refreshedSession);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user,
      signIn,
      logout,
      refreshSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}