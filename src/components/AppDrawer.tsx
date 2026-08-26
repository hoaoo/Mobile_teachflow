import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { useDrawer } from '@/context/drawer-context';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface DrawerItem {
  key: string;
  label: string;
  icon: string;
  route?: string;
  action?: 'notifications';
}

interface DrawerSection {
  title: string;
  items: DrawerItem[];
}

const SECTIONS: DrawerSection[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { key: 'dashboard', label: 'Trang chủ', icon: '🏠', route: '/' },
    ],
  },
  {
    title: 'QUẢN LÝ LỚP',
    items: [
      { key: 'classrooms', label: 'Lớp học', icon: '🏫', route: '/classrooms' },
      { key: 'students', label: 'Học sinh', icon: '👥', route: '/students' },
      { key: 'homeroom', label: 'Chủ nhiệm', icon: '🌟', route: '/homeroom' },
      { key: 'attendance', label: 'Chuyên cần', icon: '📅', route: '/attendance' },
    ],
  },
  {
    title: 'GIẢNG DẠY',
    items: [
      { key: 'lesson-plans', label: 'Giáo án', icon: '📖', route: '/lesson-plans' },
      { key: 'worksheets', label: 'Phiếu bài tập', icon: '📝', route: '/worksheets' },
      { key: 'assessments', label: 'Đánh giá', icon: '📊', route: '/assessments' },
      { key: 'resources', label: 'Tài nguyên', icon: '📂', route: '/resources' },
    ],
  },
  {
    title: 'CÔNG VIỆC',
    items: [
      { key: 'tasks', label: 'Nhiệm vụ', icon: '📋', route: '/tasks' },
    ],
  },
  {
    title: 'HỖ TRỢ',
    items: [
      { key: 'ai', label: 'Trợ lý AI', icon: '✨', route: '/ai' },
      { key: 'notifications', label: 'Thông báo', icon: '🔔', action: 'notifications' },
    ],
  },
];

export function AppDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDrawerOpen, closeDrawer, openNotif } = useDrawer();
  const { width: screenWidth } = useWindowDimensions();

  const drawerWidth = Math.min(screenWidth * 0.82, 330);

  const [slideAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDrawerOpen, slideAnim]);

  if (!isDrawerOpen) {
    return null;
  }

  const teacherName = user?.teacher?.fullName || user?.email?.split('@')[0] || 'Giáo viên';
  const email = user?.email || '';
  const initial = teacherName.trim().charAt(0).toUpperCase();

  const handleNavigate = (item: DrawerItem) => {
    closeDrawer();
    if (item.action === 'notifications') {
      openNotif();
      return;
    }

    if (item.route) {
      if (item.route === '/' && pathname === '/') {
        return;
      }
      if (item.route === pathname) {
        return;
      }
      router.push(item.route as any);
    }
  };

  const isItemActive = (item: DrawerItem) => {
    if (!item.route) return false;
    if (item.route === '/') {
      return pathname === '/' || pathname === '/(app)' || pathname === '';
    }
    return pathname.startsWith(item.route);
  };

  return (
    <Modal
      transparent
      visible={isDrawerOpen}
      animationType="none"
      onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          ]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        {/* Drawer Content */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              width: drawerWidth,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-drawerWidth, 0],
                  }),
                },
              ],
            },
          ]}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandLogoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>🎓</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>TeachFlow</Text>
                <Text style={styles.brandSubtitle}>Trợ lý Giáo viên Tiểu học</Text>
              </View>
            </View>

            {/* Teacher Quick Card */}
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{initial}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {teacherName}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </View>
          </View>

          {/* Navigation Menu List */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}>
            {SECTIONS.map((section, sIdx) => (
              <View key={sIdx} style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionItems}>
                  {section.items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Pressable
                        key={item.key}
                        style={({ pressed }) => [
                          styles.menuItem,
                          active && styles.menuItemActive,
                          pressed && styles.menuItemPressed,
                        ]}
                        onPress={() => handleNavigate(item)}>
                        <Text style={[styles.menuItemIcon, active && styles.menuItemIconActive]}>
                          {item.icon}
                        </Text>
                        <Text style={[styles.menuItemLabel, active && styles.menuItemLabelActive]}>
                          {item.label}
                        </Text>
                        {active && <View style={styles.activeIndicator} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Drawer Footer */}
          <View style={styles.drawerFooter}>
            <Text style={styles.footerVersion}>TeachFlow Mobile v1.0.0</Text>
            <Text style={styles.footerCopyright}>© 2026 TeachFlow • Production</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  brandHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitle: {
    ...Typography.titleMedium,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  brandSubtitle: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 13,
  },
  userEmail: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  sectionBlock: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.sm,
    marginBottom: 4,
  },
  sectionItems: {
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  menuItemActive: {
    backgroundColor: Colors.primaryBg,
  },
  menuItemPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  menuItemIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
  menuItemIconActive: {
    opacity: 1,
  },
  menuItemLabel: {
    ...Typography.bodyMedium,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  menuItemLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  drawerFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerCopyright: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
