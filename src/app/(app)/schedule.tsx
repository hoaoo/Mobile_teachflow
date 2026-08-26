import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  apiClient,
  type ScheduleItem,
  type ScheduleStatus,
} from '@/api/client';
import { AppHeader } from '@/components/AppHeader';
import { TeachFlowLoader } from '@/components/branding/TeachFlowLoader';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import {
  addDays,
  computeScheduleStatus,
  formatDateVN,
  formatDayHeaderVN,
  formatFullDateVN,
  getTodayVN,
  getWeekDays,
  parseDateVN,
} from '@/utils/date';

export default function ScheduleScreen() {
  const router = useRouter();

  // Mode: 'DAY' | 'WEEK'
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK'>('DAY');

  // Selected Date
  const [selectedDate, setSelectedDate] = useState<string>(getTodayVN());
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // Data State
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  // Week days
  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

  // Date range for week mode
  const weekRange = useMemo(() => {
    if (weekDays.length < 7) return { from: selectedDate, to: selectedDate };
    return {
      from: weekDays[0].dateStr,
      to: weekDays[6].dateStr,
    };
  }, [weekDays, selectedDate]);

  // Load Schedules
  const fetchSchedules = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage(null);
      if (!isRefresh) setLoading(true);

      let items: ScheduleItem[] = [];
      if (viewMode === 'DAY') {
        items = await apiClient.getSchedules({
          dateFrom: selectedDate,
          dateTo: selectedDate,
        });
      } else {
        items = await apiClient.getSchedules({
          dateFrom: weekRange.from,
          dateTo: weekRange.to,
        });
      }

      setSchedules(items || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải lịch giảng dạy');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewMode, selectedDate, weekRange]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        let items: ScheduleItem[] = [];
        if (viewMode === 'DAY') {
          items = await apiClient.getSchedules({
            dateFrom: selectedDate,
            dateTo: selectedDate,
          });
        } else {
          items = await apiClient.getSchedules({
            dateFrom: weekRange.from,
            dateTo: weekRange.to,
          });
        }

        if (isMounted) {
          setSchedules(items || []);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải lịch giảng dạy');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [viewMode, selectedDate, weekRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules(true);
  };

  // Status transition handler
  const handleUpdateStatus = async (item: ScheduleItem, nextStatus: ScheduleStatus) => {
    setMutatingId(item.id);
    try {
      const updated = await apiClient.updateScheduleStatus(item.id, {
        status: nextStatus,
        isManualStatus: true,
      });

      setSchedules((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, ...updated, status: nextStatus, isManualStatus: true } : s)),
      );
      Alert.alert('Thành công', `Đã chuyển trạng thái sang "${computeScheduleStatus({ status: nextStatus, isManualStatus: true }).label}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái tiết dạy';
      Alert.alert('Lỗi', msg);
    } finally {
      setMutatingId(null);
    }
  };

  // Render Day Schedule Item
  const renderDayScheduleCard = ({ item }: { item: ScheduleItem }) => {
    const statusInfo = computeScheduleStatus(item);
    const isMutating = mutatingId === item.id;
    const timeDisplay =
      item.startTime && item.endTime
        ? `${item.startTime} - ${item.endTime}`
        : item.startTime || '07:30';

    return (
      <View style={styles.scheduleCard}>
        {/* Top Header: Time & Status Badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeIcon}>⏰</Text>
            <Text style={styles.timeBadgeText}>{timeDisplay}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusInfo.bgColor,
                borderColor: statusInfo.borderColor,
              },
            ]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.textColor }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Main Content: Subject & Class */}
        <View style={styles.cardMain}>
          <Text style={styles.subjectTitle}>
            {item.subjectName || item.subject?.name || item.title || 'Môn học'}
          </Text>
          <Text style={styles.classroomSub}>
            Lớp {item.classroom?.name || 'Chưa xếp lớp'}
            {item.classroom?.gradeName ? ` • Khối ${item.classroom.gradeName}` : ''}
          </Text>
          {item.room ? <Text style={styles.roomMeta}>📍 Phòng: {item.room}</Text> : null}
          {item.lessonPlan ? (
            <View style={styles.lessonPlanBox}>
              <Text style={styles.lessonPlanIcon}>📖</Text>
              <Text style={styles.lessonPlanTitle} numberOfLines={1}>
                {item.lessonPlan.title}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.cardActionsRow}>
          {item.status === 'PLANNED' && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.startBtn,
                pressed && styles.buttonPressed,
                isMutating && styles.btnDisabled,
              ]}
              onPress={() => handleUpdateStatus(item, 'IN_PROGRESS')}
              disabled={isMutating}>
              {isMutating ? (
                <ActivityIndicator size="small" color="#15803D" />
              ) : (
                <Text style={styles.startBtnText}>▶ Bắt đầu dạy</Text>
              )}
            </Pressable>
          )}

          {item.status === 'IN_PROGRESS' && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.completeBtn,
                pressed && styles.buttonPressed,
                isMutating && styles.btnDisabled,
              ]}
              onPress={() => handleUpdateStatus(item, 'TAUGHT')}
              disabled={isMutating}>
              {isMutating ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <Text style={styles.completeBtnText}>✓ Hoàn thành</Text>
              )}
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.attendBtn,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push({
                pathname: '/attendance',
                params: {
                  classId: item.classroomId,
                  date: item.plannedDate || selectedDate,
                },
              });
            }}>
            <Text style={styles.attendBtnText}>📋 Điểm danh</Text>
          </Pressable>

          {item.classroomId && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.classBtn,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push(`/classroom/${item.classroomId}`)}>
              <Text style={styles.classBtnText}>🏫 Vào lớp</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // Group schedules by date for Week View
  const groupedWeekSchedules = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    weekDays.forEach((wd) => {
      map[wd.dateStr] = [];
    });

    schedules.forEach((s) => {
      const dateKey = s.plannedDate ? s.plannedDate.split('T')[0] : '';
      if (map[dateKey]) {
        map[dateKey].push(s);
      }
    });

    return weekDays.map((wd) => ({
      dayInfo: wd,
      items: map[wd.dateStr] || [],
    }));
  }, [weekDays, schedules]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Lịch dạy" subtitle="Kế hoạch giảng dạy & thời khóa biểu" />

      {/* View Mode Switcher [ Ngày | Tuần ] */}
      <View style={styles.headerToolbar}>
        <View style={styles.segmentedSwitch}>
          <Pressable
            style={[styles.segmentBtn, viewMode === 'DAY' && styles.segmentBtnActive]}
            onPress={() => setViewMode('DAY')}>
            <Text
              style={[
                styles.segmentBtnText,
                viewMode === 'DAY' && styles.segmentBtnTextActive,
              ]}>
              📅 Theo ngày
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, viewMode === 'WEEK' && styles.segmentBtnActive]}
            onPress={() => setViewMode('WEEK')}>
            <Text
              style={[
                styles.segmentBtnText,
                viewMode === 'WEEK' && styles.segmentBtnTextActive,
              ]}>
              📆 Theo tuần
            </Text>
          </Pressable>
        </View>

        {/* DAY MODE DATE SELECTOR */}
        {viewMode === 'DAY' ? (
          <View style={styles.dateSelectorCard}>
            <View style={styles.dateNavRow}>
              <Pressable
                style={styles.dateNavBtn}
                onPress={() => {
                  const prev = addDays(parseDateVN(selectedDate), -1);
                  const y = prev.getFullYear();
                  const m = (prev.getMonth() + 1).toString().padStart(2, '0');
                  const d = prev.getDate().toString().padStart(2, '0');
                  const prevStr = `${y}-${m}-${d}`;
                  setSelectedDate(prevStr);
                  setReferenceDate(prev);
                }}>
                <Text style={styles.dateNavIcon}>◀</Text>
              </Pressable>

              <View style={styles.dateDisplayBox}>
                <Text style={styles.dateDisplayMain}>{formatDayHeaderVN(selectedDate)}</Text>
                <Text style={styles.dateDisplaySub}>{formatDateVN(selectedDate)}</Text>
              </View>

              <Pressable
                style={styles.dateNavBtn}
                onPress={() => {
                  const next = addDays(parseDateVN(selectedDate), 1);
                  const y = next.getFullYear();
                  const m = (next.getMonth() + 1).toString().padStart(2, '0');
                  const d = next.getDate().toString().padStart(2, '0');
                  const nextStr = `${y}-${m}-${d}`;
                  setSelectedDate(nextStr);
                  setReferenceDate(next);
                }}>
                <Text style={styles.dateNavIcon}>▶</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.todayBtn,
                  selectedDate === getTodayVN() && styles.todayBtnActive,
                ]}
                onPress={() => {
                  setSelectedDate(getTodayVN());
                  setReferenceDate(new Date());
                }}>
                <Text
                  style={[
                    styles.todayBtnText,
                    selectedDate === getTodayVN() && styles.todayBtnTextActive,
                  ]}>
                  Hôm nay
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* WEEK MODE WEEK STRIP */
          <View style={styles.weekStripCard}>
            <View style={styles.weekNavHeader}>
              <Pressable
                style={styles.weekNavBtn}
                onPress={() => {
                  const prevWeek = addDays(referenceDate, -7);
                  setReferenceDate(prevWeek);
                }}>
                <Text style={styles.dateNavIcon}>◀</Text>
              </Pressable>

              <Text style={styles.weekTitle}>
                {formatDateVN(weekRange.from)} — {formatDateVN(weekRange.to)}
              </Text>

              <Pressable
                style={styles.weekNavBtn}
                onPress={() => {
                  const nextWeek = addDays(referenceDate, 7);
                  setReferenceDate(nextWeek);
                }}>
                <Text style={styles.dateNavIcon}>▶</Text>
              </Pressable>

              <Pressable
                style={styles.weekTodayBtn}
                onPress={() => {
                  setReferenceDate(new Date());
                  setSelectedDate(getTodayVN());
                }}>
                <Text style={styles.weekTodayText}>Tuần này</Text>
              </Pressable>
            </View>

            {/* 7 Days Strip */}
            <View style={styles.weekDaysStrip}>
              {weekDays.map((wd) => {
                const isSelected = wd.dateStr === selectedDate;
                return (
                  <Pressable
                    key={wd.dateStr}
                    style={[
                      styles.weekDayCell,
                      isSelected && styles.weekDayCellSelected,
                      wd.isToday && !isSelected && styles.weekDayCellToday,
                    ]}
                    onPress={() => setSelectedDate(wd.dateStr)}>
                    <Text
                      style={[
                        styles.weekDayLabel,
                        isSelected && styles.weekDayTextActive,
                        wd.isToday && !isSelected && styles.weekDayTodayText,
                      ]}>
                      {wd.dayLabel}
                    </Text>
                    <Text
                      style={[
                        styles.weekDayNumber,
                        isSelected && styles.weekDayTextActive,
                        wd.isToday && !isSelected && styles.weekDayTodayText,
                      ]}>
                      {wd.dayNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* CONTENT LIST */}
      {loading && !refreshing ? (
        <TeachFlowLoader variant="fullscreen" label="Đang tải lịch giảng dạy..." />
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchSchedules(false)}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : viewMode === 'DAY' ? (
        /* DAY VIEW LIST */
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={renderDayScheduleCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Không có tiết dạy nào</Text>
              <Text style={styles.emptyText}>
                {selectedDate === getTodayVN()
                  ? 'Hôm nay Thầy/Cô không có lịch giảng dạy nào theo kế hoạch.'
                  : `Ngày ${formatFullDateVN(selectedDate)} không có tiết dạy nào.`}
              </Text>
            </View>
          }
        />
      ) : (
        /* WEEK VIEW LIST */
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }>
          {groupedWeekSchedules.map((group) => {
            const hasLessons = group.items.length > 0;
            return (
              <View key={group.dayInfo.dateStr} style={styles.weekGroupCard}>
                <View style={styles.weekGroupHeader}>
                  <View style={styles.weekGroupTitleRow}>
                    <Text style={styles.weekGroupDayName}>
                      {group.dayInfo.dayLabel} • {formatDateVN(group.dayInfo.dateStr)}
                    </Text>
                    {group.dayInfo.isToday && (
                      <View style={styles.todayPill}>
                        <Text style={styles.todayPillText}>Hôm nay</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.weekGroupCount}>
                    {hasLessons ? `${group.items.length} tiết` : 'Nghỉ'}
                  </Text>
                </View>

                {hasLessons ? (
                  <View style={styles.weekLessonsList}>
                    {group.items.map((item) => {
                      const st = computeScheduleStatus(item);
                      const timeStr =
                        item.startTime && item.endTime
                          ? `${item.startTime} - ${item.endTime}`
                          : item.startTime || '07:30';

                      return (
                        <Pressable
                          key={item.id}
                          style={({ pressed }) => [
                            styles.weekLessonItem,
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={() => {
                            setSelectedDate(group.dayInfo.dateStr);
                            setViewMode('DAY');
                          }}>
                          <View style={styles.weekLessonTimeBox}>
                            <Text style={styles.weekLessonTime}>{timeStr}</Text>
                          </View>

                          <View style={styles.weekLessonInfo}>
                            <Text style={styles.weekLessonSubject} numberOfLines={1}>
                              {item.subjectName || item.subject?.name || item.title || 'Môn học'}
                            </Text>
                            <Text style={styles.weekLessonClass}>
                              Lớp {item.classroom?.name || '--'}
                              {item.room ? ` • P.${item.room}` : ''}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.miniStatusBadge,
                              { backgroundColor: st.bgColor, borderColor: st.borderColor },
                            ]}>
                            <Text style={[styles.miniStatusText, { color: st.textColor }]}>
                              {st.label}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.weekDayEmpty}>
                    <Text style={styles.weekDayEmptyText}>Không có tiết dạy</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerToolbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  segmentedSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dateSelectorCard: {
    gap: Spacing.xs,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateNavBtn: {
    width: 38,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateDisplayBox: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplayMain: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateDisplaySub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  todayBtn: {
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtnActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  todayBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  weekStripCard: {
    gap: Spacing.xs,
  },
  weekNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekTodayBtn: {
    paddingHorizontal: Spacing.sm,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekTodayText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  weekDaysStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  weekDayCell: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  weekDayCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekDayCellToday: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weekDayNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  weekDayTextActive: {
    color: Colors.textWhite,
  },
  weekDayTodayText: {
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 96,
    gap: Spacing.md,
  },
  scheduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    gap: 4,
  },
  timeBadgeIcon: {
    fontSize: 12,
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardMain: {
    gap: 2,
  },
  subjectTitle: {
    ...Typography.titleLarge,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  classroomSub: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  roomMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lessonPlanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginTop: 4,
    gap: 4,
  },
  lessonPlanIcon: {
    fontSize: 12,
  },
  lessonPlanTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBtn: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  completeBtn: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  attendBtn: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attendBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  classBtn: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  weekGroupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  weekGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.xs,
  },
  weekGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weekGroupDayName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  todayPill: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  weekGroupCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  weekLessonsList: {
    gap: Spacing.xs,
  },
  weekLessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  weekLessonTimeBox: {
    width: 90,
  },
  weekLessonTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekLessonInfo: {
    flex: 1,
  },
  weekLessonSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekLessonClass: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  weekDayEmpty: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  weekDayEmptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  retryBtnText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
});
