import type { NotificationItem } from '@/api/client';

export interface NavigationTarget {
  pathname: string;
  params?: Record<string, any>;
  isDetailFallback?: boolean;
}

/**
 * Centralized Notification Deep-Link Mapper
 * Maps backend NotificationItem to Mobile TeachFlow routes safely without throwing errors.
 */
export function resolveNotificationRoute(notification: NotificationItem): NavigationTarget | null {
  const { type, targetType, targetId, metadata, link } = notification;

  // 1. Check link from backend
  if (link) {
    // Schedule link: e.g. /schedule?scheduleId=123
    if (link.includes('schedule')) {
      const match = link.match(/scheduleId=([a-zA-Z0-9_-]+)/);
      const scheduleId = match ? match[1] : targetId || metadata?.scheduleId;
      return {
        pathname: '/schedule',
        params: scheduleId ? { scheduleId } : undefined,
      };
    }

    // Attendance link: e.g. /homeroom?tab=attendance&classroomId=123 or /attendance?classId=123
    if (link.includes('attendance') || (link.includes('homeroom') && link.includes('attendance'))) {
      const match = link.match(/classroomId=([a-zA-Z0-9_-]+)/) || link.match(/classId=([a-zA-Z0-9_-]+)/);
      const classId = match ? match[1] : targetId || metadata?.classroomId;
      return {
        pathname: '/attendance',
        params: classId ? { classId } : undefined,
      };
    }

    // Homeroom generic link: e.g. /homeroom
    if (link.includes('homeroom')) {
      return { pathname: '/homeroom' };
    }

    // Student detail link: e.g. /students/123 or /student/123
    if (link.includes('students') || link.includes('student')) {
      const match = link.match(/\/students?\/([a-zA-Z0-9_-]+)/) || link.match(/studentId=([a-zA-Z0-9_-]+)/);
      const studentId = match ? match[1] : targetId || metadata?.studentId;
      if (studentId) {
        return {
          pathname: `/student/${studentId}`,
        };
      }
      return { pathname: '/students' };
    }

    // Lesson plan link: e.g. /lesson-plans/123 or /lessons/123
    if (link.includes('lessons') || link.includes('lesson-plans')) {
      const match = link.match(/\/lessons?(?:-plans)?\/([a-zA-Z0-9_-]+)/) || link.match(/lessonPlanId=([a-zA-Z0-9_-]+)/);
      const lessonPlanId = match ? match[1] : targetId || metadata?.lessonPlanId;
      if (lessonPlanId) {
        return {
          pathname: `/lesson-plans/${lessonPlanId}`,
        };
      }
      return { pathname: '/lesson-plans' };
    }

    // Worksheet link: e.g. /worksheets?worksheetId=123 or /worksheets/123
    if (link.includes('worksheets')) {
      const match = link.match(/\/worksheets\/([a-zA-Z0-9_-]+)/) || link.match(/worksheetId=([a-zA-Z0-9_-]+)/);
      const worksheetId = match ? match[1] : targetId || metadata?.worksheetId;
      if (worksheetId) {
        return {
          pathname: `/worksheets/${worksheetId}`,
        };
      }
      return { pathname: '/worksheets' };
    }

    // Tasks link: e.g. /tasks
    if (link.includes('tasks')) {
      return { pathname: '/tasks' };
    }

    // Assessments link: e.g. /assessments
    if (link.includes('assessments')) {
      return { pathname: '/assessments' };
    }
  }

  // 2. Fallback by TargetType
  if (targetType) {
    switch (targetType) {
      case 'ATTENDANCE':
        return {
          pathname: '/attendance',
          params: targetId ? { classId: targetId } : undefined,
        };
      case 'SCHEDULE':
        return {
          pathname: '/schedule',
          params: targetId ? { scheduleId: targetId } : undefined,
        };
      case 'STUDENT':
        return targetId
          ? { pathname: `/student/${targetId}` }
          : { pathname: '/students' };
      case 'TASK':
        return { pathname: '/tasks' };
      case 'LESSON_PLAN':
        return targetId
          ? { pathname: `/lesson-plans/${targetId}` }
          : { pathname: '/lesson-plans' };
      case 'WORKSHEET':
        return targetId
          ? { pathname: `/worksheets/${targetId}` }
          : { pathname: '/worksheets' };
      case 'HOMEROOM':
        return { pathname: '/homeroom' };
      case 'SYSTEM':
      default:
        break;
    }
  }

  // 3. Fallback by NotificationType
  switch (type) {
    case 'ASSIGNMENT':
      return { pathname: '/schedule' };
    case 'ENROLLMENT':
      return { pathname: '/students' };
    case 'TASK':
      return { pathname: '/tasks' };
    case 'ASSESSMENT':
      return { pathname: '/assessments' };
    case 'HOMEROOM':
      return { pathname: '/homeroom' };
    case 'SYSTEM':
    default:
      // For system or unhandled notifications, fallback to detail view
      return {
        pathname: '',
        isDetailFallback: true,
      };
  }
}
