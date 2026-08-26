import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth';
import { useNotification } from '@/context/notification-context';
import { resolveNotificationRoute } from '@/features/notifications/navigation/notification-navigator';
import {
  registerForPushNotificationsAsync,
  setupAndroidNotificationChannels,
} from '../services/push-notification.service';
import type { NotificationItem, NotificationType } from '@/api/client';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
    shouldShowBanner: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

interface PushNotificationContextValue {
  permissionStatus: Notifications.PermissionStatus | null;
  expoPushToken: string | null;
  isRegistered: boolean;
  requestPermission: () => Promise<boolean>;
}

const PushNotificationContext = createContext<PushNotificationContextValue>({
  permissionStatus: null,
  expoPushToken: null,
  isRegistered: false,
  requestPermission: async () => false,
});

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { refreshUnreadCount } = useNotification();

  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handledColdStartRef = useRef(false);
  const lastHandledResponseIdRef = useRef<string | null>(null);

  // 1. Initial Setup: Channels & Permission Check
  useEffect(() => {
    setupAndroidNotificationChannels();

    Notifications.getPermissionsAsync().then((settings) => {
      setPermissionStatus(settings.status);
    }).catch(() => {});
  }, []);

  // 2. Auto Register when user becomes authenticated
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    let isMounted = true;
    registerForPushNotificationsAsync().then((token) => {
      if (isMounted && token) {
        setExpoPushToken(token);
        setIsRegistered(true);
        setPermissionStatus(Notifications.PermissionStatus.GRANTED);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading]);

  // 3. Helper to navigate from notification payload using Phase 12 shared mapper
  const handleNavigateFromPayload = useCallback(
    (data: any) => {
      if (!data) {
        router.push('/notifications');
        return;
      }

      // Convert push data payload to NotificationItem format
      const notificationItem: NotificationItem = {
        id: data.notificationId || 'push-' + Date.now(),
        userId: data.userId || '',
        title: data.title || '',
        message: data.message || data.body || '',
        body: data.body || data.message || '',
        type: (data.type as NotificationType) || 'SYSTEM',
        targetType: data.targetType || 'SYSTEM',
        targetId: data.targetId || null,
        metadata: data.metadata || {},
        link: data.link || null,
        isRead: false,
        readAt: null,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      const target = resolveNotificationRoute(notificationItem);

      if (target && target.pathname) {
        if (target.params) {
          router.push({
            pathname: target.pathname as any,
            params: target.params,
          });
        } else {
          router.push(target.pathname as any);
        }
      } else {
        // Fallback to notification center
        router.push('/notifications');
      }
    },
    [router],
  );

  // 4. Foreground & User Tap Listeners
  useEffect(() => {
    // A. Received notification while in foreground
    const notificationReceivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[PushNotification] Foreground notification received:', notification.request.content.title);
      // Synchronize unread badge counter in header bell
      refreshUnreadCount();
    });

    // B. User tapped on notification (Foreground / Background / Killed)
    const responseReceivedSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const responseId = response.notification.request.identifier;
      if (lastHandledResponseIdRef.current === responseId) {
        return; // Prevent duplicate tap handling
      }
      lastHandledResponseIdRef.current = responseId;

      console.log('[PushNotification] User tapped notification:', response.notification.request.content.title);
      const data = response.notification.request.content.data;
      handleNavigateFromPayload(data);
    });

    return () => {
      notificationReceivedSub.remove();
      responseReceivedSub.remove();
    };
  }, [refreshUnreadCount, handleNavigateFromPayload]);

  // 5. Cold Start handling (when app was opened directly from a push notification while killed)
  useEffect(() => {
    if (isLoading || !isAuthenticated || handledColdStartRef.current) {
      return;
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && !handledColdStartRef.current) {
        handledColdStartRef.current = true;
        const responseId = response.notification.request.identifier;
        lastHandledResponseIdRef.current = responseId;

        console.log('[PushNotification] Handled cold start notification tap:', response.notification.request.content.title);
        const data = response.notification.request.content.data;
        handleNavigateFromPayload(data);
      }
    }).catch(() => {});
  }, [isLoading, isAuthenticated, handleNavigateFromPayload]);

  // 6. Explicit permission request action
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        setIsRegistered(true);
        setPermissionStatus(Notifications.PermissionStatus.GRANTED);
        return true;
      }
      const settings = await Notifications.getPermissionsAsync();
      setPermissionStatus(settings.status);
      return settings.status === 'granted';
    } catch {
      return false;
    }
  }, []);

  const value = {
    permissionStatus,
    expoPushToken,
    isRegistered,
    requestPermission,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotification() {
  return useContext(PushNotificationContext);
}
