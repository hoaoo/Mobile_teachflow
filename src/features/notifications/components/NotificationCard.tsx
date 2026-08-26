import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NotificationItem, NotificationType } from '@/api/client';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { formatRelativeTimeVN } from '@/utils/date';

interface NotificationCardProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  onDelete?: (id: string) => void;
}

export function getNotificationVisual(type: NotificationType) {
  switch (type) {
    case 'ASSIGNMENT':
      return { icon: '📅', label: 'Lịch dạy', bgColor: '#E0F2FE', textColor: '#0284C7', borderColor: '#BAE6FD' };
    case 'ENROLLMENT':
      return { icon: '🎓', label: 'Học sinh', bgColor: '#DCFCE7', textColor: '#15803D', borderColor: '#BBF7D0' };
    case 'ASSESSMENT':
      return { icon: '📝', label: 'Đánh giá', bgColor: '#EDE9FE', textColor: '#7C3AED', borderColor: '#DDD6FE' };
    case 'HOMEROOM':
      return { icon: '🏫', label: 'Chủ nhiệm', bgColor: '#FFE4E6', textColor: '#E11D48', borderColor: '#FECDD3' };
    case 'TASK':
      return { icon: '✅', label: 'Công việc', bgColor: '#FEF3C7', textColor: '#D97706', borderColor: '#FDE68A' };
    case 'SYSTEM':
    default:
      return { icon: '🔔', label: 'Hệ thống', bgColor: '#F1F5F9', textColor: '#475569', borderColor: '#CBD5E1' };
  }
}

export function NotificationCard({ item, onPress, onDelete }: NotificationCardProps) {
  const visual = getNotificationVisual(item.type);
  const timeFormatted = formatRelativeTimeVN(item.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        !item.isRead && styles.unreadCard,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(item)}>
      {/* Type Icon Box */}
      <View style={[styles.iconBox, { backgroundColor: visual.bgColor }]}>
        <Text style={styles.iconText}>{visual.icon}</Text>
      </View>

      {/* Main Notification Content */}
      <View style={styles.contentCol}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {!item.isRead && <View style={styles.unreadDot} />}
            <Text
              style={[
                styles.titleText,
                !item.isRead ? styles.unreadTitle : styles.readTitle,
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
          </View>

          <Text style={styles.timeText}>{timeFormatted}</Text>
        </View>

        <Text
          style={[
            styles.messageText,
            !item.isRead ? styles.unreadMessage : styles.readMessage,
          ]}
          numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.footerRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: visual.bgColor, borderColor: visual.borderColor },
            ]}>
            <Text style={[styles.typeBadgeText, { color: visual.textColor }]}>
              {visual.label}
            </Text>
          </View>

          {onDelete && (
            <Pressable
              style={styles.deleteBtn}
              onPress={() => onDelete(item.id)}
              hitSlop={8}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  cardPressed: {
    opacity: 0.88,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  contentCol: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  titleText: {
    ...Typography.titleSmall,
    flex: 1,
    fontSize: 13,
  },
  unreadTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  readTitle: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 17,
  },
  unreadMessage: {
    color: '#334155',
  },
  readMessage: {
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  deleteText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
