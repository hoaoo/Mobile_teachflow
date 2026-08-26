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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  apiClient,
  type ClassroomItem,
  type StudentItem,
  type StudentListResponse,
} from '@/api/client';

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
        // Silently ignore if offline
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
        setPage(currentPage);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể tải danh sách học sinh');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchKeyword, selectedClassId],
  );

  useEffect(() => {
    let isMounted = true;
    const loadInitialStudents = async () => {
      try {
        const res = await apiClient.getStudents({
          page: 1,
          pageSize: 20,
          keyword: searchKeyword.trim() || undefined,
          classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
        });
        if (isMounted) {
          setData(res);
          setPage(1);
          setErrorMessage(null);
        }
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

    loadInitialStudents();

    return () => {
      isMounted = false;
    };
  }, [searchKeyword, selectedClassId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents(1, true);
  }, [fetchStudents]);

  const handleLoadMore = () => {
    if (!data || loadingMore || loading) return;
    if (page < data.totalPages) {
      setLoadingMore(true);
      fetchStudents(page + 1);
    }
  };

  const renderStudentCard = ({ item }: { item: StudentItem }) => {
    const statusColor =
      item.status === 'Tốt'
        ? '#059669'
        : item.status === 'Cần cố gắng'
        ? '#DC2626'
        : '#0284C7';

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => {
          router.push({
            pathname: '/student/[id]',
            params: { id: item.id },
          });
        }}>
        <View style={styles.cardContent}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.initials || 'HS'}</Text>
          </View>

          {/* Info */}
          <View style={styles.infoWrapper}>
            <View style={styles.nameRow}>
              <Text style={styles.studentName}>{item.fullName}</Text>
              {item.studentCode ? (
                <Text style={styles.studentCode}>#{item.studentCode}</Text>
              ) : null}
            </View>

            <View style={styles.subInfoRow}>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{item.className || 'Chưa phân lớp'}</Text>
              </View>
              <Text style={styles.genderText}>
                {item.gender} • {item.dob}
              </Text>
            </View>

            {item.parentName && item.parentName !== 'Chưa cập nhật' ? (
              <Text style={styles.parentText}>
                PH: {item.parentName} {item.parentPhone ? `(${item.parentPhone})` : ''}
              </Text>
            ) : null}
          </View>

          {/* Status / Metric */}
          <View style={styles.statusWrapper}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.status || 'Khá'}
              </Text>
            </View>
            {item.attendance !== null ? (
              <Text style={styles.attendanceText}>{item.attendance}% CC</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Học sinh</Text>
          <Text style={styles.headerSubtitle}>
            {data?.summary?.totalStudents !== undefined
              ? `${data.summary.totalStudents} học sinh trong danh sách`
              : 'Danh sách học sinh quản lý'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/student/create')}>
          <Text style={styles.createButtonText}>＋ Thêm</Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên học sinh, mã HS, phụ huynh..."
          placeholderTextColor="#94A3B8"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Classroom Filter Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          <Pressable
            style={[
              styles.filterChip,
              selectedClassId === 'ALL' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedClassId('ALL')}>
            <Text
              style={[
                styles.filterChipText,
                selectedClassId === 'ALL' && styles.filterChipTextActive,
              ]} numberOfLines={1}>
              Tất cả lớp ({classrooms.length})
            </Text>
          </Pressable>

          {classrooms.map((cls) => (
            <Pressable
              key={cls.id}
              style={[
                styles.filterChip,
                selectedClassId === cls.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedClassId(cls.id)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedClassId === cls.id && styles.filterChipTextActive,
                ]} numberOfLines={1}>
                {cls.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Đang tải danh sách học sinh...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Không thể tải danh sách</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchStudents(1)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0284C7" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Không có học sinh nào</Text>
              <Text style={styles.emptyText}>
                {searchKeyword || selectedClassId !== 'ALL'
                  ? 'Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.'
                  : 'Lớp này chưa có học sinh hoặc bạn chưa tạo hồ sơ học sinh.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterWrapper: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoWrapper: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentCode: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  classBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classBadgeText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '600',
  },
  genderText: {
    fontSize: 12,
    color: '#64748B',
  },
  parentText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusWrapper: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  attendanceText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
