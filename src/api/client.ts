import { ENV } from '@/config/env';
import { tokenStorage } from '@/services/storage.service';
import type { components } from './openapi-types';

export type LoginRequest = components['schemas']['LoginDto'];
export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};
export type UpdateProfileRequest = {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
};
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

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ScheduleStatus = 'PLANNED' | 'IN_PROGRESS' | 'TAUGHT' | 'CANCELLED';

export interface ScheduleItem {
  id: string;
  teacherId: string;
  title?: string;
  status: ScheduleStatus;
  isManualStatus?: boolean;
  room?: string | null;
  notes?: string | null;
  postLessonNotes?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  plannedDate: string;
  startTime: string;
  endTime: string;
  classroomId: string;
  classroom?: {
    id: string;
    name: string;
    code: string;
    gradeName?: string | null;
    room?: string | null;
  };
  subjectId?: string | null;
  subjectName?: string | null;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  schoolYearId?: string | null;
  schoolYear?: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  lessonPlanId?: string | null;
  lessonPlan?: {
    id: string;
    title: string;
    status: string;
    objectives?: string | null;
  } | null;
  attendance?: {
    id?: string;
    isRecorded: boolean;
    status?: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  };
}

export interface DashboardScheduleItem {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  plannedDate: string | null;
  status: ScheduleStatus;
  isManualStatus: boolean;
  subject: string;
  title: string;
  className: string;
  classroomId?: string;
  gradeName?: string | null;
  room: string;
  hasLessonPlan: boolean;
  lessonPlanId: string | null;
  lessonPlanTitle: string | null;
  attendanceRecorded: boolean;
  attendanceLabel: string;
  attendancePresentCount: number;
  attendanceTotalCount: number;
  color?: string;
}

export interface UpdateScheduleStatusRequest {
  status: ScheduleStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  postLessonNotes?: string;
  isManualStatus?: boolean;
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

