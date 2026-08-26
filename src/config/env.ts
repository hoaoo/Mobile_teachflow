import { Platform } from 'react-native';

const getDevApiBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android Emulator host loopback address
    return 'http://10.0.2.2:3001/api';
  }
  // iOS Simulator or Web localhost
  return 'http://localhost:3001/api';
};

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || getDevApiBaseUrl(),
} as const;
