import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'teachflow_access_token';
const REFRESH_TOKEN_KEY = 'teachflow_refresh_token';

/**
 * Storage service abstraction using Expo SecureStore.
 * Ensures access/refresh tokens are stored securely in Keychain (iOS) / KeyStore (Android).
 */
class TokenStorageService {
  private isWeb = Platform.OS === 'web';

  async getAccessToken(): Promise<string | null> {
    try {
      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(ACCESS_TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
        }
        return;
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      // SecureStore error handled silently without exposing token
    }
  }

  async removeAccessToken(): Promise<void> {
    try {
      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      // SecureStore error handled silently
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(REFRESH_TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
        }
        return;
      }
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {
      // SecureStore error handled silently without exposing token
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // SecureStore error handled silently
    }
  }

  async clearTokens(): Promise<void> {
    await Promise.all([this.removeAccessToken(), this.removeRefreshToken()]);
  }
}

export const tokenStorage = new TokenStorageService();
