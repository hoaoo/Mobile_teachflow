import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  apiClient,
  type AttendanceHistoryItem,
  type AttendanceStatsData,
  type AttendanceStatus,
  type ClassroomItem,
  type StudentAttendanceItem,
} from '@/api/client';
import { AppHeader } from '@/components/AppHeader';
import { TeachFlowLoader } from '@/components/branding/TeachFlowLoader';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { addDays, formatDateVN, formatDayHeaderVN, getTodayVN, parseDateVN } from '@/utils/date';

const ATTENDANCE_STATUS_MAP: {
  key: AttendanceStatus;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    key: 'PRESENT',
    label: 'Có mặt',
    shortLabel: 'Có mặt',
    color: '#059669',
    bgColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  {
    key: 'EXCUSED_ABSENCE',
    label: 'Vắng có phép',
    shortLabel: 'Có phép',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  {
    key: 'UNEXCUSED_ABSENCE',
    label: 'Vắng không phép',
    shortLabel: 'K.Phép',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  {
    key: 'LATE',
    label: 'Đi muộn',
    shortLabel: 'Muộn',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
];

export default function AttendanceScreen() {
  const params = useLocalSearchParams<{ classId?: string; date?: string }>();

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(params.classId || '');
  const [selectedDate, setSelectedDate] = useState<string>(params.date || getTodayVN());
  const [sessionPeriod, setSessionPeriod] = useState<'MORNING' | 'AFTERNOON'>('MORNING');

  // Mode: 'RECORD' (Điểm danh) | 'HISTORY' (Lịch sử)
  const [activeTab, setActiveTab] = useState<'RECORD' | 'HISTORY'>('RECORD');

  // Attendance Sheet State
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [isRecorded, setIsRecorded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // History & Stats State
  const [historyItems, setHistoryItems] = useState<AttendanceHistoryItem[]>([]);
  const [stats, setStats] = useState<AttendanceStatsData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // 1. Fetch Classrooms
  useEffect(() => {
    let isMounted = true;
    const fetchClassrooms = async () => {
      try {
        const res = await apiClient.getClassrooms();
        if (isMounted) {
          const items = res.items || [];
          setClassrooms(items);
          if (!selectedClassId && items.length > 0) {
            setSelectedClassId(items[0].id);
          }
        }
      } catch {
        // Silently handle
      }
    };
    fetchClassrooms();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId]);

  // 2. Fetch Attendance for Selected Class and Date
  const loadAttendance = useCallback(
    async (classId: string, date: string, isRefresh = false) => {
      if (!classId) return;
      try {
        setErrorMessage(null);
        if (!isRefresh) setLoading(true);
        const res = await apiClient.getAttendance(classId, date);
        setStudents(res.students || res.items || []);
        setIsRecorded(res.isRecorded || false);
        setIsDirty(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể tải dữ liệu điểm danh');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // 3. Fetch History & Stats
  const loadHistoryAndStats = useCallback(
    async (classId: string, isRefresh = false) => {
      if (!classId) return;
      try {
        if (!isRefresh) setLoadingHistory(true);
        const [histRes, statRes] = await Promise.allSettled([
          apiClient.getAttendanceHistory(),
          apiClient.getAttendanceStats({ classId }),
        ]);

        if (histRes.status === 'fulfilled') {
          setHistoryItems(histRes.value || []);
        }
        if (statRes.status === 'fulfilled') {
          setStats(statRes.value);
        }
      } catch {
        // Silently ignore
      } finally {
        setLoadingHistory(false);
      }
    },
    [],
  );

  // Effect when selection changes
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!selectedClassId) return;
      if (activeTab === 'RECORD') {
        try {
          const res = await apiClient.getAttendance(selectedClassId, selectedDate);
          if (isMounted) {
            setStudents(res.students || res.items || []);
            setIsRecorded(res.isRecorded || false);
            setIsDirty(false);
            setErrorMessage(null);
          }
        } catch (err: unknown) {
          if (isMounted) {
            setErrorMessage(err instanceof Error ? err.message : 'Không thể tải dữ liệu điểm danh');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      } else {
        try {
          const [histRes, statRes] = await Promise.allSettled([
            apiClient.getAttendanceHistory(),
            apiClient.getAttendanceStats({ classId: selectedClassId }),
          ]);
          if (isMounted) {
            if (histRes.status === 'fulfilled') {
              setHistoryItems(histRes.value || []);
            }
            if (statRes.status === 'fulfilled') {
              setStats(statRes.value);
            }
          }
        } catch {
          // Silently ignore
        } finally {
          if (isMounted) {
            setLoadingHistory(false);
          }
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedDate, activeTab]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'RECORD') {
      loadAttendance(selectedClassId, selectedDate, true);
    } else {
      loadHistoryAndStats(selectedClassId, true);
    }
  }, [activeTab, selectedClassId, selectedDate, loadAttendance, loadHistoryAndStats]);

  // Attendance Status Helpers
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s)),
    );
    setIsDirty(true);
  };

  const handleNoteChange = (studentId: string, noteText: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, note: noteText } : s)),
    );
    setIsDirty(true);
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'PRESENT' as AttendanceStatus,
      })),
    );
    setIsDirty(true);
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      Alert.alert('Lỗi', 'Vui lòng chọn lớp học');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày điểm danh');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.saveAttendance({
        classId: selectedClassId,
        date: selectedDate,
        sessionPeriod,
        attendances: students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          note: s.note?.trim() || undefined,
        })),
      });

      setIsDirty(false);
      setIsRecorded(true);
      Alert.alert('Thành công', 'Đã lưu điểm danh lớp học');
      loadAttendance(selectedClassId, selectedDate, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu điểm danh';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const excusedCount = students.filter((s) => s.status === 'EXCUSED_ABSENCE').length;
  const unexcusedCount = students.filter((s) => s.status === 'UNEXCUSED_ABSENCE').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;

  const renderStudentItem = ({ item, index }: { item: StudentAttendanceItem; index: number }) => {
    const isSpecialStatus = item.status !== 'PRESENT';

    return (
      <View style={styles.studentCard}>
        {/* Student Name & Index */}
        <View style={styles.studentHeaderRow}>
          <View style={styles.studentIndexBadge}>
            <Text style={styles.studentIndexText}>{index + 1}</Text>
          </View>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.status && (
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    ATTENDANCE_STATUS_MAP.find((m) => m.key === item.status)?.bgColor || '#F1F5F9',
                },
              ]}>
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color:
                      ATTENDANCE_STATUS_MAP.find((m) => m.key === item.status)?.color || '#475569',
                  },
                ]}>
                {ATTENDANCE_STATUS_MAP.find((m) => m.key === item.status)?.shortLabel || item.status}
              </Text>
            </View>
          )}
        </View>

        {/* 4 Status Option Buttons */}
        <View style={styles.statusButtonsGrid}>
          {ATTENDANCE_STATUS_MAP.map((st) => {
            const isSelected = item.status === st.key;
            return (
              <Pressable
                key={st.key}
                style={[
                  styles.statusBtn,
                  isSelected && {
                    backgroundColor: st.bgColor,
                    borderColor: st.color,
                  },
                ]}
                onPress={() => handleStatusChange(item.studentId, st.key)}>
                <Text
                  style={[
                    styles.statusBtnText,
                    isSelected && { color: st.color, fontWeight: '700' },
                  ]}>
                  {st.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Note / Reason field for absences or late */}
        {isSpecialStatus && (
          <View style={styles.noteInputWrapper}>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập lý do vắng / muộn (ví dụ: Bị ốm, xin phép gia đình...)"
              placeholderTextColor={Colors.textMuted}
              value={item.note || ''}
              onChangeText={(text) => handleNoteChange(item.studentId, text)}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Chuyên cần" subtitle="Điểm danh & thống kê chuyên cần" />

      {/* Selector Container */}
      <View style={styles.topSelectorCard}>
        {/* Class Picker */}
        <View style={styles.controlGroup}>
          <Text style={styles.selectorHeading}>Lớp học</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classChipsScroll}>
            {classrooms.map((cls) => (
              <Pressable
                key={cls.id}
                style={[
                  styles.classChip,
                  selectedClassId === cls.id && styles.classChipActive,
                ]}
                onPress={() => {
                  if (isDirty) {
                    Alert.alert(
                      'Thay đổi chưa lưu',
                      'Bạn có thay đổi điểm danh chưa được lưu. Đổi lớp sẽ làm mới dữ liệu.',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Tiếp tục',
                          onPress: () => {
                            setSelectedClassId(cls.id);
                            setIsDirty(false);
                          },
                        },
                      ],
                    );
                  } else {
                    setSelectedClassId(cls.id);
                  }
                }}>
                <Text
                  style={[
                    styles.classChipText,
                    selectedClassId === cls.id && styles.classChipTextActive,
                  ]}>
                  {cls.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Date Selector */}
        <View style={styles.controlGroup}>
          <Text style={styles.selectorHeading}>Ngày</Text>
          <View style={styles.dateControlRow}>
            <Pressable
              style={styles.dateNavBtn}
              onPress={() => {
                const prev = addDays(parseDateVN(selectedDate), -1);
                const y = prev.getFullYear();
                const m = (prev.getMonth() + 1).toString().padStart(2, '0');
                const d = prev.getDate().toString().padStart(2, '0');
                setSelectedDate(`${y}-${m}-${d}`);
                setIsDirty(false);
              }}>
              <Text style={styles.dateNavIcon}>◀</Text>
            </Pressable>

            <View style={styles.dateDisplayBox}>
              <Text style={styles.dateDisplayText}>
                {formatDayHeaderVN(selectedDate)} ({formatDateVN(selectedDate)})
              </Text>
            </View>

            <Pressable
              style={styles.dateNavBtn}
              onPress={() => {
                const next = addDays(parseDateVN(selectedDate), 1);
                const y = next.getFullYear();
                const m = (next.getMonth() + 1).toString().padStart(2, '0');
                const d = next.getDate().toString().padStart(2, '0');
                setSelectedDate(`${y}-${m}-${d}`);
                setIsDirty(false);
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
                setIsDirty(false);
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

        {/* Session Period Selector */}
        <View style={styles.controlGroup}>
          <Text style={styles.selectorHeading}>Buổi</Text>
          <View style={styles.periodRow}>
            <Pressable
              style={[
                styles.periodOption,
                sessionPeriod === 'MORNING' && styles.periodOptionActive,
              ]}
              onPress={() => setSessionPeriod('MORNING')}>
              <Text
                style={[
                  styles.periodOptionText,
                  sessionPeriod === 'MORNING' && styles.periodOptionTextActive,
                ]}>
                ☀️ Buổi sáng
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.periodOption,
                sessionPeriod === 'AFTERNOON' && styles.periodOptionActive,
              ]}
              onPress={() => setSessionPeriod('AFTERNOON')}>
              <Text
                style={[
                  styles.periodOptionText,
                  sessionPeriod === 'AFTERNOON' && styles.periodOptionTextActive,
                ]}>
                ⛅ Buổi chiều
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sub-Navigation Tabs */}
        <View style={styles.tabSwitchRow}>
          <Pressable
            style={[styles.tabSwitchBtn, activeTab === 'RECORD' && styles.tabSwitchBtnActive]}
            onPress={() => setActiveTab('RECORD')}>
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'RECORD' && styles.tabSwitchTextActive,
              ]}>
              📋 Điểm danh
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabSwitchBtn, activeTab === 'HISTORY' && styles.tabSwitchBtnActive]}
            onPress={() => setActiveTab('HISTORY')}>
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'HISTORY' && styles.tabSwitchTextActive,
              ]}>
              📜 Lịch sử & Thống kê
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      {activeTab === 'RECORD' ? (
        <View style={styles.recordContent}>
          {/* Summary KPI Banner */}
          <View style={styles.kpiBanner}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiVal}>{students.length}</Text>
              <Text style={styles.kpiLbl}>Sĩ số</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#059669' }]}>{presentCount}</Text>
              <Text style={styles.kpiLbl}>Có mặt</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#D97706' }]}>{excusedCount}</Text>
              <Text style={styles.kpiLbl}>Có phép</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{unexcusedCount}</Text>
              <Text style={styles.kpiLbl}>K.Phép</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#7C3AED' }]}>{lateCount}</Text>
              <Text style={styles.kpiLbl}>Muộn</Text>
            </View>
          </View>

          {/* Quick Mark All Present */}
          <View style={styles.actionToolbar}>
            <View style={styles.sessionStatusBadge}>
              <Text
                style={[
                  styles.sessionStatusText,
                  isRecorded ? { color: '#059669' } : { color: '#D97706' },
                ]}>
                {isRecorded ? '✓ Đã lưu điểm danh' : '⏳ Chưa lưu điểm danh'}
              </Text>
            </View>

            <Pressable style={styles.markAllBtn} onPress={handleMarkAllPresent}>
              <Text style={styles.markAllBtnText}>⚡ Tất cả có mặt</Text>
            </Pressable>
          </View>

          {/* Student Attendance List */}
          {loading && !refreshing ? (
            <TeachFlowLoader variant="inline" label="Đang tải danh sách điểm danh..." />
          ) : errorMessage ? (
            <View style={styles.centerBox}>
              <Text style={styles.errIcon}>⚠️</Text>
              <Text style={styles.errTitle}>Không thể tải danh sách</Text>
              <Text style={styles.errTxt}>{errorMessage}</Text>
              <Pressable
                style={styles.retryBtn}
                onPress={() => loadAttendance(selectedClassId, selectedDate)}>
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : students.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Lớp này chưa có học sinh</Text>
              <Text style={styles.emptyTxt}>
                Vui lòng ghi danh học sinh vào lớp học trước khi thực hiện điểm danh.
              </Text>
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.studentId}
              renderItem={renderStudentItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Colors.primary]}
                />
              }
            />
          )}

          {/* Bottom Sticky Save Button */}
          {students.length > 0 && !loading ? (
            <View style={styles.footerBar}>
              <Pressable
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSaveAttendance}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    💾 Lưu điểm danh ({presentCount}/{students.length} có mặt)
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        // ═════════════════════════════════════════════════════════════════════
        // SUB-TAB 2: LỊCH SỬ & THỐNG KÊ
        // ═════════════════════════════════════════════════════════════════
        <ScrollView
          contentContainerStyle={styles.historyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }>
          {/* Overall Stats Card */}
          {stats ? (
            <View style={styles.statsCard}>
              <Text style={styles.statsHeading}>Thống kê chuyên cần tổng thể</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{stats.totalSessions}</Text>
                  <Text style={styles.statLbl}>Buổi điểm danh</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#059669' }]}>
                    {stats.overallRate}%
                  </Text>
                  <Text style={styles.statLbl}>Tỷ lệ chuyên cần</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#DC2626' }]}>
                    {stats.absentCount}
                  </Text>
                  <Text style={styles.statLbl}>Lượt vắng</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#7C3AED' }]}>
                    {stats.lateCount}
                  </Text>
                  <Text style={styles.statLbl}>Lượt muộn</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* History Sessions List */}
          <Text style={styles.historyHeading}>Lịch sử điểm danh gần đây</Text>

          {loadingHistory && !refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : historyItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyTitle}>Chưa có lịch sử điểm danh</Text>
              <Text style={styles.emptyTxt}>
                Các buổi điểm danh đã hoàn thành sẽ xuất hiện tại đây.
              </Text>
            </View>
          ) : (
            historyItems.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <View style={styles.historyBadge}>
                    <Text style={styles.historyBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historySubtitle}>{item.subtitle}</Text>
                  <Text style={styles.historyMeta}>{item.meta}</Text>
                </View>
              </View>
            ))
          )}
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
  topSelectorCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  controlGroup: {
    gap: 4,
  },
  selectorHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  classChipsScroll: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  classChip: {
    paddingHorizontal: Spacing.md,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  classChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  classChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dateControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateNavBtn: {
    width: 38,
    height: 42,
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
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  dateDisplayText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  todayBtn: {
    paddingHorizontal: Spacing.md,
    height: 42,
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
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  periodOption: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  periodOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodOptionTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  tabSwitchRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    padding: 3,
    marginTop: 4,
    marginBottom: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  tabSwitchBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabSwitchTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  recordContent: {
    flex: 1,
  },
  kpiBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  kpiLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sessionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  markAllBtn: {
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  studentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: Spacing.sm,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  studentIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  studentName: {
    ...Typography.titleSmall,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statusBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  noteInputWrapper: {
    marginTop: 2,
  },
  noteInput: {
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  historyContent: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  statsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statBox: {
    width: '48%',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  historyHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  historyBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  historySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  centerBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingTxt: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errIcon: {
    fontSize: 32,
  },
  errTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
  errTxt: {
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
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyTxt: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
