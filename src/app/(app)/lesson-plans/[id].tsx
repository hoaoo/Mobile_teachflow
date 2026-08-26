import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, type LessonPlanItem, type LessonPlanStatus } from '@/api/client';

function getStatusBadge(status?: LessonPlanStatus | string) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Hoàn thành', color: '#059669', bg: '#ECFDF5' };
    case 'TAUGHT':
      return { label: 'Đã dạy', color: '#0284C7', bg: '#F0F9FF' };
    case 'DRAFT':
    default:
      return { label: 'Bản nháp', color: '#D97706', bg: '#FFFBEB' };
  }
}

export default function LessonPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [plan, setPlan] = useState<LessonPlanItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        setErrorMessage(null);
        if (!isRefresh) setLoading(true);
        const res = await apiClient.getLessonPlanById(id);
        setPlan(res);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Không thể tải chi tiết giáo án',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      if (!id) return;
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getLessonPlanById(id);
        if (isMounted) {
          setPlan(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải chi tiết giáo án',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail(true);
  }, [fetchDetail]);

  const handleExportDocx = async () => {
    if (!id) return;
    const url = apiClient.getLessonPlanExportDocxUrl(id);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Xuất Word', `Đường dẫn tải file DOCX:\n${url}`);
    }
  };

  const handleExportPdf = async () => {
    if (!id) return;
    const url = apiClient.getLessonPlanExportPdfUrl(id);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Xuất PDF', `Đường dẫn tải file PDF:\n${url}`);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const duplicated = await apiClient.duplicateLessonPlan(id);
      Alert.alert('Thành công', 'Đã nhân bản giáo án thành công', [
        {
          text: 'Mở giáo án mới',
          onPress: () => {
            router.replace({
              pathname: '/lesson-plans/[id]',
              params: { id: duplicated.id },
            });
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi nhân bản giáo án';
      Alert.alert('Lỗi', msg);
    }
  };

  const handleDelete = () => {
    if (!id || !plan) return;
    Alert.alert(
      'Xóa giáo án',
      `Bạn có chắc chắn muốn xóa giáo án "${plan.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteLessonPlan(id);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Lỗi xóa giáo án';
              Alert.alert('Lỗi', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải chi tiết giáo án...</Text>
      </View>
    );
  }

  if (errorMessage || !plan) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errIcon}>⚠️</Text>
        <Text style={styles.errTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errText}>{errorMessage || 'Không tìm thấy giáo án'}</Text>
        <Pressable style={styles.retryBtn} onPress={() => fetchDetail()}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const badge = getStatusBadge(plan.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#0284C7']}
        />
      }>
      {/* Top Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerTopRow}>
          <View style={styles.badgeGroup}>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>{plan.subject || 'Toán'}</Text>
            </View>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{plan.grade || 'Khối 4'}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.planTitle}>{plan.title}</Text>
        {plan.topic ? <Text style={styles.planTopic}>Chủ đề: {plan.topic}</Text> : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📅 Ngày dạy: {plan.date || 'Chưa xếp'}</Text>
          <Text style={styles.metaText}>⏱️ Thời lượng: {plan.duration || 35} phút</Text>
        </View>

        {/* Action Toolbar */}
        <View style={styles.actionToolbar}>
          <Pressable style={styles.actionBtn} onPress={handleExportDocx}>
            <Text style={styles.actionBtnIcon}>📄</Text>
            <Text style={styles.actionBtnText}>Xuất Word</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleExportPdf}>
            <Text style={styles.actionBtnIcon}>📥</Text>
            <Text style={styles.actionBtnText}>Xuất PDF</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              router.push({
                pathname: '/lesson-plans/edit',
                params: { id: plan.id },
              });
            }}>
            <Text style={styles.actionBtnIcon}>✏️</Text>
            <Text style={styles.actionBtnText}>Sửa</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleDuplicate}>
            <Text style={styles.actionBtnIcon}>📋</Text>
            <Text style={styles.actionBtnText}>Nhân bản</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.deleteActionBtn]}
            onPress={handleDelete}
            disabled={isDeleting}>
            <Text style={styles.actionBtnIcon}>🗑️</Text>
            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Xóa</Text>
          </Pressable>
        </View>
      </View>

      {/* Section 1: Mục tiêu bài học */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>I. YÊU CẦU CẦN ĐẠT / MỤC TIÊU</Text>

        <Text style={styles.itemHeading}>1. Yêu cầu cần đạt về kiến thức & kỹ năng:</Text>
        <Text style={styles.itemContent}>
          {plan.objective || 'Chưa cập nhật mục tiêu bài học.'}
        </Text>

        {plan.specificCompetencies ? (
          <>
            <Text style={styles.itemHeading}>2. Năng lực đặc thù:</Text>
            <Text style={styles.itemContent}>{plan.specificCompetencies}</Text>
          </>
        ) : null}

        {plan.generalCompetencies ? (
          <>
            <Text style={styles.itemHeading}>3. Năng lực chung:</Text>
            <Text style={styles.itemContent}>{plan.generalCompetencies}</Text>
          </>
        ) : null}

        {plan.qualities ? (
          <>
            <Text style={styles.itemHeading}>4. Phẩm chất chủ yếu:</Text>
            <Text style={styles.itemContent}>{plan.qualities}</Text>
          </>
        ) : null}
      </View>

      {/* Section 2: Đồ dùng dạy học */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>II. ĐỒ DÙNG DẠY HỌC & THIẾT BỊ</Text>
        <Text style={styles.itemContent}>
          {plan.teachingEquipment || 'Giáo viên: SGK, máy chiếu, bảng phụ.\nHọc sinh: SGK, vở ghi, bộ đồ dùng học tập.'}
        </Text>
      </View>

      {/* Section 3: Tiến trình hoạt động dạy học */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>
          III. TIẾN TRÌNH DẠY HỌC ({plan.activities?.length || 0} HOẠT ĐỘNG)
        </Text>

        {(!plan.activities || plan.activities.length === 0) ? (
          <Text style={styles.emptyActivityText}>
            Chưa có hoạt động dạy học nào được cấu hình cho giáo án này.
          </Text>
        ) : (
          plan.activities.map((act, idx) => (
            <View key={act.id || idx} style={styles.activityCard}>
              <View style={styles.activityHeaderRow}>
                <View style={styles.phaseBadge}>
                  <Text style={styles.phaseBadgeText}>{act.phase || `Hoạt động ${idx + 1}`}</Text>
                </View>
                <Text style={styles.activityMinutes}>⏱️ {act.minutes || 5} phút</Text>
              </View>

              <Text style={styles.activityTitle}>{act.title}</Text>

              {act.objective ? (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockLabel}>🎯 Mục tiêu:</Text>
                  <Text style={styles.subBlockText}>{act.objective}</Text>
                </View>
              ) : null}

              {act.teacher ? (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockLabel}>👨‍🏫 Hoạt động của Giáo viên:</Text>
                  <Text style={styles.subBlockText}>{act.teacher}</Text>
                </View>
              ) : null}

              {act.students ? (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockLabel}>👩‍🎓 Hoạt động của Học sinh:</Text>
                  <Text style={styles.subBlockText}>{act.students}</Text>
                </View>
              ) : null}

              {act.method || act.technique ? (
                <View style={styles.activityMetaRow}>
                  {act.method ? (
                    <Text style={styles.metaChip}>Phương pháp: {act.method}</Text>
                  ) : null}
                  {act.technique ? (
                    <Text style={styles.metaChip}>Kỹ thuật: {act.technique}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Section 4: Ghi chú & Điều chỉnh */}
      {plan.postLessonAdjustment || plan.notes ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>IV. ĐIỀU CHỈNH SAU BÀI DẠY & GHI CHÚ</Text>
          {plan.postLessonAdjustment ? (
            <View style={styles.subBlock}>
              <Text style={styles.subBlockLabel}>Điều chỉnh sau bài dạy:</Text>
              <Text style={styles.itemContent}>{plan.postLessonAdjustment}</Text>
            </View>
          ) : null}
          {plan.notes ? (
            <View style={styles.subBlock}>
              <Text style={styles.subBlockLabel}>Ghi chú:</Text>
              <Text style={styles.itemContent}>{plan.notes}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  planTopic: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actionToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  itemHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },
  itemContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  emptyActivityText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    gap: 8,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  activityMinutes: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subBlock: {
    gap: 2,
  },
  subBlockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  subBlockText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  activityMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaChip: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loadingText: {
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
  errText: {
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
});
