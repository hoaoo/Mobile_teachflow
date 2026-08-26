import React, { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { apiClient, type LoginRequest, type UserResponse } from '@/api/client';
import { tokenStorage } from '@/services/storage.service';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadStoredUser = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) {
          if (isMounted) setUser(null);
          return;
        }

        const profile = await apiClient.getMe();
        if (isMounted) {
          setUser(profile);
        }
      } catch {
        await tokenStorage.clearTokens();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        try {
          await SplashScreen.hideAsync();
        } catch {
          // Splash screen may already be hidden
        }
      }
    };

    loadStoredUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(async () => {
      await tokenStorage.clearTokens();
      setUser(null);
    });

    return () => {
      apiClient.setUnauthorizedHandler(undefined);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const res = await apiClient.login(credentials);
    await tokenStorage.setAccessToken(res.accessToken);
    if (res.refreshToken) {
      await tokenStorage.setRefreshToken(res.refreshToken);
    }

    const profile = await apiClient.getMe();
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Continue clearing client credentials even if backend logout fails
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
