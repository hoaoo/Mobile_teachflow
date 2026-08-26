import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { useDrawer } from '@/context/drawer-context';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export function AccountMenuModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isAccountOpen, closeAccount } = useDrawer();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isAccountOpen) {
    return null;
  }

  const teacherName = user?.teacher?.fullName || user?.email?.split('@')[0] || 'Giáo viên';
  const email = user?.email || '';
  const role = user?.role === 'TEACHER' ? 'Giáo viên' : user?.role || 'Người dùng';
  const teachingMode = user?.teacher?.teachingMode === 'HOMEROOM' ? 'Chủ nhiệm' : 'Bộ môn';
  const initial = teacherName.trim().charAt(0).toUpperCase();

  const handleOpenProfile = () => {
    closeAccount();
    router.push('/profile' as any);
  };

  const handleLogout = () => {
    closeAccount();
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng TeachFlow?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      transparent
      visible={isAccountOpen}
      animationType="fade"
      onRequestClose={closeAccount}>
      <Pressable style={styles.backdrop} onPress={closeAccount}>
        <View
          style={[
            styles.menuCard,
            {
              top: Math.max(insets.top + 56, 64),
              right: Spacing.md,
            },
          ]}>
          {/* User Header */}
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {teacherName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {email}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role}</Text>
                </View>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeText}>{teachingMode}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Menu Items */}
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={handleOpenProfile}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuLabel}>Hồ sơ cá nhân</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={() => {
              closeAccount();
              Alert.alert('Cài đặt', 'Phiên bản TeachFlow v1.0.0. Đã cập nhật tính năng mới nhất.');
            }}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuLabel}>Cài đặt hệ thống</Text>
          </Pressable>

          <View style={styles.divider} />

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={handleLogout}
            disabled={isLoggingOut}>
            <Text style={[styles.menuIcon, styles.logoutText]}>🚪</Text>
            <Text style={[styles.menuLabel, styles.logoutText]}>
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </Text>
          </Pressable>
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
  menuCard: {
    position: 'absolute',
    width: 280,
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
    gap: Spacing.xs,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  userEmail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  modeBadge: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  modeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  menuRowPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuLabel: {
    ...Typography.bodyMedium,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: '600',
  },
});
