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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient, type ClassroomItem, type ClassroomListResponse } from '@/api/client';
import { useAuth } from '@/auth';

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

    loadClassrooms();

    return () => {
      isMounted = false;
    };
  }, [searchKeyword]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClassrooms(searchKeyword);
  }, [fetchClassrooms, searchKeyword]);

  const currentTeacherId = user?.teacher?.id;

  const filteredItems = (data?.items || []).filter((item) => {
    const isHomeroom =
      Boolean(item.homeroomTeacherId && item.homeroomTeacherId === currentTeacherId);

    if (filterType === 'HOMEROOM') {
      return isHomeroom;
    }
    if (filterType === 'SUBJECT') {
      return !isHomeroom;
    }
    return true;
  });

  const renderClassroomCard = ({ item }: { item: ClassroomItem }) => {
    const isHomeroom =
      Boolean(item.homeroomTeacherId && item.homeroomTeacherId === currentTeacherId);

    const gradeLabel = item.gradeDetail?.name || item.grade || 'Khối lớp';
    const schoolYearLabel = item.schoolYear?.name || 'Năm học hiện tại';
    const roomLabel = item.room || 'Phòng học';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isHomeroom && styles.homeroomCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => {
          router.push({
            pathname: '/classroom/[id]',
            params: { id: item.id },
          });
        }}>
        {/* Header with Title & Badges */}
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classCode}>{item.code}</Text>
          </View>

          {isHomeroom ? (
            <View style={styles.homeroomBadge}>
              <Text style={styles.homeroomBadgeText}>★ Chủ nhiệm</Text>
            </View>
          ) : (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>Bộ môn</Text>
            </View>
          )}
        </View>

        {/* Subtitle / Metadata */}
        <Text style={styles.metaText}>
          {gradeLabel} • {schoolYearLabel}
        </Text>
        <Text style={styles.roomText}>📍 {roomLabel}</Text>

        <View style={styles.cardDivider} />

        {/* Footer Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Sĩ số</Text>
            <Text style={styles.metricValue}>👥 {item.studentCount} HS</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Chuyên cần</Text>
            <Text style={[styles.metricValue, { color: '#059669' }]}>
              {item.attendance !== null ? `${item.attendance}%` : '--'}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Điểm TB</Text>
            <Text style={[styles.metricValue, { color: '#0284C7' }]}>
              {item.average !== null ? `${item.average} đ` : '--'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lớp học</Text>
          <Text style={styles.headerSubtitle}>Quản lý phân công & danh sách lớp</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/classroom/create')}>
          <Text style={styles.createButtonText}>＋ Tạo lớp</Text>
        </Pressable>
      </View>

      {/* Summary KPI Banner */}
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

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên lớp, mã lớp..."
          placeholderTextColor="#94A3B8"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterType('ALL')}>
          <Text
            style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
            Tất cả ({data?.items?.length || 0})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'HOMEROOM' && styles.filterChipActive]}
          onPress={() => setFilterType('HOMEROOM')}>
          <Text
            style={[
              styles.filterChipText,
              filterType === 'HOMEROOM' && styles.filterChipTextActive,
            ]}>
            Chủ nhiệm
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'SUBJECT' && styles.filterChipActive]}
          onPress={() => setFilterType('SUBJECT')}>
          <Text
            style={[
              styles.filterChipText,
              filterType === 'SUBJECT' && styles.filterChipTextActive,
            ]}>
            Bộ môn
          </Text>
        </Pressable>
      </View>

      {/* Content State */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Đang tải danh sách lớp học...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => fetchClassrooms(searchKeyword)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderClassroomCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏫</Text>
              <Text style={styles.emptyTitle}>Chưa có lớp học nào</Text>
              <Text style={styles.emptyText}>
                {searchKeyword
                  ? 'Không tìm thấy lớp học phù hợp với từ khóa.'
                  : 'Bạn chưa có lớp học nào được phân công hoặc tạo mới.'}
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
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
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
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  homeroomCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F8FCFF',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleWrapper: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  classCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  homeroomBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  homeroomBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  subjectBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  roomText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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
