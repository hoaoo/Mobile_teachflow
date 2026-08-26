import { ENV } from '@/config/env';
import { tokenStorage } from '@/services/storage.service';
import type { components } from './openapi-types';

export type LoginRequest = components['schemas']['LoginDto'];
export type AuthResponse = components['schemas']['AuthResponseDto'];
export type UserResponse = components['schemas']['UserResponseDto'];
export type TeacherProfile = components['schemas']['TeacherProfileResponseDto'];

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public override readonly message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private get baseUrl(): string {
    return ENV.API_BASE_URL.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = await tokenStorage.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        // Parse friendly error message without exposing backend internals
        let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
        let errorCode: string | undefined;

        if (data) {
          if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (Array.isArray(data.message) && data.message.length > 0) {
            errorMessage = data.message[0];
          }
          if (data.code) {
            errorCode = data.code;
          }
        } else if (response.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ';
        } else if (response.status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện hành động này';
        } else if (response.status === 404) {
          errorMessage = 'Không tìm thấy dữ liệu yêu cầu';
        } else if (response.status >= 500) {
          errorMessage = 'Hệ thống đang bảo trì, vui lòng thử lại sau';
        }

        throw new ApiError(response.status, errorMessage, errorCode);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network or connection error (e.g. host unreachable)
      throw new ApiError(
        0,
        'Không thể kết nối đến máy chủ TeachFlow. Vui lòng kiểm tra kết nối mạng.',
      );
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * GET /api/auth/me
   */
  async getMe(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

  /**
   * POST /api/auth/logout
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const refreshToken = await tokenStorage.getRefreshToken();
    try {
      return await this.request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return { success: true, message: 'Đã đăng xuất' };
    }
  }
}

export const apiClient = new ApiClient();
