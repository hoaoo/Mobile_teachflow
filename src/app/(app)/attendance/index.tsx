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
import { AppHeader } from '@/components/AppHeader';
import {
  apiClient,
  type AttendanceHistoryItem,
  type AttendanceStatsData,
  type AttendanceStatus,
  type ClassroomItem,
  type StudentAttendanceItem,
} from '@/api/client';

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ATTENDANCE_STATUS_MAP: {
  key: AttendanceStatus;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  { key: 'PRESENT', label: 'Có mặt', shortLabel: 'Có mặt', color: '#059669' },
  { key: 'EXCUSED_ABSENCE', label: 'Vắng có phép', shortLabel: 'Có phép', color: '#D97706' },
  { key: 'UNEXCUSED_ABSENCE', label: 'Vắng không phép', shortLabel: 'K.Phép', color: '#DC2626' },
  { key: 'LATE', label: 'Đi muộn', shortLabel: 'Muộn', color: '#7C3AED' },
];

export default function AttendanceScreen() {
  const params = useLocalSearchParams<{ classId?: string; date?: string }>();

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(params.classId || '');
  const [selectedDate, setSelectedDate] = useState<string>(params.date || getLocalDateString());
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
        setStudents(res.students || []);
        setIsRecorded(res.isRecorded);
        setIsDirty(false);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Không thể tải danh sách điểm danh',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const fetchAttendanceData = async () => {
      if (!selectedClassId || !selectedDate) return;
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getAttendance(selectedClassId, selectedDate);
        if (isMounted) {
          setStudents(res.students || []);
          setIsRecorded(res.isRecorded);
          setIsDirty(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách điểm danh',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchAttendanceData();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedDate]);

  // 3. Fetch History & Stats when on HISTORY tab
  useEffect(() => {
    let isMounted = true;
    const fetchHistoryData = async () => {
      if (activeTab !== 'HISTORY') return;
      try {
        setLoadingHistory(true);
        const [hist, st] = await Promise.all([
          apiClient.getAttendanceHistory().catch(() => []),
          apiClient.getAttendanceStats({ classId: selectedClassId || undefined }).catch(() => null),
        ]);
        if (isMounted) {
          setHistoryItems(hist);
          setStats(st);
        }
      } catch {
        // Silently handle
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
          setRefreshing(false);
        }
      }
    };

    fetchHistoryData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedClassId]);

  const loadHistoryAndStats = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const [hist, st] = await Promise.all([
        apiClient.getAttendanceHistory().catch(() => []),
        apiClient.getAttendanceStats({ classId: selectedClassId || undefined }).catch(() => null),
      ]);
      setHistoryItems(hist);
      setStats(st);
    } catch {
      // Silently handle
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, [selectedClassId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'RECORD' && selectedClassId && selectedDate) {
      loadAttendance(selectedClassId, selectedDate, true);
    } else if (activeTab === 'HISTORY') {
      loadHistoryAndStats();
    } else {
      setRefreshing(false);
    }
  }, [activeTab, selectedClassId, selectedDate, loadAttendance, loadHistoryAndStats]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s)),
    );
    setIsDirty(true);
  };

  const handleNoteChange = (studentId: string, newNote: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, note: newNote } : s)),
    );
    setIsDirty(true);
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'PRESENT' as AttendanceStatus,
        note: 'Đúng giờ',
      })),
    );
    setIsDirty(true);
  };

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

  // ═══════════════════════════════════════════════════════════════════════════
  // METRICS COMPUTATION
  // ═══════════════════════════════════════════════════════════════════════════

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const excusedCount = students.filter((s) => s.status === 'EXCUSED_ABSENCE').length;
  const unexcusedCount = students.filter((s) => s.status === 'UNEXCUSED_ABSENCE').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;

  const renderStudentItem = ({ item }: { item: StudentAttendanceItem }) => {
    const isSpecialStatus = item.status !== 'PRESENT';

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentTopRow}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{item.initials || 'HS'}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentMeta}>{item.gender || 'Học sinh'}</Text>
          </View>
        </View>

        {/* Status Segmented Buttons */}
        <View style={styles.statusButtonsRow}>
          {ATTENDANCE_STATUS_MAP.map((st) => {
            const isSelected = item.status === st.key;
            return (
              <Pressable
                key={st.key}
                style={[
                  styles.statusBtn,
                  isSelected && {
                    backgroundColor: st.color,
                    borderColor: st.color,
                  },
                ]}
                onPress={() => handleStatusChange(item.studentId, st.key)}>
                <Text
                  style={[
                    styles.statusBtnText,
                    isSelected && styles.statusBtnTextSelected,
                  ]}>
                  {st.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Note / Reason field for absences or late */}
        {isSpecialStatus ? (
          <View style={styles.noteInputWrapper}>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập lý do vắng / muộn (ví dụ: Bị ốm, có phép gia đình...)"
              placeholderTextColor="#94A3B8"
              value={item.note || ''}
              onChangeText={(text) => handleNoteChange(item.studentId, text)}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Chuyên cần" subtitle="Điểm danh & thống kê chuyên cần" />

      {/* Header Selector Box */}
      <View style={styles.topSelectorCard}>
        {/* Class Picker */}
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

        {/* Date Selector Row */}
        <View style={styles.dateSelectorRow}>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.dateLabel}>Ngày (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.dateInput}
              value={selectedDate}
              onChangeText={(d) => {
                setSelectedDate(d);
                setIsDirty(false);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.dateQuickButtons}>
            <Pressable
              style={[
                styles.quickDateBtn,
                selectedDate === getLocalDateString() && styles.quickDateBtnActive,
              ]}
              onPress={() => setSelectedDate(getLocalDateString())}>
              <Text
                style={[
                  styles.quickDateBtnText,
                  selectedDate === getLocalDateString() && styles.quickDateBtnTextActive,
                ]}>
                Hôm nay
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.periodBtn,
                sessionPeriod === 'MORNING' && styles.periodBtnActive,
              ]}
              onPress={() =>
                setSessionPeriod((p) => (p === 'MORNING' ? 'AFTERNOON' : 'MORNING'))
              }>
              <Text
                style={[
                  styles.periodBtnText,
                  sessionPeriod === 'MORNING' && styles.periodBtnTextActive,
                ]}>
                {sessionPeriod === 'MORNING' ? '☀️ Sáng' : '⛅ Chiều'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sub Navigation Tabs */}
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
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#059669' }]}>{presentCount}</Text>
              <Text style={styles.kpiLbl}>Có mặt</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#D97706' }]}>{excusedCount}</Text>
              <Text style={styles.kpiLbl}>Có phép</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{unexcusedCount}</Text>
              <Text style={styles.kpiLbl}>K.Phép</Text>
            </View>
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
                {isRecorded ? '✓ Đã lưu điểm danh' : '⏳ Chưa điểm danh'}
              </Text>
            </View>

            <Pressable
              style={styles.markAllBtn}
              onPress={handleMarkAllPresent}>
              <Text style={styles.markAllBtnText}>⚡ Tất cả có mặt</Text>
            </Pressable>
          </View>

          {/* Student Attendance List */}
          {loading && !refreshing ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.loadingTxt}>Đang tải danh sách học sinh...</Text>
            </View>
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
                  colors={['#0284C7']}
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
              colors={['#0284C7']}
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
            <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 20 }} />
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
    backgroundColor: '#F8FAFC',
  },
  topSelectorCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectorHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  classChipsScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  classChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  classChipTextActive: {
    color: '#FFFFFF',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    gap: 8,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600',
  },
  dateInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  dateQuickButtons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  quickDateBtn: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  quickDateBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickDateBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  periodBtn: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  periodBtnTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  tabSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginTop: 6,
    marginBottom: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabSwitchTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  recordContent: {
    flex: 1,
  },
  kpiBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'space-around',
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLbl: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 10,
    paddingTop: 4,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noteInputWrapper: {
    marginTop: 4,
  },
  noteInput: {
    height: 36,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#92400E',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    height: 46,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  errIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  errTxt: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyTxt: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  historyContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  historyHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historySubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  historyMeta: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
