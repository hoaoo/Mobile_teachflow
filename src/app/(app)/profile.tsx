import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/auth';
import { apiClient } from '@/api/client';
import { usePushNotification } from '@/features/push-notifications';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { permissionStatus, isRegistered, requestPermission } = usePushNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const teacherName = user?.teacher?.fullName || user?.email?.split('@')[0] || 'Giáo viên';
  const email = user?.email || 'N/A';
  const role = user?.role === 'TEACHER' ? 'Giáo viên' : user?.role || 'Người dùng';
  const teachingMode = user?.teacher?.teachingMode === 'HOMEROOM' ? 'Chủ nhiệm' : 'Bộ môn';
  const phone = user?.teacher?.phone || 'Chưa cập nhật';

  const handleOpenEdit = () => {
    setEditFullName(user?.teacher?.fullName || '');
    setEditPhone(user?.teacher?.phone || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên');
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.updateProfile({
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
      });

      await refreshUser();
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
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
    <View style={styles.safeArea}>
      <StatusBar style="dark" />
      <AppHeader title="Hồ sơ cá nhân" showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Profile Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {teacherName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.teacherName}>{teacherName}</Text>
            <Text style={styles.emailText}>{email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{role}</Text>
              </View>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>{teachingMode}</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.editIconBtn} onPress={handleOpenEdit}>
            <Text style={styles.editIconText}>✏️</Text>
          </Pressable>
        </View>

        {/* Account Info Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>THÔNG TIN TÀI KHOẢN</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên</Text>
            <Text style={styles.infoValue}>{teacherName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email đăng nhập</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chế độ giảng dạy</Text>
            <Text style={styles.infoValue}>{teachingMode}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái hoạt động</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>

        {/* Push Notification Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>THÔNG BÁO & PUSH</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái Push</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isRegistered ? '#059669' : '#D97706' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isRegistered ? '#059669' : '#D97706' },
                ]}>
                {isRegistered
                  ? 'Đã kết nối nhận tin'
                  : permissionStatus === 'denied'
                    ? 'Đã tắt trong Cài đặt'
                    : 'Chưa kích hoạt'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.notifActionRow}>
            <Text style={styles.notifDescText}>
              Nhận thông báo nhắc lịch dạy, hạn công việc và chuyên cần tức thì ngay cả khi đóng ứng dụng.
            </Text>

            {!isRegistered ? (
              <Pressable
                style={styles.notifActionBtn}
                onPress={async () => {
                  if (permissionStatus === 'denied') {
                    Linking.openSettings();
                  } else {
                    const granted = await requestPermission();
                    if (!granted) {
                      Alert.alert(
                        'Cần cấp quyền thông báo',
                        'Vui lòng cho phép quyền thông báo để nhận nhắc nhở lịch dạy và nhiệm vụ kịp thời.',
                        [
                          { text: 'Đóng', style: 'cancel' },
                          { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
                        ],
                      );
                    }
                  }
                }}>
                <Text style={styles.notifActionBtnText}>
                  {permissionStatus === 'denied' ? '⚙️ Mở Cài đặt' : '🔔 Bật thông báo'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* App Settings & Info Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>HỆ THỐNG & CÀI ĐẶT</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phiên bản ứng dụng</Text>
            <Text style={styles.infoValue}>TeachFlow 1.0.0 (Mobile)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nền tảng</Text>
            <Text style={styles.infoValue}>Expo 57 / React Native</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Xác thực & Mã hóa</Text>
            <Text style={styles.infoValue}>SecureStore + Bearer JWT</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <Pressable style={styles.editProfileBtn} onPress={handleOpenEdit}>
          <Text style={styles.editProfileBtnText}>✏️ Chỉnh sửa thông tin cá nhân</Text>
        </Pressable>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
            pressed && !isLoggingOut && styles.logoutButtonPressed,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator color={Colors.danger} size="small" />
          ) : (
            <Text style={styles.logoutButtonText}>Đăng xuất tài khoản</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditing(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Chỉnh sửa thông tin cá nhân</Text>

            <Text style={styles.inputLabel}>Họ và tên *</Text>
            <TextInput
              style={styles.textInput}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Nhập họ và tên..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.textInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Nhập số điện thoại liên hệ..."
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setIsEditing(false)}
                disabled={isUpdating}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSaveBtn, isUpdating && styles.modalSaveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator color={Colors.textWhite} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Lưu thay đổi</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    color: Colors.textWhite,
    fontSize: 24,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    ...Typography.titleSmall,
    fontSize: 17,
  },
  emailText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  modeBadge: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  editIconBtn: {
    padding: Spacing.sm,
  },
  editIconText: {
    fontSize: 18,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceMuted,
    marginVertical: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  notifActionRow: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  notifDescText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  notifActionBtn: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  notifActionBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  editProfileBtn: {
    height: 46,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    height: 48,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  logoutButtonText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  modalHeading: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.labelBold,
    color: '#334155',
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
