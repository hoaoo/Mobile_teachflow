import { ENV } from '@/config/env';
import { tokenStorage } from '@/services/storage.service';
import type { components } from './openapi-types';

export type LoginRequest = components['schemas']['LoginDto'];
export type AuthResponse = components['schemas']['AuthResponseDto'];
export type UserResponse = components['schemas']['UserResponseDto'];
export type TeacherProfile = components['schemas']['TeacherProfileResponseDto'];

export type CreateClassroomRequest = components['schemas']['CreateClassroomDto'];
export type UpdateClassroomRequest = components['schemas']['UpdateClassroomDto'];
export type AddStudentToClassRequest = components['schemas']['AddStudentToClassDto'];

export type CreateStudentRequest = components['schemas']['CreateStudentDto'];
export type UpdateStudentRequest = components['schemas']['UpdateStudentDto'];

export interface ClassroomStudentItem {
  id: string;
  studentCode?: string;
  name: string;
  fullName: string;
  initials: string;
  gender: string;
  dob: string;
  guardian: string;
  phone: string;
  progress: number;
  status: string;
  attendance: number | null;
  note: string;
  color: string;
  enrollmentId?: string;
}

export interface ClassroomItem {
  id: string;
  code: string;
  name: string;
  gradeId: string;
  grade: string;
  gradeDetail?: { id: string; code: string; name: string; level: number };
  schoolYearId: string;
  schoolYear?: { id: string; name: string; isCurrent: boolean };
  teacherId: string;
  homeroomTeacherId: string | null;
  homeroomTeacher?: { id: string; fullName: string; phone?: string | null };
  room: string;
  schedule: string;
  studentCount: number;
  average: number | null;
  attendance: number | null;
  teacher: string;
  accent: string;
  status: string;
  isActive: boolean;
  students: ClassroomStudentItem[];
}

export interface ClassroomListResponse {
  items: ClassroomItem[];
  summary: {
    totalClasses: number;
    totalStudents: number;
    avgAttendanceRate: number | null;
  };
}

export interface StudentItem {
  id: string;
  studentCode?: string;
  name: string;
  fullName: string;
  initials: string;
  gender: string;
  dob: string;
  guardian: string;
  parentName: string;
  phone: string;
  parentPhone: string;
  progress: number;
  status: string;
  attendance: number | null;
  latestAssessment?: string;
  latestAssessmentText?: string;
  needsSupport: boolean;
  isNeedSupport: boolean;
  note: string;
  color: string;
  className: string;
  classId: string;
  gradeName?: string;
  schoolYearName?: string;
  enrollmentId?: string;
  enrolledAt?: string;
}

export interface StudentListResponse {
  items: StudentItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    totalStudents: number;
    activeStudents: number;
    needsSupportStudents: number;
    avgAttendanceRate: number | null;
  };
}

export interface StudentDetailResponse extends StudentItem {
  comments?: {
    id: string;
    content: string;
    commentDate?: string;
    teacher?: { fullName: string };
  }[];
  studentAttendances?: {
    id: string;
    status: string;
    createdAt: string;
  }[];
  studentAssessments?: {
    id: string;
    score: number | null;
    level: string;
  }[];
  studentEnrollments?: {
    id: string;
    status: string;
    enrolledAt?: string;
    classroom?: { id: string; name: string };
    schoolYear?: { id: string; name: string };
  }[];
}

export interface SchoolYearItem {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  isActive: boolean;
}

export interface GradeItem {
  id: string;
  code: string;
  name: string;
  level: number;
  isActive: boolean;
}

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

type UnauthorizedHandler = () => void;

class ApiClient {
  private unauthorizedHandler?: UnauthorizedHandler;

  setUnauthorizedHandler(handler: UnauthorizedHandler | undefined) {
    this.unauthorizedHandler = handler;
  }

  private get baseUrl(): string {
    return ENV.API_BASE_URL.replace(/\/+$/, '');
  }

  private buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
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
          if (!endpoint.includes('/auth/login')) {
            this.unauthorizedHandler?.();
          }
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
      throw new ApiError(
        0,
        'Không thể kết nối đến máy chủ TeachFlow. Vui lòng kiểm tra kết nối mạng.',
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

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

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSROOMS
  // ═══════════════════════════════════════════════════════════════════════════

  async getClassrooms(query?: {
    schoolYearId?: string;
    gradeId?: string;
    status?: string;
    isActive?: boolean;
    keyword?: string;
    sort?: string;
  }): Promise<ClassroomListResponse> {
    const qs = query ? this.buildQueryString(query) : '';
    return this.request<ClassroomListResponse>(`/classrooms${qs}`, {
      method: 'GET',
    });
  }

  async getClassroom(id: string): Promise<ClassroomItem> {
    return this.request<ClassroomItem>(`/classrooms/${id}`, {
      method: 'GET',
    });
  }

  async createClassroom(dto: CreateClassroomRequest): Promise<ClassroomItem> {
    return this.request<ClassroomItem>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateClassroom(id: string, dto: UpdateClassroomRequest): Promise<ClassroomItem> {
    return this.request<ClassroomItem>(`/classrooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteClassroom(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/classrooms/${id}`, {
      method: 'DELETE',
    });
  }

  async getClassroomStudents(classroomId: string): Promise<ClassroomStudentItem[]> {
    return this.request<ClassroomStudentItem[]>(`/classrooms/${classroomId}/students`, {
      method: 'GET',
    });
  }

  async addStudentToClass(classroomId: string, dto: AddStudentToClassRequest): Promise<ClassroomStudentItem> {
    return this.request<ClassroomStudentItem>(`/classrooms/${classroomId}/students`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async removeStudentFromClass(classroomId: string, studentId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async getStudents(query?: {
    page?: number;
    pageSize?: number;
    search?: string;
    keyword?: string;
    classId?: string;
    classroomId?: string;
    gradeId?: string;
    schoolYearId?: string;
    status?: string;
    supportStatus?: string;
    sort?: string;
  }): Promise<StudentListResponse> {
    const qs = query ? this.buildQueryString(query) : '';
    return this.request<StudentListResponse>(`/students${qs}`, {
      method: 'GET',
    });
  }

  async getStudent(id: string): Promise<StudentDetailResponse> {
    return this.request<StudentDetailResponse>(`/students/${id}`, {
      method: 'GET',
    });
  }

  async createStudent(dto: CreateStudentRequest): Promise<StudentItem> {
    return this.request<StudentItem>('/students', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateStudent(id: string, dto: UpdateStudentRequest): Promise<StudentItem> {
    return this.request<StudentItem>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA (SchoolYears & Grades)
  // ═══════════════════════════════════════════════════════════════════════════

  async getSchoolYears(): Promise<SchoolYearItem[]> {
    return this.request<SchoolYearItem[]>('/school-years', {
      method: 'GET',
    });
  }

  async getGrades(): Promise<GradeItem[]> {
    return this.request<GradeItem[]>('/grades', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
