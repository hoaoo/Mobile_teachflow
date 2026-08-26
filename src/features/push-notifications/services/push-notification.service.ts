import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { apiClient, type RegisterDeviceRequest } from '@/api/client';

const PUSH_TOKEN_STORAGE_KEY = 'teachflow_current_push_token';

/**
 * Configure Android Notification Channels for different business domains
 */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // 1. Default general channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo chung',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#103C36',
    });

    // 2. Schedule reminders
    await Notifications.setNotificationChannelAsync('schedule', {
      name: 'Lịch giảng dạy & Tiết học',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#0284C7',
      sound: 'default',
    });

    // 3. Task & deadline reminders
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'Nhiệm vụ & Hạn công việc',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D97706',
      sound: 'default',
    });

    // 4. Attendance & homeroom reminders
    await Notifications.setNotificationChannelAsync('attendance', {
      name: 'Chuyên cần & Chủ nhiệm',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#059669',
    });
  } catch (err) {
    // Non-fatal error during channel setup
    console.warn('[PushNotification] Failed to setup Android channels:', err);
  }
}

/**
 * Obtain EAS Project ID safely from Expo Constants or environment
 */
export function getEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants as any).easConfig?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  );
}

/**
 * Get locally stored active push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Register device for Push Notifications:
 * 1. Verifies physical device capability
 * 2. Checks/requests OS permission
 * 3. Retrieves ExpoPushToken using EAS projectId
 * 4. Idempotently registers token with TeachFlow Backend
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Push notifications are only received on real physical devices
    if (!Device.isDevice) {
      console.log('[PushNotification] Running on simulator/emulator - push tokens are only available on physical devices');
      return null;
    }

    // 1. Check existing permission
    const settings = await Notifications.getPermissionsAsync();
    let finalStatus = settings.status;

    // 2. Request permission if undetermined
    if (settings.status !== 'granted') {
      const requestResult = await Notifications.requestPermissionsAsync();
      finalStatus = requestResult.status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotification] Notification permission not granted:', finalStatus);
      return null;
    }

    // 3. Obtain EAS project ID and ExpoPushToken
    const projectId = getEasProjectId();
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    if (!token) {
      return null;
    }

    // 4. Register token with backend
    const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
    const payload: RegisterDeviceRequest = {
      expoPushToken: token,
      platform,
      deviceModel: Device.modelName || undefined,
      appVersion: Constants.expoConfig?.version || '1.0.0',
    };

    await apiClient.registerDevice(payload);

    // 5. Store token locally for future unregistering
    await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, token);

    console.log('[PushNotification] Successfully registered device with backend');
    return token;
  } catch (err: any) {
    console.warn('[PushNotification] Registration error:', err?.message || err);
    return null;
  }
}

/**
 * Unregister device token with TeachFlow backend on Logout
 */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  try {
    const storedToken = await getStoredPushToken();
    if (storedToken) {
      await apiClient.unregisterDevice({ expoPushToken: storedToken }).catch(() => {});
      await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY).catch(() => {});
    }
  } catch (err) {
    console.warn('[PushNotification] Unregistration error:', err);
  }
}
