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

// ═══════════════════════════════════════════════════════════════════════════
// HOMEROOM TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface HomeroomClassItem {
  id: string;
  code: string;
  name: string;
  gradeName: string;
  gradeLevel: number;
  schoolYearId: string;
  schoolYearName: string;
}

export interface MyHomeroomClassesResponse {
  hasHomeroomClass: boolean;
  classes: HomeroomClassItem[];
}

export interface AttentionStudentReason {
  type: 'ATTENDANCE' | 'ASSESSMENT' | 'BEHAVIOR';
  description: string;
}

export interface AttentionStudentItem {
  studentId: string;
  studentName: string;
  initials?: string | null;
  avatarColor?: string | null;
  reasons: AttentionStudentReason[];
}

export interface UpcomingBirthdayItem {
  studentId: string;
  fullName: string;
  initials?: string | null;
  avatarColor?: string | null;
  dateOfBirth: string;
  daysUntilBirthday: number;
  isToday: boolean;
  turningAge: number;
}

export interface HomeroomDashboardData {
  hasHomeroomClass: boolean;
  classroom: {
    id: string;
    name: string;
    room?: string;
    schedule?: string;
    accent?: string;
    studentCount?: number;
    gradeName?: string | null;
    schoolYearName?: string | null;
    schoolYearId: string;
  } | null;
  students: {
    id: string;
    fullName: string;
    initials?: string;
    avatarColor?: string;
  }[];
  attendanceToday: {
    isRecorded: boolean;
    total: number;
    present: number;
    excusedAbsence: number;
    unexcusedAbsence: number;
    late: number;
  };
  studentsNeedAttention: AttentionStudentItem[];
  upcomingBirthdays: UpcomingBirthdayItem[];
  recentBehavior: {
    id: string;
    studentId: string;
    studentName: string;
    studentInitials?: string;
    studentColor?: string;
    recordDate: string;
    category: string;
    level: 'POSITIVE' | 'REMINDER' | 'NEEDS_ATTENTION';
    content: string;
  }[];
  weeklyTasks: {
    id: string;
    title: string;
    due?: string;
    done: boolean;
  }[];
  currentWeekReview: {
    id?: string;
    weekNumber: number;
    strengths?: string | null;
    limitations?: string | null;
    nextWeekPlan?: string | null;
    version: number;
  } | null;
}

export type BehaviorCategory =
  | 'DISCIPLINE'
  | 'LEARNING'
  | 'HYGIENE'
  | 'TEAMWORK'
  | 'RESPONSIBILITY'
  | 'OTHER';

export type BehaviorLevel = 'POSITIVE' | 'REMINDER' | 'NEEDS_ATTENTION';

export interface BehaviorRecordItem {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials?: string;
  studentColor?: string;
  classroomId: string;
  className: string;
  recordDate: string;
  category: BehaviorCategory;
  behaviorType?: string | null;
  level: BehaviorLevel;
  content: string;
  resolution?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface BehaviorRecordsResponse {
  items: BehaviorRecordItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    totalRecords: number;
    positiveCount: number;
    reminderCount: number;
    needsAttentionCount: number;
  };
}

export interface CreateBehaviorRecordRequest {
  classroomId: string;
  studentId: string;
  recordDate: string;
  category: BehaviorCategory;
  behaviorType?: string;
  level: BehaviorLevel;
  content: string;
  resolution?: string;
  note?: string;
}

export interface UpdateBehaviorRecordRequest {
  recordDate?: string;
  category?: BehaviorCategory;
  behaviorType?: string;
  level?: BehaviorLevel;
  content?: string;
  resolution?: string;
  note?: string;
}

export interface WeeklyStudentComment {
  studentId: string;
  learning?: string;
  behavior?: string;
  attendance?: string;
  comment?: string;
}

