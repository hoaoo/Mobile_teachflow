import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NotificationItem } from '@/api/client';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { formatFullDateVN } from '@/utils/date';
import { getNotificationVisual } from './NotificationCard';

interface NotificationDetailModalProps {
  visible: boolean;
  notification: NotificationItem | null;
  onClose: () => void;
  onNavigate?: () => void;
}

export function NotificationDetailModal({
  visible,
  notification,
  onClose,
  onNavigate,
}: NotificationDetailModalProps) {
  if (!notification || !visible) return null;

  const visual = getNotificationVisual(notification.type);
  const timeFormatted = formatFullDateVN(notification.createdAt);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: visual.bgColor }]}>
              <Text style={styles.iconText}>{visual.icon}</Text>
            </View>

            <View style={styles.headerTextCol}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: visual.bgColor, borderColor: visual.borderColor },
                ]}>
                <Text style={[styles.typeBadgeText, { color: visual.textColor }]}>
                  {visual.label}
                </Text>
              </View>
              <Text style={styles.timeText}>{timeFormatted}</Text>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Title & Body */}
          <ScrollView style={styles.contentScroll}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.body}>{notification.message || notification.body}</Text>
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            {onNavigate && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  onClose();
                  onNavigate();
                }}>
                <Text style={styles.actionBtnText}>Đi tới mục liên quan →</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [styles.closeFullBtn, pressed && styles.btnPressed]}
              onPress={onClose}>
              <Text style={styles.closeFullBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  contentScroll: {
    maxHeight: 280,
  },
  title: {
    ...Typography.titleMedium,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  body: {
    ...Typography.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  closeFullBtn: {
    backgroundColor: Colors.surfaceMuted,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFullBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
