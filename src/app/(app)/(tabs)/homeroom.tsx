import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  apiClient,
  type AttentionStudentItem,
  type BehaviorCategory,
  type BehaviorLevel,
  type BehaviorRecordItem,
  type HomeroomClassItem,
  type HomeroomDashboardData,
  type MonthlyReviewItem,
  type MonthlySummaryData,
  type UpcomingBirthdayItem,
  type WeeklyReviewItem,
  type WeeklySummaryData,
} from '@/api/client';

type HomeroomTab =
  | 'OVERVIEW'
  | 'BEHAVIOR'
  | 'ATTENTION'
  | 'BIRTHDAYS'
  | 'WEEKLY_REVIEW'
  | 'MONTHLY_REVIEW';

const BEHAVIOR_CATEGORIES: { key: BehaviorCategory; label: string }[] = [
  { key: 'DISCIPLINE', label: 'Kỷ luật' },
  { key: 'LEARNING', label: 'Học tập' },
  { key: 'HYGIENE', label: 'Vệ sinh' },
  { key: 'TEAMWORK', label: 'Tập thể' },
  { key: 'RESPONSIBILITY', label: 'Trách nhiệm' },
  { key: 'OTHER', label: 'Khác' },
];

const BEHAVIOR_LEVELS: { key: BehaviorLevel; label: string; color: string }[] = [
  { key: 'POSITIVE', label: 'Tích cực', color: '#059669' },
  { key: 'REMINDER', label: 'Nhắc nhở', color: '#D97706' },
  { key: 'NEEDS_ATTENTION', label: 'Cần chú ý', color: '#DC2626' },
];