export interface WeeklyReviewItem {
  id?: string;
  classroomId: string;
  schoolYearId: string;
  weekNumber: number;
  strengths?: string | null;
  limitations?: string | null;
  nextWeekPlan?: string | null;
  notableStudents?: string | null;
  supportStudents?: string | null;
  studentComments?: WeeklyStudentComment[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveWeeklyReviewRequest {
  classroomId: string;
  schoolYearId?: string;
  weekNumber: number;
  strengths?: string;
  limitations?: string;
  nextWeekPlan?: string;
  notableStudents?: string;
  supportStudents?: string;
  studentComments?: WeeklyStudentComment[];
  version?: number;
}

export interface WeeklySummaryData {
  weekNumber: number;
  dateRange: string;
  attendance: {
    totalStudents: number;
    totalSessions: number;
    presentRate: number | null;
    excusedAbsence: number;
    unexcusedAbsence: number;
    late: number;
  };
  behavior: {
    positive: number;
    reminder: number;
    needsAttention: number;
  };
  assessment: {
    isRecorded: boolean;
    excellent: number;
    completed: number;
    needsSupport: number;
  };
}

export interface MonthlyReviewItem {
  id?: string;
  classroomId: string;
  schoolYearId: string;
  year: number;
  month: number;
  highlights?: string | null;
  limitations?: string | null;
  nextMonthPlan?: string | null;
  generalComment?: string | null;
  difficulties?: string | null;
  measures?: string | null;
  classActivities?: string | null;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveMonthlyReviewRequest {
  classroomId: string;
  schoolYearId?: string;
  year: number;
  month: number;
  highlights?: string;
  limitations?: string;
  nextMonthPlan?: string;
  generalComment?: string;
  difficulties?: string;
  measures?: string;
  classActivities?: string;
  version?: number;
}

export interface MonthlySummaryData {
  year: number;
  month: number;
  classroom: {
    id: string;
    name: string;
    gradeName: string | null;
    schoolYearName: string | null;
  };
  attendance: {
    totalStudents: number;
    studentsAtStart: number;
    studentsAtEnd: number;
    studentsTransferredIn: number;
    studentsTransferredOut: number;
    totalSchoolDays: number;
    attendanceRate: number | null;
    excusedAbsence: number;
    unexcusedAbsence: number;
    late: number;
  };
  learning: {
    isRecorded: boolean;
    excellent: number;
    completed: number;
    needsSupport: number;
  };
  behavior: {
    positive: number;
    reminder: number;
    needsAttention: number;
  };
  studentsNeedingSupport: {
    id: string;
    name: string;
    reasons: string[];
  }[];
  studentsImproved: {
    id: string;
    name: string;
    note: string;
  }[];
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
        } else if (response.status === 409) {
          errorMessage = 'Dữ liệu đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.';
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

  // ═══════════════════════════════════════════════════════════════════════════
  // HOMEROOM
  // ═══════════════════════════════════════════════════════════════════════════

  async getMyHomerooms(): Promise<MyHomeroomClassesResponse> {
    return this.request<MyHomeroomClassesResponse>('/homeroom/classrooms', {
      method: 'GET',
    });
  }

  async getHomeroomDashboard(classId?: string): Promise<HomeroomDashboardData> {
    const qs = classId ? this.buildQueryString({ classId }) : '';
    return this.request<HomeroomDashboardData>(`/homeroom/dashboard${qs}`, {
      method: 'GET',
    });
  }

  async getStudentsNeedAttention(classId: string): Promise<AttentionStudentItem[]> {
    const qs = this.buildQueryString({ classId });
    return this.request<AttentionStudentItem[]>(`/homeroom/students-need-attention${qs}`, {
      method: 'GET',
    });
  }

  async getUpcomingBirthdays(classId: string, days = 30): Promise<UpcomingBirthdayItem[]> {
    const qs = this.buildQueryString({ classId, days });
    return this.request<UpcomingBirthdayItem[]>(`/homeroom/upcoming-birthdays${qs}`, {
      method: 'GET',
    });
  }

  async getBehaviorRecords(query: {
    classId?: string;
    studentId?: string;
    category?: BehaviorCategory;
    behaviorType?: string;
    level?: BehaviorLevel;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<BehaviorRecordsResponse> {
    const qs = this.buildQueryString(query);
    return this.request<BehaviorRecordsResponse>(`/homeroom/behavior${qs}`, {
      method: 'GET',
    });
  }

  async createBehaviorRecord(dto: CreateBehaviorRecordRequest): Promise<BehaviorRecordItem> {
    return this.request<BehaviorRecordItem>('/homeroom/behavior', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateBehaviorRecord(id: string, dto: UpdateBehaviorRecordRequest): Promise<BehaviorRecordItem> {
    return this.request<BehaviorRecordItem>(`/homeroom/behavior/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteBehaviorRecord(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/homeroom/behavior/${id}`, {
      method: 'DELETE',
    });
  }

  async getWeeklySummary(classId: string, weekNumber: number, schoolYearId?: string): Promise<WeeklySummaryData> {
    const qs = this.buildQueryString({ classId, weekNumber, schoolYearId });
    return this.request<WeeklySummaryData>(`/homeroom/weekly-summary${qs}`, {
      method: 'GET',
    });
  }

  async getWeeklyReview(classId: string, weekNumber: number, schoolYearId?: string): Promise<WeeklyReviewItem | null> {
    const qs = this.buildQueryString({ classId, weekNumber, schoolYearId });
    return this.request<WeeklyReviewItem | null>(`/homeroom/weekly-review${qs}`, {
      method: 'GET',
    });
  }

  async saveWeeklyReview(dto: SaveWeeklyReviewRequest): Promise<WeeklyReviewItem> {
    return this.request<WeeklyReviewItem>('/homeroom/weekly-review', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async getMonthlySummary(classId: string, year: number, month: number): Promise<MonthlySummaryData> {
    const qs = this.buildQueryString({ classId, year, month });
    return this.request<MonthlySummaryData>(`/homeroom/monthly-summary${qs}`, {
      method: 'GET',
    });
  }

  async getMonthlyReview(classId: string, year: number, month: number): Promise<MonthlyReviewItem | null> {
    const qs = this.buildQueryString({ classId, year, month });
    return this.request<MonthlyReviewItem | null>(`/homeroom/monthly-review${qs}`, {
      method: 'GET',
    });
  }

  async saveMonthlyReview(dto: SaveMonthlyReviewRequest): Promise<MonthlyReviewItem> {
    return this.request<MonthlyReviewItem>('/homeroom/monthly-review', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }
}

export const apiClient = new ApiClient();
