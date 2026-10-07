import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserRole, Permission, hasPermission } from '@hrx/shared';
import {
  apiRequest,
  setAccessToken,
  getAccessToken,
  setOnSessionExpired,
} from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  // Listen for session expiration events from the api client
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
    });
  }, []);

  // Silent refresh on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // Attempt silent refresh using HttpOnly cookie
        const res = await apiRequest<{ accessToken: string }>('/auth/refresh', {
          method: 'POST',
        });
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          // Fetch user profile
          const meRes = await apiRequest<AuthUser>('/auth/me');
          if (meRes.data) {
            setUser(meRes.data);
          }
        }
      } catch {
        // Not logged in or expired cookie
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ user: AuthUser; tokens: { accessToken: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      if (res.data) {
        setAccessToken(res.data.tokens.accessToken);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
