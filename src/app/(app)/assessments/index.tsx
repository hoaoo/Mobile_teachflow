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
import { apiClient, type AssessmentItem } from '@/api/client';

const SEMESTER_FILTERS = [
  { key: 0, label: 'Tất cả học kỳ' },
  { key: 1, label: 'Học kỳ I' },
  { key: 2, label: 'Học kỳ II' },
];

function getStatusBadge(status?: string) {
  if (status === 'COMPLETED' || status === 'Hoàn thành' || status === 'Đã hoàn thành') {
    return { label: 'Đã hoàn thành', color: '#059669', bg: '#ECFDF5' };
  }
  return { label: 'Đang thực hiện', color: '#0284C7', bg: '#F0F9FF' };
}

export default function AssessmentsListScreen() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAssessments = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage(null);
      if (!isRefresh) setLoading(true);
      const res = await apiClient.getAssessments({
        semester: selectedSemester > 0 ? selectedSemester : undefined,
      });
      setAssessments(res || []);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách đợt đánh giá',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSemester]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getAssessments({
          semester: selectedSemester > 0 ? selectedSemester : undefined,
        });
        if (isMounted) {
          setAssessments(res || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách đợt đánh giá',
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
  }, [selectedSemester]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssessments(true);
  }, [fetchAssessments]);

  const filteredAssessments = assessments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const matchTitle = a.title?.toLowerCase().includes(q);
    const matchClass = a.classroom?.name?.toLowerCase().includes(q);
    const matchSub = a.subject?.name?.toLowerCase().includes(q);
    const matchSubtitle = a.subtitle?.toLowerCase().includes(q);
    return matchTitle || matchClass || matchSub || matchSubtitle;
  });

  const renderAssessmentCard = ({ item }: { item: AssessmentItem }) => {
    const badge = getStatusBadge(item.status);
    const evaluatedCount = item.studentAssessments?.length ?? 0;

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/assessments/[id]',
            params: { id: item.id },
          });
        }}>
        <View style={styles.cardTopRow}>
          <View style={styles.badgeGroup}>
            {item.classroom?.name ? (
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{item.classroom.name}</Text>
              </View>
            ) : null}

            {item.subject?.name ? (
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{item.subject.name}</Text>
              </View>
            ) : null}

            <View style={styles.semesterBadge}>
              <Text style={styles.semesterBadgeText}>
                {item.semester === 2 ? 'HK2' : 'HK1'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.cardSubtitle}>{item.subtitle}</Text> : null}

        <View style={styles.cardDivider} />

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardMeta}>
            📅 {item.assessmentDate ? item.assessmentDate.split('T')[0] : 'Đang diễn ra'}
          </Text>
          <Text style={styles.cardProgress}>
            👥 {item.meta || `${evaluatedCount} học sinh đã đánh giá`}
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
              placeholder="Tìm theo tên đợt, lớp, môn..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/assessments/create')}>
            <Text style={styles.createBtnText}>＋ Tạo đợt</Text>
          </Pressable>
        </View>

        {/* Semester Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}>
          {SEMESTER_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                selectedSemester === f.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSemester(f.key)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedSemester === f.key && styles.filterChipTextActive,
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
          <Text style={styles.loadingText}>Đang tải danh sách đánh giá...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errTitle}>Không thể tải danh sách</Text>
          <Text style={styles.errText}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchAssessments()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : filteredAssessments.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Chưa có đợt đánh giá nào</Text>
          <Text style={styles.emptySubtitle}>
            Tạo đợt đánh giá định kỳ hoặc thường xuyên để theo dõi tiến độ và xếp loại học tập của học sinh.
          </Text>
          <Pressable
            style={styles.createMainBtn}
            onPress={() => router.push('/assessments/create')}>
            <Text style={styles.createMainBtnText}>＋ Tạo đợt đánh giá mới</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredAssessments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssessmentCard}
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
  classBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  subjectBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  semesterBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semesterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
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
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
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
  cardProgress: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
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