export default function HomeroomScreen() {
  const router = useRouter();

  // Homeroom classes state
  const [homeroomClasses, setHomeroomClasses] = useState<HomeroomClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [hasHomeroom, setHasHomeroom] = useState<boolean>(true);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<HomeroomTab>('OVERVIEW');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<HomeroomDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Behavior state
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecordItem[]>([]);
  const [behaviorFilterCategory, setBehaviorFilterCategory] = useState<string>('ALL');
  const [behaviorFilterLevel, setBehaviorFilterLevel] = useState<string>('ALL');
  const [behaviorSearch, setBehaviorSearch] = useState<string>('');
  const [behaviorPage, setBehaviorPage] = useState<number>(1);
  const [loadingBehavior, setLoadingBehavior] = useState<boolean>(false);

  // Behavior Modal (Add/Edit)
  const [showBehaviorModal, setShowBehaviorModal] = useState<boolean>(false);
  const [editingBehaviorId, setEditingBehaviorId] = useState<string | null>(null);
  const [modalStudentId, setModalStudentId] = useState<string>('');
  const [modalRecordDate, setModalRecordDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [modalCategory, setModalCategory] = useState<BehaviorCategory>('DISCIPLINE');
  const [modalLevel, setModalLevel] = useState<BehaviorLevel>('POSITIVE');
  const [modalContent, setModalContent] = useState<string>('');
  const [modalResolution, setModalResolution] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [isSubmittingBehavior, setIsSubmittingBehavior] = useState<boolean>(false);
  const [behaviorModalError, setBehaviorModalError] = useState<string | null>(null);

  // Attention students & Birthdays full data
  const [attentionList, setAttentionList] = useState<AttentionStudentItem[]>([]);
  const [birthdaysList, setBirthdaysList] = useState<UpcomingBirthdayItem[]>([]);

  // Weekly Review State
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReviewItem | null>(null);
  const [weeklyStrengths, setWeeklyStrengths] = useState<string>('');
  const [weeklyLimitations, setWeeklyLimitations] = useState<string>('');
  const [weeklyNextPlan, setWeeklyNextPlan] = useState<string>('');
  const [weeklyNotableStudents, setWeeklyNotableStudents] = useState<string>('');
  const [weeklySupportStudents, setWeeklySupportStudents] = useState<string>('');
  const [isSavingWeekly, setIsSavingWeekly] = useState<boolean>(false);

  // Monthly Review State
  const selectedYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData | null>(null);
  const [monthlyReview, setMonthlyReview] = useState<MonthlyReviewItem | null>(null);
  const [monthlyHighlights, setMonthlyHighlights] = useState<string>('');
  const [monthlyLimitations, setMonthlyLimitations] = useState<string>('');
  const [monthlyNextPlan, setMonthlyNextPlan] = useState<string>('');
  const [monthlyGeneralComment, setMonthlyGeneralComment] = useState<string>('');
  const [isSavingMonthly, setIsSavingMonthly] = useState<boolean>(false);

  // 1. Fetch Teacher's Homeroom Classes
  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        setLoadingInitial(true);
        const res = await apiClient.getMyHomerooms();
        if (isMounted) {
          if (res.hasHomeroomClass && res.classes.length > 0) {
            setHomeroomClasses(res.classes);
            setSelectedClassId(res.classes[0].id);
            setHasHomeroom(true);
          } else {
            setHasHomeroom(false);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setHasHomeroom(false);
          setErrorMessage(err instanceof Error ? err.message : 'Lỗi tải thông tin chủ nhiệm');
        }
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Dashboard for Selected Homeroom Class
  const loadDashboard = useCallback(
    async (classId: string, isRefresh = false) => {
      if (!classId) return;
      try {
        setErrorMessage(null);
        if (!isRefresh) setLoadingDashboard(true);
        const data = await apiClient.getHomeroomDashboard(classId);
        setDashboardData(data);
        setAttentionList(data.studentsNeedAttention || []);
        setBirthdaysList(data.upcomingBirthdays || []);
        if (data.currentWeekReview?.weekNumber) {
          setSelectedWeekNumber(data.currentWeekReview.weekNumber);
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Không thể tải bảng điều khiển chủ nhiệm',
        );
      } finally {
        setLoadingDashboard(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const fetchDash = async () => {
      if (!selectedClassId) return;
      try {
        setErrorMessage(null);
        setLoadingDashboard(true);
        const data = await apiClient.getHomeroomDashboard(selectedClassId);
        if (isMounted) {
          setDashboardData(data);
          setAttentionList(data.studentsNeedAttention || []);
          setBirthdaysList(data.upcomingBirthdays || []);
          if (data.currentWeekReview?.weekNumber) {
            setSelectedWeekNumber(data.currentWeekReview.weekNumber);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải bảng điều khiển chủ nhiệm',
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDashboard(false);
          setRefreshing(false);
        }
      }
    };

    fetchDash();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId]);

  useEffect(() => {
    let isMounted = true;
    const fetchBehaviors = async () => {
      if (activeTab !== 'BEHAVIOR' || !selectedClassId) return;
      try {
        setLoadingBehavior(true);
        const res = await apiClient.getBehaviorRecords({
          classId: selectedClassId,
          category:
            behaviorFilterCategory !== 'ALL'
              ? (behaviorFilterCategory as BehaviorCategory)
              : undefined,
          level:
            behaviorFilterLevel !== 'ALL'
              ? (behaviorFilterLevel as BehaviorLevel)
              : undefined,
          search: behaviorSearch.trim() || undefined,
          page: 1,
          pageSize: 15,
        });
        if (isMounted) {
          setBehaviorRecords(res.items || []);
          setBehaviorPage(1);
        }
      } catch {
        // Silently handle
      } finally {
        if (isMounted) {
          setLoadingBehavior(false);
        }
      }
    };

    fetchBehaviors();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedClassId, behaviorFilterCategory, behaviorFilterLevel, behaviorSearch]);

  useEffect(() => {
    let isMounted = true;
    const fetchWeekly = async () => {
      if (activeTab !== 'WEEKLY_REVIEW' || !selectedClassId) return;
      try {
        const [sum, rev] = await Promise.all([
          apiClient.getWeeklySummary(selectedClassId, selectedWeekNumber).catch(() => null),
          apiClient.getWeeklyReview(selectedClassId, selectedWeekNumber).catch(() => null),
        ]);
        if (isMounted) {
          setWeeklySummary(sum);
          setWeeklyReview(rev);
          setWeeklyStrengths(rev?.strengths || '');
          setWeeklyLimitations(rev?.limitations || '');
          setWeeklyNextPlan(rev?.nextWeekPlan || '');
          setWeeklyNotableStudents(rev?.notableStudents || '');
          setWeeklySupportStudents(rev?.supportStudents || '');
        }
      } catch {
        // Silently handle
      }
    };

    fetchWeekly();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedClassId, selectedWeekNumber]);

  useEffect(() => {
    let isMounted = true;
    const fetchMonthly = async () => {
      if (activeTab !== 'MONTHLY_REVIEW' || !selectedClassId) return;
      try {
        const [sum, rev] = await Promise.all([
          apiClient.getMonthlySummary(selectedClassId, selectedYear, selectedMonth).catch(() => null),
          apiClient.getMonthlyReview(selectedClassId, selectedYear, selectedMonth).catch(() => null),
        ]);
        if (isMounted) {
          setMonthlySummary(sum);
          setMonthlyReview(rev);
          setMonthlyHighlights(rev?.highlights || '');
          setMonthlyLimitations(rev?.limitations || '');
          setMonthlyNextPlan(rev?.nextMonthPlan || '');
          setMonthlyGeneralComment(rev?.generalComment || '');
        }
      } catch {
        // Silently handle
      }
    };

    fetchMonthly();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedClassId, selectedYear, selectedMonth]);

  const loadBehaviors = useCallback(
    async (page = 1) => {
      if (!selectedClassId) return;
      try {
        setLoadingBehavior(true);
        const res = await apiClient.getBehaviorRecords({
          classId: selectedClassId,
          category:
            behaviorFilterCategory !== 'ALL'
              ? (behaviorFilterCategory as BehaviorCategory)
              : undefined,
          level:
            behaviorFilterLevel !== 'ALL'
              ? (behaviorFilterLevel as BehaviorLevel)
              : undefined,
          search: behaviorSearch.trim() || undefined,
          page,
          pageSize: 15,
        });
        setBehaviorRecords(res.items || []);
        setBehaviorPage(page);
      } catch {
        // Silently handle
      } finally {
        setLoadingBehavior(false);
      }
    },
    [selectedClassId, behaviorFilterCategory, behaviorFilterLevel, behaviorSearch],
  );

  const loadWeeklyData = useCallback(
    async (weekNum: number) => {
      if (!selectedClassId) return;
      try {
        const [sum, rev] = await Promise.all([
          apiClient.getWeeklySummary(selectedClassId, weekNum).catch(() => null),
          apiClient.getWeeklyReview(selectedClassId, weekNum).catch(() => null),
        ]);
        setWeeklySummary(sum);
        setWeeklyReview(rev);
        setWeeklyStrengths(rev?.strengths || '');
        setWeeklyLimitations(rev?.limitations || '');
        setWeeklyNextPlan(rev?.nextWeekPlan || '');
        setWeeklyNotableStudents(rev?.notableStudents || '');
        setWeeklySupportStudents(rev?.supportStudents || '');
      } catch {
        // Silently handle
      }
    },
    [selectedClassId],
  );

  const loadMonthlyData = useCallback(
    async (year: number, month: number) => {
      if (!selectedClassId) return;
      try {
        const [sum, rev] = await Promise.all([
          apiClient.getMonthlySummary(selectedClassId, year, month).catch(() => null),
          apiClient.getMonthlyReview(selectedClassId, year, month).catch(() => null),
        ]);
        setMonthlySummary(sum);
        setMonthlyReview(rev);
        setMonthlyHighlights(rev?.highlights || '');
        setMonthlyLimitations(rev?.limitations || '');
        setMonthlyNextPlan(rev?.nextMonthPlan || '');
        setMonthlyGeneralComment(rev?.generalComment || '');
      } catch {
        // Silently handle
      }
    },
    [selectedClassId],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedClassId) {
      loadDashboard(selectedClassId, true);
      if (activeTab === 'BEHAVIOR') loadBehaviors(behaviorPage);
      if (activeTab === 'WEEKLY_REVIEW') loadWeeklyData(selectedWeekNumber);
      if (activeTab === 'MONTHLY_REVIEW') loadMonthlyData(selectedYear, selectedMonth);
    } else {
      setRefreshing(false);
    }
  }, [
    selectedClassId,
    activeTab,
    behaviorPage,
    selectedWeekNumber,
    selectedYear,
    selectedMonth,
    loadDashboard,
    loadBehaviors,
    loadWeeklyData,
    loadMonthlyData,
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BEHAVIOR CRUD ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const openAddBehaviorModal = () => {
    setEditingBehaviorId(null);
    setModalStudentId(dashboardData?.students?.[0]?.id || '');
    setModalRecordDate(new Date().toISOString().split('T')[0]);
    setModalCategory('DISCIPLINE');
    setModalLevel('POSITIVE');
    setModalContent('');
    setModalResolution('');
    setModalNote('');
    setBehaviorModalError(null);
    setShowBehaviorModal(true);
  };

  const openEditBehaviorModal = (record: BehaviorRecordItem) => {
    setEditingBehaviorId(record.id);
    setModalStudentId(record.studentId);
    setModalRecordDate(record.recordDate);
    setModalCategory(record.category);
    setModalLevel(record.level);
    setModalContent(record.content);
    setModalResolution(record.resolution || '');
    setModalNote(record.note || '');
    setBehaviorModalError(null);
    setShowBehaviorModal(true);
  };

  const handleSaveBehavior = async () => {
    if (!modalStudentId) {
      setBehaviorModalError('Vui lòng chọn học sinh');
      return;
    }
    if (!modalContent.trim()) {
      setBehaviorModalError('Vui lòng nhập nội dung ghi nhận');
      return;
    }
    if (!selectedClassId) return;

    setIsSubmittingBehavior(true);
    setBehaviorModalError(null);

    try {
      if (editingBehaviorId) {
        await apiClient.updateBehaviorRecord(editingBehaviorId, {
          recordDate: modalRecordDate,
          category: modalCategory,
          level: modalLevel,
          content: modalContent.trim(),
          resolution: modalResolution.trim() || undefined,
          note: modalNote.trim() || undefined,
        });
      } else {
        await apiClient.createBehaviorRecord({
          classroomId: selectedClassId,
          studentId: modalStudentId,
          recordDate: modalRecordDate,
          category: modalCategory,
          level: modalLevel,
          content: modalContent.trim(),
          resolution: modalResolution.trim() || undefined,
          note: modalNote.trim() || undefined,
        });
      }

      setShowBehaviorModal(false);
      loadBehaviors(1);
      loadDashboard(selectedClassId, true);
    } catch (err: unknown) {
      setBehaviorModalError(
        err instanceof Error ? err.message : 'Không thể lưu ghi nhận nề nếp',
      );
    } finally {
      setIsSubmittingBehavior(false);
    }
  };

  const handleDeleteBehavior = (record: BehaviorRecordItem) => {
    Alert.alert(
      'Xóa ghi nhận nề nếp',
      `Bạn có chắc chắn muốn xóa ghi nhận của học sinh "${record.studentName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteBehaviorRecord(record.id);
              loadBehaviors(behaviorPage);
              loadDashboard(selectedClassId, true);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Lỗi xóa ghi nhận';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ],
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEKLY REVIEW SAVE (Optimistic Concurrency)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSaveWeeklyReview = async () => {
    if (!selectedClassId) return;
    setIsSavingWeekly(true);

    try {
      const res = await apiClient.saveWeeklyReview({
        classroomId: selectedClassId,
        weekNumber: selectedWeekNumber,
        strengths: weeklyStrengths.trim() || undefined,
        limitations: weeklyLimitations.trim() || undefined,
        nextWeekPlan: weeklyNextPlan.trim() || undefined,
        notableStudents: weeklyNotableStudents.trim() || undefined,
        supportStudents: weeklySupportStudents.trim() || undefined,
        version: weeklyReview?.version || 1,
      });

      setWeeklyReview(res);
      Alert.alert('Thành công', 'Đã lưu nhận xét tuần');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('phiên làm việc khác')) {
        Alert.alert(
          'Xung đột dữ liệu',
          'Nhận xét tuần đã được cập nhật bởi một phiên khác. Ứng dụng sẽ tải lại phiên bản mới nhất.',
          [{ text: 'OK', onPress: () => loadWeeklyData(selectedWeekNumber) }],
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Lỗi lưu nhận xét tuần';
        Alert.alert('Lỗi', msg);
      }
    } finally {
      setIsSavingWeekly(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MONTHLY REVIEW SAVE (Optimistic Concurrency)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSaveMonthlyReview = async () => {
    if (!selectedClassId) return;
    setIsSavingMonthly(true);

    try {
      const res = await apiClient.saveMonthlyReview({
        classroomId: selectedClassId,
        year: selectedYear,
        month: selectedMonth,
        highlights: monthlyHighlights.trim() || undefined,
        limitations: monthlyLimitations.trim() || undefined,
        nextMonthPlan: monthlyNextPlan.trim() || undefined,
        generalComment: monthlyGeneralComment.trim() || undefined,
        version: monthlyReview?.version || 1,
      });

      setMonthlyReview(res);
      Alert.alert('Thành công', 'Đã lưu báo cáo tháng');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('phiên làm việc khác')) {
        Alert.alert(
          'Xung đột dữ liệu',
          'Báo cáo tháng đã được cập nhật bởi một phiên khác. Ứng dụng sẽ tải lại phiên bản mới nhất.',
          [{ text: 'OK', onPress: () => loadMonthlyData(selectedYear, selectedMonth) }],
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Lỗi lưu báo cáo tháng';
        Alert.alert('Lỗi', msg);
      }
    } finally {
      setIsSavingMonthly(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════════════════════════════

  if (loadingInitial) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang kiểm tra phân công chủ nhiệm...</Text>
      </View>
    );
  }

  if (!hasHomeroom || homeroomClasses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chủ nhiệm</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🌟</Text>
          <Text style={styles.emptyTitle}>Bạn chưa có lớp chủ nhiệm</Text>
          <Text style={styles.emptySubtitle}>
            Tài khoản của bạn hiện tại chỉ được phân công giảng dạy bộ môn hoặc chưa được gán
            lớp chủ nhiệm trong năm học này.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedClass = homeroomClasses.find((c) => c.id === selectedClassId) || homeroomClasses[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Class Switcher */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Công tác Chủ nhiệm</Text>
          <Text style={styles.headerSubtitle}>
            {selectedClass.name} • {selectedClass.gradeName} • {selectedClass.schoolYearName}
          </Text>
        </View>

        {homeroomClasses.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classPickerScroll}>
            {homeroomClasses.map((cls) => (
              <Pressable
                key={cls.id}
                style={[
                  styles.classChip,
                  selectedClassId === cls.id && styles.classChipActive,
                ]}
                onPress={() => setSelectedClassId(cls.id)}>
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
        ) : null}
      </View>

      {/* Main Sub-Navigation Tabs */}
      <View style={styles.navTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabsContent}>
          <Pressable
            style={[styles.navTab, activeTab === 'OVERVIEW' && styles.navTabActive]}
            onPress={() => setActiveTab('OVERVIEW')}>
            <Text style={[styles.navTabText, activeTab === 'OVERVIEW' && styles.navTabTextActive]}>
              📊 Tổng quan
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'BEHAVIOR' && styles.navTabActive]}
            onPress={() => setActiveTab('BEHAVIOR')}>
            <Text style={[styles.navTabText, activeTab === 'BEHAVIOR' && styles.navTabTextActive]}>
              ⭐ Nề nếp
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'ATTENTION' && styles.navTabActive]}
            onPress={() => setActiveTab('ATTENTION')}>
            <Text style={[styles.navTabText, activeTab === 'ATTENTION' && styles.navTabTextActive]}>
              ⚠️ Cần chú ý ({attentionList.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'BIRTHDAYS' && styles.navTabActive]}
            onPress={() => setActiveTab('BIRTHDAYS')}>
            <Text style={[styles.navTabText, activeTab === 'BIRTHDAYS' && styles.navTabTextActive]}>
              🎂 Sinh nhật ({birthdaysList.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'WEEKLY_REVIEW' && styles.navTabActive]}
            onPress={() => setActiveTab('WEEKLY_REVIEW')}>
            <Text style={[styles.navTabText, activeTab === 'WEEKLY_REVIEW' && styles.navTabTextActive]}>
              📝 Nhận xét tuần
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'MONTHLY_REVIEW' && styles.navTabActive]}
            onPress={() => setActiveTab('MONTHLY_REVIEW')}>
            <Text style={[styles.navTabText, activeTab === 'MONTHLY_REVIEW' && styles.navTabTextActive]}>
              📈 Báo cáo tháng
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Body per Tab */}
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0284C7']}
          />
        }>
        {loadingDashboard && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadDashboard(selectedClassId)}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : activeTab === 'OVERVIEW' ? (
          // ═════════════════════════════════════════════════════════════════
          // SUB-TAB 1: TỔNG QUAN
          // ═════════════════════════════════════════════════════════════════
          <View style={styles.sectionGap}>
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>{dashboardData?.classroom?.studentCount || 0}</Text>
                <Text style={styles.kpiLabel}>Sĩ số lớp</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiNumber, { color: '#059669' }]}>
                  {dashboardData?.attendanceToday?.present || 0}/
                  {dashboardData?.attendanceToday?.total || 0}
                </Text>
                <Text style={styles.kpiLabel}>Hiện diện hôm nay</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiNumber, { color: '#DC2626' }]}>
                  {dashboardData?.studentsNeedAttention?.length || 0}
                </Text>
                <Text style={styles.kpiLabel}>Cần quan tâm</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.cardHeading}>Hành động nhanh</Text>
              <View style={styles.quickActionButtons}>
                <Pressable
                  style={styles.quickBtn}
                  onPress={() => {
                    router.push({
                      pathname: '/attendance',
                      params: { classId: selectedClassId },
                    });
                  }}>
                  <Text style={styles.quickBtnIcon}>📋</Text>
                  <Text style={styles.quickBtnText}>Điểm danh</Text>
                </Pressable>

                <Pressable
                  style={styles.quickBtn}
                  onPress={openAddBehaviorModal}>
                  <Text style={styles.quickBtnIcon}>⭐</Text>
                  <Text style={styles.quickBtnText}>Ghi nề nếp</Text>
                </Pressable>

                <Pressable
                  style={styles.quickBtn}
                  onPress={() => setActiveTab('WEEKLY_REVIEW')}>
                  <Text style={styles.quickBtnIcon}>📝</Text>
                  <Text style={styles.quickBtnText}>Nhận xét</Text>
                </Pressable>

                <Pressable
                  style={styles.quickBtn}
                  onPress={() => setActiveTab('MONTHLY_REVIEW')}>
                  <Text style={styles.quickBtnIcon}>📈</Text>
                  <Text style={styles.quickBtnText}>Báo cáo</Text>
                </Pressable>
              </View>
            </View>

            {/* Students Need Attention Widget */}
            <View style={styles.widgetCard}>
              <View style={styles.widgetHeader}>
                <Text style={styles.cardHeading}>⚠️ Học sinh cần quan tâm</Text>
                <Pressable onPress={() => setActiveTab('ATTENTION')}>
                  <Text style={styles.widgetSeeAll}>Xem tất cả ({attentionList.length}) ›</Text>
                </Pressable>
              </View>

              {attentionList.length === 0 ? (
                <Text style={styles.emptyWidgetText}>Không có học sinh nào cần lưu ý đặc biệt.</Text>
              ) : (
                attentionList.slice(0, 3).map((item) => (
                  <Pressable
                    key={item.studentId}
                    style={styles.attentionItem}
                    onPress={() => {
                      router.push({
                        pathname: '/student/[id]',
                        params: { id: item.studentId },
                      });
                    }}>
                    <View style={styles.itemAvatar}>
                      <Text style={styles.itemAvatarText}>{item.initials || 'HS'}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.studentName}</Text>
                      <Text style={styles.itemSubtitle}>
                        {item.reasons.map((r) => r.description).join(' • ')}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            {/* Upcoming Birthdays Widget */}
            <View style={styles.widgetCard}>
              <View style={styles.widgetHeader}>
                <Text style={styles.cardHeading}>🎂 Sinh nhật sắp tới</Text>
                <Pressable onPress={() => setActiveTab('BIRTHDAYS')}>
                  <Text style={styles.widgetSeeAll}>Xem tất cả ({birthdaysList.length}) ›</Text>
                </Pressable>
              </View>

              {birthdaysList.length === 0 ? (
                <Text style={styles.emptyWidgetText}>Không có sinh nhật nào trong 30 ngày tới.</Text>
              ) : (
                birthdaysList.slice(0, 3).map((item) => (
                  <View key={item.studentId} style={styles.birthdayItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.fullName}</Text>
                      <Text style={styles.itemSubtitle}>
                        {item.dateOfBirth} • Tròn {item.turningAge} tuổi
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.birthdayBadge,
                        item.isToday && styles.birthdayBadgeToday,
                      ]}>
                      <Text
                        style={[
                          styles.birthdayBadgeText,
                          item.isToday && styles.birthdayBadgeTextToday,
                        ]}>
                        {item.isToday ? '🎂 Hôm nay' : `Còn ${item.daysUntilBirthday} ngày`}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : activeTab === 'BEHAVIOR' ? (
          // ═════════════════════════════════════════════════════════════════
          // SUB-TAB 2: NỀ NẾP HỌC SINH
          // ═════════════════════════════════════════════════════════════════
          <View style={styles.sectionGap}>
            {/* Add Record Action & Search */}
            <View style={styles.behaviorHeaderRow}>
              <View style={styles.behaviorSearchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.behaviorSearchInput}
                  placeholder="Tìm học sinh, nội dung..."
                  placeholderTextColor="#94A3B8"
                  value={behaviorSearch}
                  onChangeText={setBehaviorSearch}
                />
              </View>

              <Pressable
                style={styles.addBehaviorBtn}
                onPress={openAddBehaviorModal}>
                <Text style={styles.addBehaviorBtnText}>＋ Ghi nhận</Text>
              </Pressable>
            </View>

            {/* Level Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              <Pressable
                style={[
                  styles.filterChip,
                  behaviorFilterLevel === 'ALL' && styles.filterChipActive,
                ]}
                onPress={() => setBehaviorFilterLevel('ALL')}>
                <Text
                  style={[
                    styles.filterChipText,
                    behaviorFilterLevel === 'ALL' && styles.filterChipTextActive,
                  ]}>
                  Tất cả mức độ
                </Text>
              </Pressable>
              {BEHAVIOR_LEVELS.map((lvl) => (
                <Pressable
                  key={lvl.key}
                  style={[
                    styles.filterChip,
                    behaviorFilterLevel === lvl.key && styles.filterChipActive,
                  ]}
                  onPress={() => setBehaviorFilterLevel(lvl.key)}>
                  <Text
                    style={[
                      styles.filterChipText,
                      behaviorFilterLevel === lvl.key && styles.filterChipTextActive,
                    ]}>
                    {lvl.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              <Pressable
                style={[
                  styles.filterChip,
                  behaviorFilterCategory === 'ALL' && styles.filterChipActive,
                ]}
                onPress={() => setBehaviorFilterCategory('ALL')}>
                <Text
                  style={[
                    styles.filterChipText,
                    behaviorFilterCategory === 'ALL' && styles.filterChipTextActive,
                  ]}>
                  Tất cả danh mục
                </Text>
              </Pressable>
              {BEHAVIOR_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.filterChip,
                    behaviorFilterCategory === cat.key && styles.filterChipActive,
                  ]}
                  onPress={() => setBehaviorFilterCategory(cat.key)}>
                  <Text
                    style={[
                      styles.filterChipText,
                      behaviorFilterCategory === cat.key && styles.filterChipTextActive,
                    ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Behavior List */}
            {loadingBehavior ? (
              <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 20 }} />
            ) : behaviorRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyTitle}>Chưa có ghi nhận nề nếp</Text>
                <Text style={styles.emptyText}>
                  Bấm &ldquo;＋ Ghi nhận&rdquo; để thêm theo dõi nề nếp tích cực hoặc nhắc nhở học sinh.
                </Text>
              </View>
            ) : (
              behaviorRecords.map((record) => {
                const levelConfig =
                  BEHAVIOR_LEVELS.find((l) => l.key === record.level) || BEHAVIOR_LEVELS[0];

                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <View style={styles.recordStudentInfo}>
                        <Text style={styles.recordStudentName}>{record.studentName}</Text>
                        <Text style={styles.recordDate}>{record.recordDate}</Text>
                      </View>

                      <View
                        style={[
                          styles.levelBadge,
                          { backgroundColor: `${levelConfig.color}15` },
                        ]}>
                        <Text style={[styles.levelBadgeText, { color: levelConfig.color }]}>
                          {levelConfig.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.recordContent}>{record.content}</Text>

                    {record.resolution ? (
                      <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionLabel}>Hướng xử lý:</Text>
                        <Text style={styles.resolutionText}>{record.resolution}</Text>
                      </View>
                    ) : null}

                    <View style={styles.recordActionsRow}>
                      <Pressable
                        style={styles.recordActionBtn}
                        onPress={() => openEditBehaviorModal(record)}>
                        <Text style={styles.recordActionText}>✏️ Sửa</Text>
                      </Pressable>

                      <Pressable
                        style={styles.recordActionBtn}
                        onPress={() => handleDeleteBehavior(record)}>
                        <Text style={[styles.recordActionText, { color: '#DC2626' }]}>
                          🗑️ Xóa
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : activeTab === 'ATTENTION' ? (
          // ═════════════════════════════════════════════════════════════════
          // SUB-TAB 3: HỌC SINH CẦN CHÚ Ý
          // ═════════════════════════════════════════════════════════════════
          <View style={styles.sectionGap}>
            <Text style={styles.sectionHelp}>
              Danh sách học sinh cần quan tâm được hệ thống phân tích tự động trong 30 ngày qua
              (dựa trên chuyên cần, kết quả học tập và nề nếp).
            </Text>

            {attentionList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyTitle}>Lớp học ổn định</Text>
                <Text style={styles.emptyText}>
                  Không có học sinh nào gặp vấn đề nề nếp hoặc chuyên cần trong 30 ngày qua.
                </Text>
              </View>
            ) : (
              attentionList.map((item) => (
                <Pressable
                  key={item.studentId}
                  style={styles.attentionFullCard}
                  onPress={() => {
                    router.push({
                      pathname: '/student/[id]',
                      params: { id: item.studentId },
                    });
                  }}>
                  <View style={styles.attentionCardTop}>
                    <View style={styles.itemAvatar}>
                      <Text style={styles.itemAvatarText}>{item.initials || 'HS'}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.studentName}</Text>
                      <Text style={styles.itemSubtitle}>Bấm để xem hồ sơ chi tiết 360</Text>
                    </View>
                  </View>

                  <View style={styles.reasonsList}>
                    {item.reasons.map((r, i) => (
                      <View key={i} style={styles.reasonTag}>
                        <Text style={styles.reasonTagText}>⚠️ {r.description}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : activeTab === 'BIRTHDAYS' ? (
          // ═════════════════════════════════════════════════════════════════
          // SUB-TAB 4: SINH NHẬT SẮP TỚI
          // ═════════════════════════════════════════════════════════════════
          <View style={styles.sectionGap}>
            <Text style={styles.sectionHelp}>
              Danh sách sinh nhật của học sinh trong lớp trong vòng 30 ngày tới.
            </Text>

            {birthdaysList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🎂</Text>
                <Text style={styles.emptyTitle}>Không có sinh nhật sắp tới</Text>
                <Text style={styles.emptyText}>
                  Không có học sinh nào trong lớp có ngày sinh trong 30 ngày tiếp theo.
                </Text>
              </View>
            ) : (
              birthdaysList.map((item) => (
                <View key={item.studentId} style={styles.birthdayFullCard}>
                  <View style={styles.birthdayCardContent}>
                    <View style={styles.itemAvatar}>
                      <Text style={styles.itemAvatarText}>{item.initials || 'HS'}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.fullName}</Text>
                      <Text style={styles.itemSubtitle}>
                        Ngày sinh: {item.dateOfBirth} • Sắp tròn {item.turningAge} tuổi
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.birthdayBadge,
                      item.isToday && styles.birthdayBadgeToday,
                    ]}>
                    <Text
                      style={[
                        styles.birthdayBadgeText,
                        item.isToday && styles.birthdayBadgeTextToday,
                      ]}>
                      {item.isToday ? '🎂 Hôm nay' : `Còn ${item.daysUntilBirthday} ngày`}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'WEEKLY_REVIEW' ? (
          // ═════════════════════════════════════════════════════════════════
          // SUB-TAB 5: NHẬN XÉT TUẦN
          // ═════════════════════════════════════════════════════════════════
          <View style={styles.sectionGap}>
            {/* Week Selector */}
            <View style={styles.selectorRow}>
              <Text style={styles.selectorLabel}>Chọn tuần học:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <Pressable
                    key={w}
                    style={[
                      styles.selectorPill,
                      selectedWeekNumber === w && styles.selectorPillActive,
                    ]}
                    onPress={() => setSelectedWeekNumber(w)}>
                    <Text
                      style={[
                        styles.selectorPillText,
                        selectedWeekNumber === w && styles.selectorPillTextActive,
                      ]}>
                      Tuần {w}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Weekly Auto Summary Metric */}
            {weeklySummary ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryBoxTitle}>
                  Số liệu tổng hợp tự động ({weeklySummary.dateRange})
                </Text>
                <View style={styles.summaryMetrics}>
                  <Text style={styles.summaryMetricItem}>
                    👥 Chuyên cần: {weeklySummary.attendance.presentRate ?? '--'}%
                  </Text>
                  <Text style={styles.summaryMetricItem}>
                    ⭐ Nề nếp: {weeklySummary.behavior.positive} tích cực /{' '}
                    {weeklySummary.behavior.reminder} nhắc nhở
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Review Form */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeading}>Nội dung nhận xét tuần {selectedWeekNumber}</Text>

              <Text style={styles.inputLabel}>Điểm nổi bật / Thành tích trong tuần</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Lớp thực hiện tốt nề nếp xếp hàng, tích cực phát biểu..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={weeklyStrengths}
                onChangeText={setWeeklyStrengths}
              />

              <Text style={styles.inputLabel}>Tồn tại / Hạn chế cần khắc phục</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Vẫn còn hiện tượng nói chuyện riêng trong giờ..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={weeklyLimitations}
                onChangeText={setWeeklyLimitations}
              />

              <Text style={styles.inputLabel}>Kế hoạch trọng tâm tuần tiếp theo</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Rèn nề nếp tự quản, ôn tập chuẩn bị kiểm tra..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={weeklyNextPlan}
                onChangeText={setWeeklyNextPlan}
              />

              <Text style={styles.inputLabel}>Học sinh tuyên dương nổi bật</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Nguyễn Văn An, Trần Thị Bình"
                placeholderTextColor="#94A3B8"
                value={weeklyNotableStudents}
                onChangeText={setWeeklyNotableStudents}
              />

              <Text style={styles.inputLabel}>Học sinh cần tăng cường hỗ trợ</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Lê Văn Cường (chuyên cần)"
                placeholderTextColor="#94A3B8"
                value={weeklySupportStudents}
                onChangeText={setWeeklySupportStudents}
              />

              <Pressable
                style={[styles.submitBtn, isSavingWeekly && styles.submitBtnDisabled]}
                onPress={handleSaveWeeklyReview}
                disabled={isSavingWeekly}>
                {isSavingWeekly ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Lưu nhận xét tuần {selectedWeekNumber}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          // ═════════════════════════════════════════════════════════════════
          // SUB-TAB 6: BÁO CÁO THÁNG
          // ═════════════════════════════════════════════════════════════════
          <View style={styles.sectionGap}>
            {/* Month Selector */}
            <View style={styles.selectorRow}>
              <Text style={styles.selectorLabel}>Chọn tháng:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <Pressable
                    key={m}
                    style={[
                      styles.selectorPill,
                      selectedMonth === m && styles.selectorPillActive,
                    ]}
                    onPress={() => setSelectedMonth(m)}>
                    <Text
                      style={[
                        styles.selectorPillText,
                        selectedMonth === m && styles.selectorPillTextActive,
                      ]}>
                      Tháng {m}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Monthly Summary Auto Metrics */}
            {monthlySummary ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryBoxTitle}>
                  Tổng hợp tháng {selectedMonth}/{selectedYear}
                </Text>
                <View style={styles.summaryMetrics}>
                  <Text style={styles.summaryMetricItem}>
                    👥 Sĩ số: {monthlySummary.attendance.totalStudents} HS • Chuyên cần:{' '}
                    {monthlySummary.attendance.attendanceRate ?? '--'}%
                  </Text>
                  <Text style={styles.summaryMetricItem}>
                    ⭐ Nề nếp: {monthlySummary.behavior.positive} tích cực /{' '}
                    {monthlySummary.behavior.needsAttention} cần lưu ý
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Monthly Review Form */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeading}>
                Báo cáo tổng kết tháng {selectedMonth}/{selectedYear}
              </Text>

              <Text style={styles.inputLabel}>Thành tích / Điểm nổi bật trong tháng</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Đạt giải Nhất tuần lễ nề nếp, 100% học sinh hoàn thành bài..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={monthlyHighlights}
                onChangeText={setMonthlyHighlights}
              />

              <Text style={styles.inputLabel}>Hạn chế còn tồn tại</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Tình trạng đi muộn vào ngày đầu tuần..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={monthlyLimitations}
                onChangeText={setMonthlyLimitations}
              />

              <Text style={styles.inputLabel}>Kế hoạch trọng tâm tháng tiếp theo</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Tổ chức sinh hoạt chuyên đề, ôn tập thi giữa kỳ..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={monthlyNextPlan}
                onChangeText={setMonthlyNextPlan}
              />

              <Text style={styles.inputLabel}>Nhận xét chung của giáo viên chủ nhiệm</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Đánh giá tổng quan về tập thể lớp trong tháng..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={monthlyGeneralComment}
                onChangeText={setMonthlyGeneralComment}
              />

              <Pressable
                style={[styles.submitBtn, isSavingMonthly && styles.submitBtnDisabled]}
                onPress={handleSaveMonthlyReview}
                disabled={isSavingMonthly}>
                {isSavingMonthly ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Lưu báo cáo tháng {selectedMonth}/{selectedYear}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Behavior Create/Edit Modal */}
      <Modal visible={showBehaviorModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingBehaviorId ? 'Cập nhật ghi nhận nề nếp' : 'Ghi nhận nề nếp học sinh'}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedClass.name}</Text>

            {behaviorModalError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{behaviorModalError}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalFormScroll}>
              {/* Student Picker */}
              <Text style={styles.inputLabel}>Học sinh *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studentChipsRow}>
                {(dashboardData?.students || []).map((s) => (
                  <Pressable
                    key={s.id}
                    style={[
                      styles.studentChip,
                      modalStudentId === s.id && styles.studentChipActive,
                    ]}
                    onPress={() => setModalStudentId(s.id)}>
                    <Text
                      style={[
                        styles.studentChipText,
                        modalStudentId === s.id && styles.studentChipTextActive,
                      ]}>
                      {s.fullName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Level Picker */}
              <Text style={styles.inputLabel}>Mức độ ghi nhận *</Text>
              <View style={styles.levelRow}>
                {BEHAVIOR_LEVELS.map((lvl) => (
                  <Pressable
                    key={lvl.key}
                    style={[
                      styles.levelOption,
                      modalLevel === lvl.key && {
                        borderColor: lvl.color,
                        backgroundColor: `${lvl.color}15`,
                      },
                    ]}
                    onPress={() => setModalLevel(lvl.key)}>
                    <Text
                      style={[
                        styles.levelOptionText,
                        modalLevel === lvl.key && { color: lvl.color, fontWeight: '700' },
                      ]}>
                      {lvl.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Category Picker */}
              <Text style={styles.inputLabel}>Danh mục *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
                {BEHAVIOR_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.key}
                    style={[
                      styles.filterChip,
                      modalCategory === cat.key && styles.filterChipActive,
                    ]}
                    onPress={() => setModalCategory(cat.key)}>
                    <Text
                      style={[
                        styles.filterChipText,
                        modalCategory === cat.key && styles.filterChipTextActive,
                      ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Record Date */}
              <Text style={styles.inputLabel}>Ngày ghi nhận (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={modalRecordDate}
                onChangeText={setModalRecordDate}
              />

              {/* Content */}
              <Text style={styles.inputLabel}>Nội dung chi tiết *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ví dụ: Giúp bạn cùng lớp giải toán, tích cực phát biểu..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={modalContent}
                onChangeText={setModalContent}
              />

              {/* Resolution */}
              <Text style={styles.inputLabel}>Hướng xử lý (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đã nhắc nhở trực tiếp, khen thưởng trước lớp..."
                placeholderTextColor="#94A3B8"
                value={modalResolution}
                onChangeText={setModalResolution}
              />

              {/* Note */}
              <Text style={styles.inputLabel}>Ghi chú nội bộ (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ghi chú thêm của giáo viên..."
                placeholderTextColor="#94A3B8"
                value={modalNote}
                onChangeText={setModalNote}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowBehaviorModal(false)}
                disabled={isSubmittingBehavior}>
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalSubmitBtn,
                  isSubmittingBehavior && styles.submitBtnDisabled,
                ]}
                onPress={handleSaveBehavior}
                disabled={isSubmittingBehavior}>
                {isSubmittingBehavior ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>
                    {editingBehaviorId ? 'Cập nhật' : 'Tạo ghi nhận'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  classPickerScroll: {
    marginTop: 8,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
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
  navTabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  navTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  navTabActive: {
    backgroundColor: '#0284C7',
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  navTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionGap: {
    gap: 14,
  },
  sectionHelp: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    textAlign: 'center',
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widgetSeeAll: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  emptyWidgetText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 6,
  },
  attentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  birthdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  birthdayBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  birthdayBadgeToday: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  birthdayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  birthdayBadgeTextToday: {
    color: '#92400E',
    fontWeight: '700',
  },
  behaviorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  behaviorSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 42,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  behaviorSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  addBehaviorBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBehaviorBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordStudentInfo: {
    flex: 1,
  },
  recordStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  resolutionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  resolutionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  resolutionText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  recordActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  recordActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  recordActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  attentionFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attentionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonsList: {
    gap: 4,
  },
  reasonTag: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasonTagText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  birthdayFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  birthdayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  selectorScroll: {
    gap: 8,
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  selectorPillActive: {
    backgroundColor: '#0284C7',
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  selectorPillTextActive: {
    color: '#FFFFFF',
  },
  summaryBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 12,
  },
  summaryBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 6,
  },
  summaryMetrics: {
    gap: 4,
  },
  summaryMetricItem: {
    fontSize: 12,
    color: '#0C4A6E',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textarea: {
    height: 72,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 46,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFormScroll: {
    maxHeight: 380,
  },
  studentChipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  studentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  studentChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  studentChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  studentChipTextActive: {
    color: '#FFFFFF',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOption: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  levelOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
