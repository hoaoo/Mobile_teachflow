import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '@/context/drawer-context';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export function NotificationModal() {
  const insets = useSafeAreaInsets();
  const { isNotifOpen, closeNotif } = useDrawer();

  if (!isNotifOpen) {
    return null;
  }

  const notifications = [
    {
      id: '1',
      title: 'Chào mừng Thầy/Cô đến với TeachFlow',
      body: 'Hệ thống quản lý lớp học và trợ lý giảng dạy đã sẵn sàng phục vụ năm học mới.',
      time: 'Hôm nay',
      type: 'info',
      icon: '🎉',
    },
    {
      id: '2',
      title: 'Nhắc nhở điểm danh chuyên cần',
      body: 'Đừng quên ghi nhận điểm danh buổi sáng cho các lớp học được phân công.',
      time: '07:30',
      type: 'reminder',
      icon: '📅',
    },
    {
      id: '3',
      title: 'Trợ lý AI sẵn sàng',
      body: 'Thầy/Cô có thể sử dụng Trợ lý AI để soạn kế hoạch bài dạy và thiết kế câu hỏi.',
      time: 'Hôm qua',
      type: 'ai',
      icon: '✨',
    },
  ];

  return (
    <Modal
      transparent
      visible={isNotifOpen}
      animationType="fade"
      onRequestClose={closeNotif}>
      <Pressable style={styles.backdrop} onPress={closeNotif}>
        <View
          style={[
            styles.modalCard,
            {
              top: Math.max(insets.top + 56, 64),
              right: Spacing.md,
            },
          ]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔔 Thông báo</Text>
            <Pressable style={styles.closeBtn} onPress={closeNotif}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {notifications.map((n) => (
              <View key={n.id} style={styles.notifItem}>
                <View style={styles.notifIconBox}>
                  <Text style={styles.notifIcon}>{n.icon}</Text>
                </View>
                <View style={styles.notifInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                  <Text style={styles.notifBody}>{n.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.allReadBtn} onPress={closeNotif}>
              <Text style={styles.allReadText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  modalCard: {
    position: 'absolute',
    width: 320,
    maxHeight: 400,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    ...Typography.titleSmall,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  listScroll: {
    maxHeight: 280,
  },
  listContent: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  notifItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  notifIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: {
    fontSize: 16,
  },
  notifInfo: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    ...Typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  notifBody: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  footer: {
    paddingTop: Spacing.xs,
    alignItems: 'center',
  },
  allReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryBg,
  },
  allReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
