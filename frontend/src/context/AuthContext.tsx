import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, LoginCredentials, UserProfile } from '@/types/auth';
import { ApiResponse } from '@/types/api';
import { apiClient } from '@/lib/apiClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize CSRF token and restore active session if present
  const checkSession = useCallback(async () => {
    try {
      // 1. Initialize CSRF token cookie
      try {
        await apiClient.get('/auth/csrf');
      } catch {
        // Silently continue if csrf endpoint fails (e.g. backend offline during local test)
      }

      // 2. Query current session profile
      const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
      if (response && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (credentials: LoginCredentials): Promise<UserProfile> => {
    // Ensure CSRF token cookie is loaded prior to POST
    try {
      await apiClient.get('/auth/csrf');
    } catch {
      // ignore
    }

    const response = await apiClient.post<ApiResponse<UserProfile>>('/auth/login', credentials);
    setUser(response.data);
    return response.data;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
