import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { apiClient } from '@/api/client';
import { useAuth } from '@/auth';

interface NotificationContextType {
  unreadCount: number;
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: (amount?: number) => void;
  clearUnreadCount: () => void;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCountState] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCountState(0);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.getUnreadNotificationCount();
      setUnreadCountState(Math.max(0, res?.count || 0));
    } catch {
      // Silently ignore to prevent UX disruption
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch when authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchInit = async () => {
      if (!user) {
        if (isMounted) setUnreadCountState(0);
        return;
      }
      try {
        const res = await apiClient.getUnreadNotificationCount();
        if (isMounted) {
          setUnreadCountState(Math.max(0, res?.count || 0));
        }
      } catch {
        // Ignored
      }
    };

    fetchInit();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Listen to AppState (when user returns to app)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        refreshUnreadCount();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [user, refreshUnreadCount]);

  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCountState((prev) => Math.max(0, prev - amount));
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCountState(0);
  }, []);

  const setUnreadCount = useCallback((count: number) => {
    setUnreadCountState(Math.max(0, count));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        loading,
        refreshUnreadCount,
        decrementUnreadCount,
        clearUnreadCount,
        setUnreadCount,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