  async register(data: RegisterRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

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

  async updateProfile(dto: UpdateProfileRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(dto),
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async getAttendance(classId?: string, date?: string): Promise<AttendanceDailyResponse> {
    const qs = this.buildQueryString({ classId, date });
    return this.request<AttendanceDailyResponse>(`/attendance${qs}`, {
      method: 'GET',
    });
  }

  async saveAttendance(dto: SaveAttendanceRequest): Promise<{ success: boolean; message: string; sessionId?: string }> {
    return this.request<{ success: boolean; message: string; sessionId?: string }>('/attendance', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async getAttendanceHistory(): Promise<AttendanceHistoryItem[]> {
    return this.request<AttendanceHistoryItem[]>('/attendance/history', {
      method: 'GET',
    });
  }

  async getAttendanceStats(params?: { classId?: string; dateFrom?: string; dateTo?: string }): Promise<AttendanceStatsData> {
    const qs = params ? this.buildQueryString(params) : '';
    return this.request<AttendanceStatsData>(`/attendance/stats${qs}`, {
      method: 'GET',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHER TASKS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTasks(): Promise<TeacherTaskItem[]> {
    return this.request<TeacherTaskItem[]>('/tasks', {
      method: 'GET',
    });
  }

  async createTask(dto: CreateTeacherTaskRequest): Promise<TeacherTaskItem> {
    return this.request<TeacherTaskItem>('/tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateTask(id: string, dto: UpdateTeacherTaskRequest): Promise<TeacherTaskItem> {
    return this.request<TeacherTaskItem>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULES
  // ═══════════════════════════════════════════════════════════════════════════

  async getSchedules(params?: {
    classroomId?: string;
    subjectId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    search?: string;
  }): Promise<ScheduleItem[]> {
    const qs = params ? this.buildQueryString(params) : '';
    const res = await this.request<ScheduleItem[]>(`/schedules${qs}`, {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  }

  async getScheduleById(id: string): Promise<ScheduleItem> {
    return this.request<ScheduleItem>(`/schedules/${id}`, {
      method: 'GET',
    });
  }

  async getDashboardSchedule(params?: {
    date?: string;
    from?: string;
    to?: string;
  }): Promise<DashboardScheduleItem[]> {
    const qs = params ? this.buildQueryString(params) : '';
    const res = await this.request<DashboardScheduleItem[]>(`/dashboard/schedule${qs}`, {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  }

  async updateScheduleStatus(
    id: string,
    dto: UpdateScheduleStatusRequest,
  ): Promise<ScheduleItem> {
    return this.request<ScheduleItem>(`/schedules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON PLANS
  // ═══════════════════════════════════════════════════════════════════════════

  async getLessonPlans(params?: {
    classroomId?: string;
    subjectId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<LessonPlanItem[]> {
    const qs = params ? this.buildQueryString(params) : '';
    const res = await this.request<LessonPlanItem[]>(`/lesson-plans${qs}`, {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  }

  async getLessonPlanById(id: string): Promise<LessonPlanItem> {
    return this.request<LessonPlanItem>(`/lesson-plans/${id}`, {
      method: 'GET',
    });
  }

  async createLessonPlan(dto: CreateLessonPlanRequest): Promise<LessonPlanItem> {
    return this.request<LessonPlanItem>('/lesson-plans', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateLessonPlan(id: string, dto: UpdateLessonPlanRequest): Promise<LessonPlanItem> {
    return this.request<LessonPlanItem>(`/lesson-plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteLessonPlan(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/lesson-plans/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateLessonPlan(id: string): Promise<LessonPlanItem> {
    return this.request<LessonPlanItem>(`/lesson-plans/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async generateLessonPlanAI(dto: GenerateLessonPlanAIRequest): Promise<GeneratedLessonPlanAIData> {
    return this.request<GeneratedLessonPlanAIData>('/ai/lesson-plan', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async generateActivityAI(dto: GenerateActivityAIRequest): Promise<GeneratedActivityAIData> {
    return this.request<GeneratedActivityAIData>('/ai/activity', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async generateWorksheetAI(dto: GenerateWorksheetAIRequest): Promise<GeneratedWorksheetAIData> {
    return this.request<GeneratedWorksheetAIData>('/ai/worksheet', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async generateQuestionsAI(dto: GenerateQuestionsAIRequest): Promise<GeneratedQuestionsAIData> {
    return this.request<GeneratedQuestionsAIData>('/ai/questions', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async generateStudentCommentAI(dto: GenerateStudentCommentAIRequest): Promise<GeneratedStudentCommentAIData> {
    return this.request<GeneratedStudentCommentAIData>('/ai/student-comment', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async generateHomeroomSummaryAI(dto: GenerateHomeroomSummaryAIRequest): Promise<GeneratedHomeroomSummaryAIData> {
    return this.request<GeneratedHomeroomSummaryAIData>('/ai/homeroom-summary', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async chatAI(dto: ChatAIRequest): Promise<ChatAIResponse> {
    return this.request<ChatAIResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  getLessonPlanExportDocxUrl(id: string): string {
    return `${this.baseUrl}/lesson-plans/${id}/export/docx`;
  }

  getLessonPlanExportPdfUrl(id: string): string {
    return `${this.baseUrl}/lesson-plans/${id}/export/pdf`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSHEETS / PHIẾU BÀI TẬP
  // ═══════════════════════════════════════════════════════════════════════════

  async getWorksheets(): Promise<WorksheetItem[]> {
    const res = await this.request<WorksheetItem[]>('/worksheets', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  }

  async getWorksheetById(id: string): Promise<WorksheetItem> {
    return this.request<WorksheetItem>(`/worksheets/${id}`, {
      method: 'GET',
    });
  }

  async createWorksheet(dto: CreateWorksheetRequest): Promise<WorksheetItem> {
    return this.request<WorksheetItem>('/worksheets', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateWorksheet(id: string, dto: UpdateWorksheetRequest): Promise<WorksheetItem> {
    return this.request<WorksheetItem>(`/worksheets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteWorksheet(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/worksheets/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateWorksheet(id: string): Promise<WorksheetItem> {
    return this.request<WorksheetItem>(`/worksheets/${id}/duplicate`, {
      method: 'POST',
    });
  }

  getWorksheetExportDocxUrl(id: string, includeAnswers = true): string {
    return `${this.baseUrl}/worksheets/${id}/export/docx?includeAnswers=${includeAnswers}`;
  }

  getWorksheetExportPdfUrl(id: string, includeAnswers = true): string {
    return `${this.baseUrl}/worksheets/${id}/export/pdf?includeAnswers=${includeAnswers}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSESSMENTS / ĐÁNH GIÁ
  // ═══════════════════════════════════════════════════════════════════════════

  async getAssessments(params?: {
    classroomId?: string;
    subjectId?: string;
    semester?: number;
  }): Promise<AssessmentItem[]> {
    const qs = params ? this.buildQueryString(params) : '';
    const res = await this.request<AssessmentItem[]>(`/assessments${qs}`, {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  }

  async getAssessmentById(id: string): Promise<AssessmentItem> {
    return this.request<AssessmentItem>(`/assessments/${id}`, {
      method: 'GET',
    });
  }

  async createAssessment(dto: CreateAssessmentRequest): Promise<AssessmentItem> {
    return this.request<AssessmentItem>('/assessments', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateAssessment(id: string, dto: UpdateAssessmentRequest): Promise<AssessmentItem> {
    return this.request<AssessmentItem>(`/assessments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteAssessment(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/assessments/${id}`, {
      method: 'DELETE',
    });
  }

  async batchSaveAssessmentScores(
    id: string,
    dto: BatchSaveAssessmentScoresRequest,
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/assessments/${id}/scores`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHING RESOURCES / HỌC LIỆU & TÀI NGUYÊN
  // ═══════════════════════════════════════════════════════════════════════════

  async getResources(params?: {
    subjectId?: string;
    gradeId?: string;
    resourceType?: string;
    search?: string;
  }): Promise<TeachingResourceItem[]> {
    const qs = params ? this.buildQueryString(params) : '';
    const res = await this.request<TeachingResourceItem[]>(`/resources${qs}`, {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  }

  async getResourceById(id: string): Promise<TeachingResourceItem> {
    return this.request<TeachingResourceItem>(`/resources/${id}`, {
      method: 'GET',
    });
  }

  async createResource(dto: CreateResourceRequest): Promise<TeachingResourceItem> {
    return this.request<TeachingResourceItem>('/resources', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateResource(id: string, dto: UpdateResourceRequest): Promise<TeachingResourceItem> {
    return this.request<TeachingResourceItem>(`/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteResource(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/resources/${id}`, {
      method: 'DELETE',
    });
  }

  getResourceDownloadUrl(id: string): string {
    return `${this.baseUrl}/resources/${id}/download`;
  }

  getResourceFileUrl(id: string): string {
    return `${this.baseUrl}/resources/${id}/file`;
  }

  async getResourceSignedUrl(id: string): Promise<{ signedUrl: string; streamUrl: string; expiresAt: string }> {
    return this.request<{ signedUrl: string; streamUrl: string; expiresAt: string }>(
      `/resources/${id}/presign-url`,
      { method: 'GET' },
    );
  }

  async uploadResourceFile(dto: UploadResourceRequest): Promise<TeachingResourceItem> {
    const formData = new FormData();
    formData.append('file', {
      uri: dto.uri,
      name: dto.name,
      type: dto.type || 'application/octet-stream',
    } as any);

    if (dto.name) formData.append('name', dto.name);
    if (dto.subjectId) formData.append('subjectId', dto.subjectId);
    if (dto.gradeId) formData.append('gradeId', dto.gradeId);
    if (dto.lessonId) formData.append('lessonId', dto.lessonId);
    if (dto.description) formData.append('description', dto.description);
    if (dto.tone) formData.append('tone', dto.tone);

    const token = await tokenStorage.getAccessToken();
    const url = `${this.baseUrl}/resources/upload`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Không thể tải lên tập tin';
      try {
        const errorJson = await response.json();
        errorMsg = Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message || errorMsg;
      } catch {}
      throw new ApiError(response.status, errorMsg);
    }

    return response.json();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER TASK TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TeacherTaskItem {
  id: string;
  title: string;
  due: string;
  done: boolean;
  taskDate?: string;
  priority?: string;
  completedAt?: string | null;
}

export interface CreateTeacherTaskRequest {
  title: string;
  due?: string;
  done?: boolean;
}

export interface UpdateTeacherTaskRequest {
  title?: string;
  due?: string;
  done?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AttendanceStatus =
  | 'PRESENT'
  | 'EXCUSED_ABSENCE'
  | 'UNEXCUSED_ABSENCE'
  | 'LATE';

export interface StudentAttendanceItem {
  studentId: string;
  name: string;
  initials?: string;
  gender?: string;
  status: AttendanceStatus;
  lateMinutes?: number;
  note?: string;
}

export interface AttendanceDailyResponse {
  classId: string;
  className?: string;
  date: string;
  isRecorded: boolean;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  students: StudentAttendanceItem[];
  items?: StudentAttendanceItem[];
}

export interface SaveAttendanceRequest {
  classId: string;
  date: string;
  sessionPeriod?: 'MORNING' | 'AFTERNOON' | string;
  attendances: {
    studentId: string;
    status?: AttendanceStatus;
    note?: string;
  }[];
}

export interface AttendanceHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  meta: string;
  tone: string;
}

export interface AttendanceStatsData {
  totalSessions: number;
  totalRecorded: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  lateCount: number;
  absentCount: number;
  overallRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON PLAN TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type LessonPlanStatus = 'DRAFT' | 'COMPLETED' | 'TAUGHT';

export interface LessonPlanActivityItem {
  id?: string;
  phase?: string;
  title: string;
  minutes?: number;
  method?: string;
  technique?: string;
  competencies?: string;
  qualities?: string;
  equipment?: string;
  objective?: string;
  teacher?: string;
  students?: string;
  sortOrder?: number;
}

export interface LessonPlanItem {
  id: string;
  title: string;
  topic?: string;
  subject: string;
  grade: string;
  classroomId?: string | null;
  subjectId?: string | null;
  date: string;
  duration: number;
  objective: string;
  specificCompetencies?: string;
  generalCompetencies?: string;
  qualities?: string;
  teachingEquipment?: string;
  postLessonAdjustment?: string;
  notes?: string;
  status: LessonPlanStatus;
  version: number;
  activities: LessonPlanActivityItem[];
  activitiesCount?: number;
  schedulesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonPlanRequest {
  title: string;
  topic?: string;
  subject?: string;
  grade?: string;
  date?: string;
  duration?: number;
  objective?: string;
  specificCompetencies?: string;
  generalCompetencies?: string;
  qualities?: string;
  teachingEquipment?: string;
  postLessonAdjustment?: string;
  notes?: string;
  status?: LessonPlanStatus;
  classroomId?: string;
  subjectId?: string;
  activities?: LessonPlanActivityItem[];
}

export interface UpdateLessonPlanRequest extends Partial<CreateLessonPlanRequest> {
  version?: number;
}

export interface GenerateLessonPlanAIRequest {
  grade: number;
  subject: string;
  lessonTitle: string;
  durationMinutes?: number;
  requirements?: string;
  numberOfPeriods?: number;
  objectives?: string;
  qualities?: string;
  competencies?: string;
}

export interface GeneratedLessonPlanAIData {
  title: string;
  topic?: string;
  subject: string;
  grade: string;
  duration: number;
  objective: string;
  specificCompetencies?: string;
  generalCompetencies?: string;
  qualities?: string;
  teachingEquipment?: string;
  activities: LessonPlanActivityItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKSHEET TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WorksheetQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'ESSAY';

export interface WorksheetQuestionItem {
  id?: string;
  questionType: WorksheetQuestionType;
  content: string;
  options?: string[];
  optionsJson?: string[] | null;
  correctAnswer?: any;
  correctAnswerJson?: any;
  explanation?: string | null;
  sortOrder?: number;
}

export interface WorksheetItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  status: string;
  meta?: string;
  tone?: 'teal' | 'blue' | 'orange' | 'violet' | string;
  subjectId?: string;
  gradeId?: string;
  classroomId?: string;
  subject?: { id: string; name: string };
  grade?: { id: string; name: string };
  classroom?: { id: string; name: string };
  questions?: WorksheetQuestionItem[];
  questionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorksheetRequest {
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  meta?: string;
  tone?: 'teal' | 'blue' | 'orange' | 'violet';
  subjectId?: string;
  gradeId?: string;
  classroomId?: string;
  questions?: WorksheetQuestionItem[];
}

export type UpdateWorksheetRequest = Partial<CreateWorksheetRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// ASSESSMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AssessmentLevelType = 'EXCELLENT' | 'COMPLETED' | 'NEEDS_SUPPORT';

export interface AssessmentCriterionItem {
  id?: string;
  code?: string;
  name: string;
}

export interface StudentAssessmentScoreItem {
  id?: string;
  studentId: string;
  criterionId?: string;
  level?: AssessmentLevelType;
  score?: number | null;
  comment?: string;
  student?: {
    id: string;
    fullName: string;
    studentCode?: string;
    gender?: string;
  };
}

export interface AssessmentItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  meta?: string;
  tone?: 'teal' | 'blue' | 'orange' | 'violet' | string;
  classroomId?: string;
  subjectId?: string;
  semester?: number;
  assessmentType?: string;
  weight?: number;
  assessmentDate?: string;
  version?: number;
  classroom?: { id: string; name: string };
  subject?: { id: string; name: string };
  criteria?: AssessmentCriterionItem[];
  studentAssessments?: StudentAssessmentScoreItem[];
  students?: {
    id: string;
    fullName: string;
    studentCode?: string;
    gender?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssessmentRequest {
  title: string;
  subtitle?: string;
  status?: string;
  meta?: string;
  tone?: 'teal' | 'blue' | 'orange' | 'violet';
  classroomId?: string;
  subjectId?: string;
  semester?: number;
  assessmentType?: string;
  weight?: number;
  assessmentDate?: string;
  criteria?: AssessmentCriterionItem[];
}

export type UpdateAssessmentRequest = Partial<CreateAssessmentRequest> & { version?: number };

export interface BatchSaveAssessmentScoresRequest {
  scores: {
    studentId: string;
    criterionId?: string;
    level?: AssessmentLevelType;
    score?: number | null;
    comment?: string;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHING RESOURCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TeachingResourceType =
  | 'DOCUMENT'
  | 'PRESENTATION'
  | 'SPREADSHEET'
  | 'IMAGE'
  | 'VIDEO'
  | 'LINK'
  | 'OTHER'
  | string;

export interface TeachingResourceItem {
  id: string;
  name: string;
  title: string;
  originalFileName?: string;
  storedFileName?: string;
  resourceType: TeachingResourceType;
  mimeType?: string;
  size?: number;
  formattedSize?: string;
  extension?: string;
  subjectId?: string;
  subjectName?: string;
  gradeId?: string;
  gradeName?: string;
  lessonId?: string;
  lessonTitle?: string;
  subtitle?: string;
  description?: string;
  status: string;
  meta: string;
  tone: string;
  externalUrl?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateResourceRequest {
  title: string;
  subtitle?: string;
  status?: string;
  meta?: string;
  tone?: 'teal' | 'blue' | 'orange' | 'violet';
  resourceType?: string;
  fileUrl?: string;
  externalUrl?: string;
  description?: string;
  subjectId?: string;
  gradeId?: string;
}

export type UpdateResourceRequest = Partial<CreateResourceRequest>;

export interface UploadResourceRequest {
  uri: string;
  name: string;
  type: string;
  subjectId?: string;
  gradeId?: string;
  lessonId?: string;
  description?: string;
  tone?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI ASSISTANT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatAIMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatAIRequest {
  message: string;
  history?: string;
  context?: string;
}

export interface ChatAIResponse {
  messageId: string;
  content: string;
  reply: string;
  generatedAt: string;
}

export interface GenerateActivityAIRequest {
  grade: number;
  subject: string;
  lessonTitle: string;
  activityType: string;
  durationMinutes?: number;
  requirement?: string;
}

export interface GeneratedActivityAIData {
  activityType?: string;
  title: string;
  objective: string;
  durationMinutes: number;
  methods: string[];
  techniques: string[];
  competencies: string[];
  qualities: string[];
  teacherActivity: string;
  studentActivity: string;
}

export interface GenerateWorksheetAIRequest {
  grade: number;
  subject: string;
  lesson: string;
  numberOfQuestions?: number;
  difficulty?: string;
  questionTypes?: string[];
  knowledgeContent?: string;
  includeAnswers?: boolean;
}

export interface GeneratedWorksheetAIData {
  title: string;
  questions: {
    questionType: string;
    content: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  }[];
  editorDraft?: {
    title: string;
    description?: string;
    subtitle?: string;
    questions: {
      questionType: string;
      content: string;
      options?: string[];
      correctAnswer?: string;
      explanation?: string;
      sortOrder?: number;
    }[];
  };
}

export interface GenerateQuestionsAIRequest {
  grade: number;
  subject: string;
  topic: string;
  numberOfQuestions?: number;
  levels?: string[];
}

export interface GeneratedQuestionsAIData {
  topic: string;
  questions: {
    questionType: string;
    content: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty?: string;
  }[];
}

export interface GenerateStudentCommentAIRequest {
  studentId?: string;
  subject?: string;
  criteria?: Record<string, string>;
  assessmentLevel?: string;
  notes?: string;
}

export interface GeneratedStudentCommentAIData {
  comment?: string;
  comments?: string[];
  overallAssessment?: string;
  recommendations?: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

export interface GenerateHomeroomSummaryAIRequest {
  classroomId: string;
  period: 'WEEK' | 'MONTH';
  weekNumber?: number;
}

export interface GeneratedHomeroomSummaryAIData {
  summary: string;
  strengths: string[];
  concerns: string[];
  nextSteps: string[];
}

export const apiClient = new ApiClient();

