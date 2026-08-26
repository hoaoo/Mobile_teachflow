import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  apiClient,
  type ClassroomItem,
  type StudentItem,
  type StudentListResponse,
} from '@/api/client';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export default function StudentsScreen() {
  const router = useRouter();

  const [data, setData] = useState<StudentListResponse | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadClassrooms = async () => {
      try {
        const res = await apiClient.getClassrooms();
        if (isMounted) setClassrooms(res.items || []);
      } catch {
        // Silently ignore
      }
    };
    loadClassrooms();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchStudents = useCallback(
    async (currentPage = 1, isRefresh = false) => {
      try {
        setErrorMessage(null);
        if (currentPage === 1 && !isRefresh) {
          setLoading(true);
        }

        const res = await apiClient.getStudents({
          page: currentPage,
          pageSize: 20,
          keyword: searchKeyword.trim() || undefined,
          classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
        });

        if (currentPage === 1) {
          setData(res);
        } else {
          setData((prev) =>
            prev
              ? {
                  ...res,
                  items: [...prev.items, ...res.items],
                }
              : res,
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể tải danh sách học sinh');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [searchKeyword, selectedClassId],
  );

  useEffect(() => {
    let isMounted = true;
    const loadInit = async () => {
      try {
        setErrorMessage(null);
        setLoading(true);

        const res = await apiClient.getStudents({
          page: 1,
          pageSize: 20,
          keyword: searchKeyword.trim() || undefined,
          classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
        });

        if (!isMounted) return;
        setData(res);
        setPage(1);
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách học sinh');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      loadInit();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [searchKeyword, selectedClassId]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchStudents(1, true);
  };

  const handleLoadMore = () => {
    if (data && page < data.totalPages && !loadingMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      fetchStudents(nextPage);
    }
  };

  const renderStudentItem = ({ item }: { item: StudentItem }) => {
    const initial = (item.fullName || 'H').trim().charAt(0).toUpperCase();

    return (
      <Pressable
        style={({ pressed }) => [styles.studentCard, pressed && styles.cardPressed]}
        onPress={() => router.push(`/student/${item.id}`)}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={styles.studentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.fullName}
            </Text>
            {item.gender && (
              <View
                style={[
                  styles.genderBadge,
                  {
                    backgroundColor:
                      item.gender === 'MALE' ? '#E0F2FE' : '#FCE7F3',
                  },
                ]}>
                <Text
                  style={[
                    styles.genderText,
                    {
                      color: item.gender === 'MALE' ? '#0284C7' : '#DB2777',
                    },
                  ]}>
                  {item.gender === 'MALE' ? 'Nam' : 'Nữ'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.studentCode}>Mã: {item.studentCode || '--'}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.className}>{item.className || 'Chưa xếp lớp'}</Text>
          </View>

          {item.parentPhone && (
            <Text style={styles.parentPhone}>📞 Phụ huynh: {item.parentPhone}</Text>
          )}
        </View>

        <Text style={styles.arrowIcon}>→</Text>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search Bar & Action */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên học sinh, mã HS..."
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
          onPress={() => router.push('/student/create')}>
          <Text style={styles.createBtnText}>＋ Thêm</Text>
        </Pressable>
      </View>

      {/* Classroom Horizontal Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.classChipsScroll}>
        <Pressable
          style={[styles.classChip, selectedClassId === 'ALL' && styles.classChipActive]}
          onPress={() => setSelectedClassId('ALL')}>
          <Text
            style={[
              styles.classChipText,
              selectedClassId === 'ALL' && styles.classChipTextActive,
            ]}>
            Tất cả lớp
          </Text>
        </Pressable>

        {classrooms.map((cls) => (
          <Pressable
            key={cls.id}
            style={[styles.classChip, selectedClassId === cls.id && styles.classChipActive]}
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

      {/* Summary KPI Banner */}
      {data?.summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            Hiển thị <Text style={styles.summaryBold}>{data.items?.length || 0}</Text> /{' '}
            <Text style={styles.summaryBold}>{data.summary.totalStudents}</Text> học sinh
          </Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchStudents(1)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Học sinh" subtitle="Danh sách & hồ sơ học sinh" />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách học sinh...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Không tìm thấy học sinh nào</Text>
                <Text style={styles.emptyText}>
                  {searchKeyword
                    ? 'Không có học sinh nào khớp với từ khóa.'
                    : 'Chưa có dữ liệu học sinh trong lớp học này.'}
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
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
  classChipsScroll: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  classChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  classChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  classChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  summaryBox: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.surfaceMuted,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  studentName: {
    ...Typography.titleSmall,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  genderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  genderText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  studentCode: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  className: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  parentPhone: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 14,
    color: Colors.textMuted,
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
  loadingMore: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
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
