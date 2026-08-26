import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  apiClient,
  type NotificationItem,
  type NotificationListResponse,
} from '@/api/client';
import { AppHeader } from '@/components/AppHeader';
import { TeachFlowLoader } from '@/components/branding/TeachFlowLoader';
import { useNotification } from '@/context/notification-context';
import { NotificationCard } from '@/features/notifications/components/NotificationCard';
import { NotificationDetailModal } from '@/features/notifications/components/NotificationDetailModal';
import { resolveNotificationRoute } from '@/features/notifications/navigation/notification-navigator';
import { Colors, Radius, Spacing } from '@/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { unreadCount, refreshUnreadCount, decrementUnreadCount, clearUnreadCount, setUnreadCount } = useNotification();

  // Filter: 'ALL' | 'UNREAD'
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');

  // List State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detail Modal State
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Fetch Page of Notifications
  const fetchNotifications = useCallback(
    async (targetPage = 1, isRefresh = false) => {
      try {
        setErrorMessage(null);
        if (targetPage === 1 && !isRefresh) {
          setLoading(true);
        } else if (targetPage > 1) {
          setLoadingMore(true);
        }

        const res: NotificationListResponse = await apiClient.getNotifications({
          isRead: filterMode === 'UNREAD' ? false : undefined,
          page: targetPage,
          pageSize: 20,
        });

        const items = res.data || res.items || [];

        if (targetPage === 1) {
          setNotifications(items);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = items.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newItems];
          });
        }

        setPage(res.page || targetPage);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || items.length);

        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể tải danh sách thông báo');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [filterMode, setUnreadCount],
  );

  // Effect on filter change
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await apiClient.getNotifications({
          isRead: filterMode === 'UNREAD' ? false : undefined,
          page: 1,
          pageSize: 20,
        });
        if (isMounted) {
          const items = res.data || res.items || [];
          setNotifications(items);
          setPage(res.page || 1);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.total || items.length);
          if (typeof res.unreadCount === 'number') {
            setUnreadCount(res.unreadCount);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải thông báo');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [filterMode, setUnreadCount]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
    refreshUnreadCount();
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && page < totalPages) {
      fetchNotifications(page + 1);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await apiClient.markAllNotificationsAsRead();
      clearUnreadCount();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      if (filterMode === 'UNREAD') {
        setNotifications([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
      Alert.alert('Lỗi', msg);
    } finally {
      setMarkingAll(false);
    }
  };

  // Notification Card Press Handler
  const handleNotificationPress = async (item: NotificationItem) => {
    // 1. Optimistically mark as read if unread
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      decrementUnreadCount(1);
      try {
        await apiClient.markNotificationAsRead(item.id);
      } catch {
        // Silently continue
      }
    }

    // 2. Resolve deep-link route
    const target = resolveNotificationRoute(item);

    if (target && target.pathname && !target.isDetailFallback) {
      if (target.params) {
        router.push({
          pathname: target.pathname as any,
          params: target.params,
        });
      } else {
        router.push(target.pathname as any);
      }
    } else {
      // Fallback: Open notification detail modal
      setSelectedNotification(item);
      setIsDetailOpen(true);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    try {
      const itemToDelete = notifications.find((n) => n.id === id);
      if (itemToDelete && !itemToDelete.isRead) {
        decrementUnreadCount(1);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      await apiClient.deleteNotification(id);
    } catch {
      // Refresh to sync if error
      fetchNotifications(1, true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Thông báo" showBack={true} />

      {/* Control Bar: Filter Tabs & Mark All Read */}
      <View style={styles.controlBar}>
        <View style={styles.filterTabs}>
          <Pressable
            style={[styles.filterTab, filterMode === 'ALL' && styles.filterTabActive]}
            onPress={() => setFilterMode('ALL')}>
            <Text
              style={[
                styles.filterTabText,
                filterMode === 'ALL' && styles.filterTabTextActive,
              ]}>
              Tất cả {filterMode === 'ALL' && totalCount > 0 ? `(${totalCount})` : ''}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterTab, filterMode === 'UNREAD' && styles.filterTabActive]}
            onPress={() => setFilterMode('UNREAD')}>
            <Text
              style={[
                styles.filterTabText,
                filterMode === 'UNREAD' && styles.filterTabTextActive,
              ]}>
              Chưa đọc {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </Pressable>
        </View>

        {unreadCount > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.markAllBtn,
              markingAll && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={handleMarkAllAsRead}
            disabled={markingAll}>
            {markingAll ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.markAllText}>✓ Đã đọc tất cả</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Main List Area */}
      {loading && !refreshing ? (
        <TeachFlowLoader variant="fullscreen" label="Đang tải danh sách thông báo..." />
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi tải thông báo</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchNotifications(1)}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>
            {filterMode === 'UNREAD'
              ? 'Bạn đã xem tất cả thông báo'
              : 'Bạn chưa có thông báo nào'}
          </Text>
          <Text style={styles.emptyText}>
            {filterMode === 'UNREAD'
              ? 'Tất cả các nhắc nhở và thông báo mới đã được đánh dấu là đã đọc.'
              : 'Các thông báo về lịch dạy, điểm danh, công việc và học sinh sẽ xuất hiện tại đây.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={handleNotificationPress}
              onDelete={handleDeleteNotification}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Full Detail Modal Fallback */}
      <NotificationDetailModal
        visible={isDetailOpen}
        notification={selectedNotification}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedNotification(null);
        }}
        onNavigate={() => {
          if (!selectedNotification) return;
          const target = resolveNotificationRoute(selectedNotification);
          if (target && target.pathname) {
            router.push(target.pathname as any);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    padding: 3,
    flex: 1,
  },
  filterTab: {
    flex: 1,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  markAllBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    opacity: 0.85,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 96,
    gap: Spacing.sm,
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerLoaderText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  retryBtnText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    margin: Spacing.md,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
