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
  type DashboardScheduleItem,
  type TeacherTaskItem,
} from '@/api/client';
import { useAuth } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { TeachFlowLoader } from '@/components/branding/TeachFlowLoader';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { computeScheduleStatus, formatFullDateVN, getTodayVN } from '@/utils/date';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [classroomsData, setClassroomsData] = useState<ClassroomListResponse | null>(null);
  const [tasks, setTasks] = useState<TeacherTaskItem[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<DashboardScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const teacherName = user?.teacher?.fullName || user?.email?.split('@')[0] || 'Thầy/Cô';
  const todayStr = getTodayVN();
  const formattedDate = formatFullDateVN(new Date());

  const loadDashboardData = useCallback(async () => {
    try {
      const [classRes, taskRes, scheduleRes] = await Promise.allSettled([
        apiClient.getClassrooms(),
        apiClient.getTasks(),
        apiClient.getDashboardSchedule({ date: todayStr }),
      ]);

      if (classRes.status === 'fulfilled') {
        setClassroomsData(classRes.value);
      }
      if (taskRes.status === 'fulfilled') {
        setTasks(taskRes.value || []);
      }
      if (scheduleRes.status === 'fulfilled') {
        setTodaySchedules(scheduleRes.value || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStr]);

  useEffect(() => {
    let isMounted = true;
    const fetchInit = async () => {
      try {
        const [classRes, taskRes, scheduleRes] = await Promise.allSettled([
          apiClient.getClassrooms(),
          apiClient.getTasks(),
          apiClient.getDashboardSchedule({ date: todayStr }),
        ]);

        if (!isMounted) return;
        if (classRes.status === 'fulfilled') {
          setClassroomsData(classRes.value);
        }
        if (taskRes.status === 'fulfilled') {
          setTasks(taskRes.value || []);
        }
        if (scheduleRes.status === 'fulfilled') {
          setTodaySchedules(scheduleRes.value || []);
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
  }, [todayStr]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const homeroomClass = classroomsData?.items?.find(
    (c: ClassroomItem) =>
      c.homeroomTeacherId === user?.teacher?.id || c.teacherId === user?.teacher?.id,
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <AppHeader title="TeachFlow" />
        <TeachFlowLoader variant="fullscreen" label="Đang tải dữ liệu..." />
      </View>
    );
  }

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
            onPress={() => router.push('/schedule')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.quickIcon}>📅</Text>
            </View>
            <Text style={styles.quickLabel}>Lịch dạy</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/attendance')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.quickIcon}>📋</Text>
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
              <Text style={styles.quickIcon}>✅</Text>
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
            {/* Today's Schedule Widget */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>
                  LỊCH DẠY HÔM NAY ({todaySchedules.length})
                </Text>
                <Pressable onPress={() => router.push('/schedule')}>
                  <Text style={styles.linkText}>Xem lịch đầy đủ →</Text>
                </Pressable>
              </View>

              {todaySchedules.length > 0 ? (
                <View style={styles.scheduleList}>
                  {todaySchedules.map((item) => {
                    const st = computeScheduleStatus(item);
                    return (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [
                          styles.scheduleItemCard,
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => router.push('/schedule')}>
                        <View style={styles.scheduleTimeCol}>
                          <Text style={styles.scheduleTimeText}>{item.time}</Text>
                          {item.room ? (
                            <Text style={styles.scheduleRoomText}>P.{item.room}</Text>
                          ) : null}
                        </View>

                        <View style={styles.scheduleDivider} />

                        <View style={styles.scheduleInfoCol}>
                          <Text style={styles.scheduleSubjectText} numberOfLines={1}>
                            {item.subject}
                          </Text>
                          <Text style={styles.scheduleClassText}>
                            Lớp {item.className}
                            {item.gradeName ? ` • Khối ${item.gradeName}` : ''}
                          </Text>
                          {item.lessonPlanTitle ? (
                            <Text style={styles.scheduleLessonPlanText} numberOfLines={1}>
                              📖 {item.lessonPlanTitle}
                            </Text>
                          ) : null}
                        </View>

                        <View
                          style={[
                            styles.scheduleStatusBadge,
                            { backgroundColor: st.bgColor, borderColor: st.borderColor },
                          ]}>
                          <Text
                            style={[
                              styles.scheduleStatusText,
                              { color: st.textColor },
                            ]}>
                            {st.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    🎉 Hôm nay Thầy/Cô không có tiết dạy nào.
                  </Text>
                </View>
              )}
            </View>

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

            {/* Lớp học phụ trách */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>
                  LỚP HỌC PHỤ TRÁCH ({classroomsData?.items?.length || 0})
                </Text>
                <Pressable onPress={() => router.push('/classrooms')}>
                  <Text style={styles.linkText}>Xem tất cả →</Text>
                </Pressable>
              </View>

              {classroomsData?.items && classroomsData.items.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
                  {classroomsData.items.slice(0, 5).map((cls: ClassroomItem) => {
                    const isHr =
                      cls.homeroomTeacherId === user?.teacher?.id ||
                      cls.teacherId === user?.teacher?.id;
                    return (
                      <Pressable
                        key={cls.id}
                        style={({ pressed }) => [styles.classMiniCard, pressed && styles.cardPressed]}
                        onPress={() => router.push(`/classroom/${cls.id}`)}>
                        <View style={styles.clsMiniHeader}>
                          <Text style={styles.clsMiniName}>Lớp {cls.name}</Text>
                          {isHr && <Text style={styles.starIcon}>🌟</Text>}
                        </View>
                        <Text style={styles.clsMiniDesc}>
                          Khối {cls.grade} • {cls.studentCount} học sinh
                        </Text>
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
    paddingBottom: 96,
    gap: Spacing.md,
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
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  greetingTitle: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  greetingDate: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  greetingDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    gap: 4,
  },
  btnPressed: {
    opacity: 0.8,
  },
  quickIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    fontSize: 18,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sectionContainer: {
    gap: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  scheduleList: {
    gap: Spacing.xs,
  },
  scheduleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  scheduleTimeCol: {
    width: 80,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scheduleRoomText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scheduleDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  scheduleInfoCol: {
    flex: 1,
  },
  scheduleSubjectText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scheduleClassText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  scheduleLessonPlanText: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 2,
  },
  scheduleStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  scheduleStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  homeroomCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.9,
  },
  hrTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeHomeroom: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeHomeroomText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  hrClassName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  hrStats: {
    alignItems: 'flex-end',
  },
  hrStudentsCount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  hrStudentsLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  hrFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
  },
  hrFooterInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hrAttendanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  horizScroll: {
    paddingVertical: 2,
  },
  classMiniCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 160,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  clsMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clsMiniName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  starIcon: {
    fontSize: 12,
  },
  clsMiniDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  clsMiniFooter: {
    marginTop: 4,
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
    padding: Spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  taskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
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
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
