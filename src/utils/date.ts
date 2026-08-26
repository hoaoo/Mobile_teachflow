import type { ScheduleStatus } from '@/api/client';

export function getTodayVN(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateVN(dateStr: string): Date {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDateVN(dateStr?: string | null): string {
  if (!dateStr) return '--';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

export function formatFullDateVN(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateVN(date) : date;
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[d.getDay()];
  return `${dayName}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

export function formatDayHeaderVN(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateVN(date) : date;
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[d.getDay()];
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayName}, ${day}/${month}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatRelativeTimeVN(dateStr?: string | Date | null): string {
  if (!dateStr) return '--';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '--';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;

  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export interface WeekDayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // T2, T3, ..., CN
  dayNumber: number; // 1..31
  isToday: boolean;
}

export function getWeekDays(referenceDate: Date): WeekDayInfo[] {
  const current = new Date(referenceDate);
  const currentDayOfWeek = current.getDay(); // 0 (Sun) .. 6 (Sat)
  // Distance from Monday (1). If Sun (0), distance is 6.
  const distFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  const monday = new Date(current);
  monday.setDate(current.getDate() - distFromMonday);

  const todayStr = getTodayVN();
  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const week: WeekDayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    week.push({
      date: d,
      dateStr,
      dayLabel: dayLabels[i],
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return week;
}

export interface ScheduleComputedStatus {
  label: string;
  code: ScheduleStatus;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export function computeScheduleStatus(
  item: {
    status?: string | null;
    isManualStatus?: boolean;
    plannedDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  },
  now: Date = new Date(),
): ScheduleComputedStatus {
  const status = item.status || 'PLANNED';

  if (item.isManualStatus) {
    if (status === 'CANCELLED') {
      return {
        label: 'Đã hủy',
        code: 'CANCELLED',
        bgColor: '#FEE2E2',
        textColor: '#DC2626',
        borderColor: '#FECACA',
      };
    }
    if (status === 'TAUGHT') {
      return {
        label: 'Đã hoàn thành',
        code: 'TAUGHT',
        bgColor: '#E0F2FE',
        textColor: '#0284C7',
        borderColor: '#BAE6FD',
      };
    }
    if (status === 'IN_PROGRESS') {
      return {
        label: 'Đang diễn ra',
        code: 'IN_PROGRESS',
        bgColor: '#DCFCE7',
        textColor: '#15803D',
        borderColor: '#BBF7D0',
      };
    }
    return {
      label: 'Chưa bắt đầu',
      code: 'PLANNED',
      bgColor: '#F1F5F9',
      textColor: '#475569',
      borderColor: '#CBD5E1',
    };
  }

  if (status === 'CANCELLED') {
    return {
      label: 'Đã hủy',
      code: 'CANCELLED',
      bgColor: '#FEE2E2',
      textColor: '#DC2626',
      borderColor: '#FECACA',
    };
  }

  const lessonDateStr = item.plannedDate || getTodayVN();
  const startStr = item.startTime || '07:00';
  const endStr = item.endTime || '07:45';

  const [y, m, d] = (lessonDateStr || '').split('-').map(Number);
  const [sh, sm] = (startStr || '').split(':').map(Number);
  const [eh, em] = (endStr || '').split(':').map(Number);

  if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
    return {
      label: 'Chưa bắt đầu',
      code: 'PLANNED',
      bgColor: '#F1F5F9',
      textColor: '#475569',
      borderColor: '#CBD5E1',
    };
  }

  const slotStart = new Date(y, m - 1, d, sh, sm, 0);
  const slotEnd = new Date(y, m - 1, d, eh, em, 0);
  const nowMs = now.getTime();

  if (nowMs < slotStart.getTime()) {
    return {
      label: 'Chưa bắt đầu',
      code: 'PLANNED',
      bgColor: '#F1F5F9',
      textColor: '#475569',
      borderColor: '#CBD5E1',
    };
  } else if (nowMs >= slotStart.getTime() && nowMs <= slotEnd.getTime()) {
    return {
      label: 'Đang diễn ra',
      code: 'IN_PROGRESS',
      bgColor: '#DCFCE7',
      textColor: '#15803D',
      borderColor: '#BBF7D0',
    };
  } else {
    return {
      label: 'Đã hoàn thành',
      code: 'TAUGHT',
      bgColor: '#E0F2FE',
      textColor: '#0284C7',
      borderColor: '#BAE6FD',
    };
  }
}
