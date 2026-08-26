import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  type ClassroomItem,
  type ClassroomListResponse,
  type TeacherTaskItem,
} from '@/api/client';
import { useAuth } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [classroomsData, setClassroomsData] = useState<ClassroomListResponse | null>(null);
  const [tasks, setTasks] = useState<TeacherTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const teacherName = user?.teacher?.fullName || user?.email?.split('@')[0] || 'Thầy/Cô';

  const today = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[today.getDay()];
  const formattedDate = `${dayName}, ${today.getDate()} tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;

  const loadDashboardData = useCallback(async () => {
    try {
      const [classRes, taskRes] = await Promise.allSettled([
        apiClient.getClassrooms(),
        apiClient.getTasks(),
      ]);

      if (classRes.status === 'fulfilled') {
        setClassroomsData(classRes.value);
      }
      if (taskRes.status === 'fulfilled') {
        setTasks(taskRes.value || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInit = async () => {
      try {
        const [classRes, taskRes] = await Promise.allSettled([
          apiClient.getClassrooms(),
          apiClient.getTasks(),
        ]);

        if (!isMounted) return;
        if (classRes.status === 'fulfilled') {
          setClassroomsData(classRes.value);
        }
        if (taskRes.status === 'fulfilled') {
          setTasks(taskRes.value || []);
        }
      } catch {
        // Ignored
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchInit();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const homeroomClass = classroomsData?.items?.find(
    (c: ClassroomItem) =>
      c.homeroomTeacherId === user?.teacher?.id || c.teacherId === user?.teacher?.id,
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="TeachFlow" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }>
        {/* Greeting Banner */}
        <View style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>Xin chào, {teacherName}! 👋</Text>
          <Text style={styles.greetingDate}>{formattedDate}</Text>
          <Text style={styles.greetingDesc}>
            Chúc Thầy/Cô một ngày làm việc hiệu quả và tràn đầy năng lượng sư phạm.
          </Text>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeading}>THAO TÁC NHANH</Text>
        <View style={styles.quickGrid}>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/attendance')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.quickIcon}>📅</Text>
            </View>
            <Text style={styles.quickLabel}>Điểm danh</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/lesson-plans')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Text style={styles.quickIcon}>📖</Text>
            </View>
            <Text style={styles.quickLabel}>Giáo án</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/students')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.quickIcon}>👥</Text>
            </View>
            <Text style={styles.quickLabel}>Học sinh</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/tasks')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.quickIcon}>📋</Text>
            </View>
            <Text style={styles.quickLabel}>Công việc</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang cập nhật dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* Homeroom Summary Card */}
            {homeroomClass && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>LỚP CHỦ NHIỆM</Text>
                  <Pressable onPress={() => router.push('/homeroom')}>
                    <Text style={styles.linkText}>Chi tiết →</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.homeroomCard, pressed && styles.cardPressed]}
                  onPress={() => router.push(`/classroom/${homeroomClass.id}`)}>
                  <View style={styles.hrTop}>
                    <View>
                      <View style={styles.badgeHomeroom}>
                        <Text style={styles.badgeHomeroomText}>Lớp chủ nhiệm</Text>
                      </View>
                      <Text style={styles.hrClassName}>Lớp {homeroomClass.name}</Text>
                    </View>
                    <View style={styles.hrStats}>
                      <Text style={styles.hrStudentsCount}>{homeroomClass.studentCount}</Text>
                      <Text style={styles.hrStudentsLabel}>Học sinh</Text>
                    </View>
                  </View>

                  <View style={styles.hrFooter}>
                    <Text style={styles.hrFooterInfo}>
                      Khối {homeroomClass.grade} • Năm học {homeroomClass.schoolYear?.name || '--'}
                    </Text>
                    <Text style={styles.hrAttendanceText}>
                      Chuyên cần: {homeroomClass.attendance !== null ? `${homeroomClass.attendance}%` : '--'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* Lịch dạy & Danh sách lớp hôm nay */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>LỚP HỌC PHỤ TRÁCH ({classroomsData?.items?.length || 0})</Text>
                <Pressable onPress={() => router.push('/classrooms')}>
                  <Text style={styles.linkText}>Xem tất cả →</Text>
                </Pressable>
              </View>

              {classroomsData?.items && classroomsData.items.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
                  {classroomsData.items.slice(0, 5).map((cls: ClassroomItem) => {
                    const isHr = cls.homeroomTeacherId === user?.teacher?.id || cls.teacherId === user?.teacher?.id;
                    return (
                      <Pressable
                        key={cls.id}
                        style={({ pressed }) => [styles.classMiniCard, pressed && styles.cardPressed]}
                        onPress={() => router.push(`/classroom/${cls.id}`)}>
                        <View style={styles.clsMiniHeader}>
                          <Text style={styles.clsMiniName}>Lớp {cls.name}</Text>
                          {isHr && <Text style={styles.starIcon}>🌟</Text>}
                        </View>
                        <Text style={styles.clsMiniDesc}>Khối {cls.grade} • {cls.studentCount} học sinh</Text>
                        <View style={styles.clsMiniFooter}>
                          <Text style={styles.clsAction}>Vào lớp →</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Chưa có lớp học được phân công</Text>
                </View>
              )}
            </View>

            {/* Nhiệm vụ / Công việc cần làm */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>CÔNG VIỆC CẦN LÀM ({tasks.length})</Text>
                <Pressable onPress={() => router.push('/tasks')}>
                  <Text style={styles.linkText}>Tất cả →</Text>
                </Pressable>
              </View>

              {tasks.length > 0 ? (
                <View style={styles.tasksList}>
                  {tasks.slice(0, 4).map((task) => (
                    <Pressable
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => router.push('/tasks')}>
                      <View style={styles.taskBullet} />
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          {task.title}
                        </Text>
                        {task.due && (
                          <Text style={styles.taskDueDate}>
                            Hạn: {task.due}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.taskStatusBadge,
                          {
                            backgroundColor:
                              task.done ? Colors.successBg : Colors.surfaceMuted,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.taskStatusText,
                            {
                              color:
                                task.done ? Colors.success : Colors.textSecondary,
                            },
                          ]}>
                          {task.done ? 'Hoàn thành' : 'Đang xử lý'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>🎉 Không có công việc tồn đọng!</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  greetingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  greetingTitle: {
    ...Typography.titleLarge,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  greetingDate: {
    ...Typography.labelBold,
    color: Colors.primary,
    fontSize: 13,
  },
  greetingDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  btnPressed: {
    backgroundColor: Colors.surfaceMuted,
    transform: [{ scale: 0.97 }],
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    fontSize: 20,
  },
  quickLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 12,
  },
  sectionContainer: {
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  homeroomCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.md,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  hrTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeHomeroom: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeHomeroomText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  hrClassName: {
    ...Typography.titleLarge,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  hrStats: {
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  hrStudentsCount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  hrStudentsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hrFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  hrFooterInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hrAttendanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  horizScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  classMiniCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  clsMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clsMiniName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  starIcon: {
    fontSize: 14,
  },
  clsMiniDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clsMiniFooter: {
    marginTop: Spacing.sm,
  },
  clsAction: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  tasksList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    gap: Spacing.sm,
  },
  taskBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  taskDueDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
