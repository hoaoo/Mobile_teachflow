import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { useDrawer } from '@/context/drawer-context';
import { useNotification } from '@/context/notification-context';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { toggleDrawer, openAccount } = useDrawer();
  const { unreadCount } = useNotification();

  const teacherName = user?.teacher?.fullName || user?.email?.split('@')[0] || 'G';
  const initial = teacherName.trim().charAt(0).toUpperCase();

  const handleLeftPress = () => {
    if (showBack) {
      if (onBack) {
        onBack();
      } else {
        router.back();
      }
    } else {
      toggleDrawer();
    }
  };

  const handleNotifPress = () => {
    router.push('/notifications');
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.headerContent}>
        {/* Left Button (Hamburger or Back) */}
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          onPress={handleLeftPress}
          accessibilityRole="button"
          accessibilityLabel={showBack ? 'Quay lại' : 'Mở menu'}>
          <Text style={styles.leftIcon}>{showBack ? '←' : '☰'}</Text>
        </Pressable>

        {/* Title Area */}
        <View style={styles.titleArea}>
          <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitleText} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {rightAction}

          {/* Notification Button */}
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={handleNotifPress}
            accessibilityRole="button"
            accessibilityLabel="Thông báo">
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Account Avatar Button */}
          <Pressable
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}
            onPress={openAccount}
            accessibilityRole="button"
            accessibilityLabel="Mở tài khoản">
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 100,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
    position: 'relative',
  },
  iconBtnPressed: {
    backgroundColor: Colors.borderLight,
    transform: [{ scale: 0.96 }],
  },
  leftIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    ...Typography.titleMedium,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitleText: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  notifIcon: {
    fontSize: 16,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarBtn: {
    borderRadius: Radius.full,
  },
  avatarBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  avatarText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});
