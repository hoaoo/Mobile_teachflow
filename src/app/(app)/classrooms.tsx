import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { apiClient, type ClassroomItem, type ClassroomListResponse } from '@/api/client';
import { useAuth } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export default function ClassroomsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<ClassroomListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'HOMEROOM' | 'SUBJECT'>('ALL');

  const fetchClassrooms = useCallback(async (keyword = '') => {
    try {
      setErrorMessage(null);
      const res = await apiClient.getClassrooms({
        keyword: keyword.trim() || undefined,
      });
      setData(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải danh sách lớp học');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadClassrooms = async () => {
      try {
        const res = await apiClient.getClassrooms({
          keyword: searchKeyword.trim() || undefined,
        });
        if (isMounted) {
          setData(res);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách lớp học');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      loadClassrooms();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [searchKeyword]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClassrooms(searchKeyword);
  };

  const filteredClassrooms = (data?.items || []).filter((cls: ClassroomItem) => {
    const isHr = cls.homeroomTeacherId === user?.teacher?.id || cls.teacherId === user?.teacher?.id;
    if (filterType === 'HOMEROOM') {
      return isHr;
    }
    if (filterType === 'SUBJECT') {
      return !isHr;
    }
    return true;
  });

  const renderClassroomCard = ({ item }: { item: ClassroomItem }) => {
    const isHr = item.homeroomTeacherId === user?.teacher?.id || item.teacherId === user?.teacher?.id;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/classroom/${item.id}`)}>
        {/* Header of Card */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.className}>{item.name}</Text>
            {isHr && (
              <View style={styles.badgeHomeroom}>
                <Text style={styles.badgeHomeroomText}>Chủ nhiệm</Text>
              </View>
            )}
            <View style={styles.badgeGrade}>
              <Text style={styles.badgeGradeText}>Khối {item.grade}</Text>
            </View>
          </View>

          <Text style={styles.arrowIcon}>→</Text>
        </View>

        {/* School Year & Session */}
        <View style={styles.cardSubheader}>
          <Text style={styles.academicYearText}>Năm học: {item.schoolYear?.name || '--'}</Text>
          {item.room && <Text style={styles.roomText}>Phòng: {item.room}</Text>}
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Sĩ số</Text>
            <Text style={styles.metricValue}>{item.studentCount} HS</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Chuyên cần</Text>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              {item.attendance !== null ? `${item.attendance}%` : '--'}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Điểm TB</Text>
            <Text style={[styles.metricValue, { color: Colors.primary }]}>
              {item.average !== null ? `${item.average} đ` : '--'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* KPI Stats */}
      {data?.summary && (
        <View style={styles.kpiContainer}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{data.summary.totalClasses}</Text>
            <Text style={styles.kpiLabel}>Tổng lớp</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{data.summary.totalStudents}</Text>
            <Text style={styles.kpiLabel}>Học sinh</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>
              {data.summary.avgAttendanceRate !== null
                ? `${data.summary.avgAttendanceRate}%`
                : '--'}
            </Text>
            <Text style={styles.kpiLabel}>Chuyên cần</Text>
          </View>
        </View>
      )}

      {/* Search & Action Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên lớp, mã lớp..."
            placeholderTextColor={Colors.textMuted}
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchKeyword.length > 0 && (
            <Pressable onPress={() => setSearchKeyword('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
          onPress={() => router.push('/classroom/create')}>
          <Text style={styles.createBtnText}>＋ Tạo</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterTab, filterType === 'ALL' && styles.filterTabActive]}
          onPress={() => setFilterType('ALL')}>
          <Text
            style={[
              styles.filterTabText,
              filterType === 'ALL' && styles.filterTabTextActive,
            ]}>
            Tất cả ({data?.items?.length || 0})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filterType === 'HOMEROOM' && styles.filterTabActive]}
          onPress={() => setFilterType('HOMEROOM')}>
          <Text
            style={[
              styles.filterTabText,
              filterType === 'HOMEROOM' && styles.filterTabTextActive,
            ]}>
            Chủ nhiệm
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filterType === 'SUBJECT' && styles.filterTabActive]}
          onPress={() => setFilterType('SUBJECT')}>
          <Text
            style={[
              styles.filterTabText,
              filterType === 'SUBJECT' && styles.filterTabTextActive,
            ]}>
            Bộ môn
          </Text>
        </Pressable>
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchClassrooms(searchKeyword)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Lớp học" subtitle="Quản lý phân công & danh sách lớp" />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách lớp học...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClassrooms}
          renderItem={renderClassroomCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏫</Text>
                <Text style={styles.emptyTitle}>Không tìm thấy lớp học nào</Text>
                <Text style={styles.emptyText}>
                  {searchKeyword
                    ? 'Không có kết quả khớp với từ khóa tìm kiếm.'
                    : 'Thầy/Cô chưa được phân công lớp học nào trong học kỳ này.'}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  listHeader: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiItem: {
    alignItems: 'center',
    flex: 1,
  },
  kpiValue: {
    ...Typography.titleMedium,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  kpiLabel: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingHorizontal: 4,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnPressed: {
    opacity: 0.85,
  },
  createBtnText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: Spacing.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: Colors.surfaceMuted,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  className: {
    ...Typography.titleMedium,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  badgeHomeroom: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeHomeroomText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  badgeGrade: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeGradeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  arrowIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  cardSubheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  academicYearText: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  roomText: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
  },
  retryButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  retryButtonText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '700',
  },
});
