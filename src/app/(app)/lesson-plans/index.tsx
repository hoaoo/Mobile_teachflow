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
import { apiClient, type LessonPlanItem, type LessonPlanStatus } from '@/api/client';

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DRAFT', label: 'Bản nháp' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'TAUGHT', label: 'Đã dạy' },
];

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

export default function LessonPlansListScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPlans = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage(null);
      if (!isRefresh) setLoading(true);
      const res = await apiClient.getLessonPlans({
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: search.trim() || undefined,
      });
      setPlans(res || []);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách giáo án',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, search]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getLessonPlans({
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: search.trim() || undefined,
        });
        if (isMounted) {
          setPlans(res || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách giáo án',
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
  }, [selectedStatus, search]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlans(true);
  }, [fetchPlans]);

  const renderPlanCard = ({ item }: { item: LessonPlanItem }) => {
    const badge = getStatusBadge(item.status);

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/lesson-plans/[id]',
            params: { id: item.id },
          });
        }}>
        <View style={styles.cardTopRow}>
          <View style={styles.badgeGroup}>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>{item.subject || 'Toán'}</Text>
            </View>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{item.grade || 'Khối 4'}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.topic ? <Text style={styles.cardTopic}>Chủ đề: {item.topic}</Text> : null}

        <View style={styles.cardDivider} />

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardMeta}>
            📅 {item.date || 'Chưa xếp ngày'} • ⏱️ {item.duration || 35} phút
          </Text>
          <Text style={styles.activityCount}>
            📝 {item.activities?.length || item.activitiesCount || 0} hoạt động
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions */}
      <View style={styles.topSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo tên bài học, môn, chủ đề..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/lesson-plans/create')}>
            <Text style={styles.createBtnText}>＋ Soạn</Text>
          </Pressable>
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}>
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                selectedStatus === f.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(f.key)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === f.key && styles.filterChipTextActive,
                ]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Đang tải danh sách giáo án...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errTitle}>Không thể tải danh sách</Text>
          <Text style={styles.errText}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchPlans()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>Chưa có giáo án nào</Text>
          <Text style={styles.emptySubtitle}>
            Bắt đầu soạn kế hoạch bài dạy mới hoặc sử dụng Trợ lý AI để tự động sinh cấu trúc giáo án.
          </Text>
          <Pressable
            style={styles.createMainBtn}
            onPress={() => router.push('/lesson-plans/create')}>
            <Text style={styles.createMainBtnText}>＋ Soạn giáo án mới</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={renderPlanCard}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  createBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipsRow: {
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
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardTopic: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  activityCount: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
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
  emptyIcon: {
    fontSize: 44,
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
    marginBottom: 16,
  },
  createMainBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
