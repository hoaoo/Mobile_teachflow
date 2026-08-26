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
import { apiClient, type TeachingResourceItem } from '@/api/client';

const RESOURCE_TYPES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DOCUMENT', label: 'Tài liệu' },
  { key: 'PRESENTATION', label: 'Bài giảng PPT' },
  { key: 'SPREADSHEET', label: 'Bảng tính' },
  { key: 'IMAGE', label: 'Hình ảnh' },
  { key: 'VIDEO', label: 'Video' },
  { key: 'LINK', label: 'Liên kết' },
];

function getResourceIcon(type?: string): string {
  switch (type?.toUpperCase()) {
    case 'DOCUMENT':
      return '📄';
    case 'PRESENTATION':
      return '📊';
    case 'SPREADSHEET':
      return '📈';
    case 'IMAGE':
      return '🖼️';
    case 'VIDEO':
      return '🎥';
    case 'LINK':
      return '🔗';
    default:
      return '📁';
  }
}

export default function ResourcesListScreen() {
  const router = useRouter();

  const [resources, setResources] = useState<TeachingResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchResources = useCallback(
    async (isRefresh = false) => {
      try {
        setErrorMessage(null);
        if (!isRefresh) setLoading(true);
        const res = await apiClient.getResources({
          resourceType: selectedType !== 'ALL' ? selectedType : undefined,
          search: search.trim() || undefined,
        });
        setResources(res || []);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Không thể tải danh sách tài nguyên',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedType, search],
  );

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getResources({
          resourceType: selectedType !== 'ALL' ? selectedType : undefined,
          search: search.trim() || undefined,
        });
        if (isMounted) {
          setResources(res || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách tài nguyên',
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
  }, [selectedType, search]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResources(true);
  }, [fetchResources]);

  const renderResourceCard = ({ item }: { item: TeachingResourceItem }) => {
    const icon = getResourceIcon(item.resourceType);

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/resources/[id]',
            params: { id: item.id },
          });
        }}>
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.cardTopRow}>
            <View style={styles.badgeGroup}>
              {item.subjectName ? (
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{item.subjectName}</Text>
                </View>
              ) : null}
              {item.gradeName ? (
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>{item.gradeName}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.metaSize}>{item.formattedSize || item.meta || ''}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || item.name}
          </Text>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          {item.lessonTitle ? (
            <Text style={styles.lessonTag} numberOfLines={1}>
              📖 {item.lessonTitle}
            </Text>
          ) : null}
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
              placeholder="Tìm kiếm tài nguyên, bài giảng..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/resources/create')}>
            <Text style={styles.createBtnText}>＋ Thêm</Text>
          </Pressable>
        </View>

        {/* Type Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}>
          {RESOURCE_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[
                styles.filterChip,
                selectedType === t.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(t.key)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === t.key && styles.filterChipTextActive,
                ]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Đang tải danh sách học liệu...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errTitle}>Không thể tải tài nguyên</Text>
          <Text style={styles.errText}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchResources()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>Chưa có tài nguyên nào</Text>
          <Text style={styles.emptySubtitle}>
            Tải lên tài liệu, bài giảng PowerPoint, hình ảnh minh họa hoặc liên kết để hỗ trợ giảng dạy.
          </Text>
          <Pressable
            style={styles.createMainBtn}
            onPress={() => router.push('/resources/create')}>
            <Text style={styles.createMainBtnText}>＋ Tải lên tài nguyên mới</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={renderResourceCard}
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    alignItems: 'center',
  },
  cardLeft: {
    justifyContent: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  cardRight: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  metaSize: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  lessonTag: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
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
