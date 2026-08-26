import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, type StudentDetailResponse } from '@/api/client';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStudentDetail = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const res = await apiClient.getStudent(id);
      setStudent(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải thông tin học sinh');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      if (!id) return;
      try {
        const res = await apiClient.getStudent(id);
        if (isMounted) {
          setStudent(res);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải thông tin học sinh');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  const handleDelete = () => {
    if (!id || !student) return;
    Alert.alert(
      'Xóa hồ sơ học sinh',
      `Bạn có chắc chắn muốn rút/xóa học sinh "${student.fullName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteStudent(id);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Không thể xóa học sinh';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải hồ sơ học sinh...</Text>
      </View>
    );
  }

  if (errorMessage || !student) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errorMessage}>{errorMessage || 'Không tìm thấy học sinh'}</Text>
        <Pressable style={styles.retryButton} onPress={fetchStudentDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor =
    student.status === 'Tốt'
      ? '#059669'
      : student.status === 'Cần cố gắng'
      ? '#DC2626'
      : '#0284C7';

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
      {/* Header Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.initials || 'HS'}</Text>
        </View>

        <Text style={styles.fullName}>{student.fullName}</Text>

        <View style={styles.badgeRow}>
          {student.studentCode ? (
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>#{student.studentCode}</Text>
            </View>
          ) : null}
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>
              {student.className || 'Chưa phân lớp'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {student.status || 'Khá'}
            </Text>
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsCard}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Chuyên cần</Text>
          <Text style={[styles.metricValue, { color: '#059669' }]}>
            {student.attendance !== null ? `${student.attendance}%` : '--'}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Đánh giá gần nhất</Text>
          <Text style={[styles.metricValue, { color: '#0284C7' }]}>
            {student.latestAssessmentText || 'Chưa có'}
          </Text>
        </View>
      </View>

      {/* Personal Info Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giới tính</Text>
          <Text style={styles.infoValue}>{student.gender}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày sinh</Text>
          <Text style={styles.infoValue}>{student.dob}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phụ huynh</Text>
          <Text style={styles.infoValue}>{student.parentName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại phụ huynh</Text>
          <Text style={styles.infoValue}>{student.parentPhone}</Text>
        </View>
      </View>

      {/* Enrollment History */}
      {student.studentEnrollments && student.studentEnrollments.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Lịch sử ghi danh & Phân lớp</Text>
          {student.studentEnrollments.map((enr, idx) => (
            <View key={enr.id || idx} style={styles.enrollmentItem}>
              <View style={styles.enrollmentIcon}>
                <Text style={styles.enrollmentIconText}>🏫</Text>
              </View>
              <View style={styles.enrollmentInfo}>
                <Text style={styles.enrollmentClass}>
                  {enr.classroom?.name || 'Lớp học'}
                </Text>
                <Text style={styles.enrollmentYear}>
                  {enr.schoolYear?.name || 'Năm học'} • {enr.status === 'ACTIVE' ? 'Đang học' : enr.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Teacher Notes / Comments */}
      {student.comments && student.comments.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nhận xét của giáo viên</Text>
          {student.comments.map((c, idx) => (
            <View key={c.id || idx} style={styles.commentItem}>
              <Text style={styles.commentContent}>&ldquo;{c.content}&rdquo;</Text>
              <Text style={styles.commentMeta}>
                {c.teacher?.fullName ? `— ${c.teacher.fullName}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Delete Action */}
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>🗑️ Xóa / Rút học sinh khỏi hệ thống</Text>
      </Pressable>
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
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  classBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  enrollmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  enrollmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  enrollmentIconText: {
    fontSize: 14,
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentClass: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  enrollmentYear: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  commentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  commentContent: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
  },
  commentMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
