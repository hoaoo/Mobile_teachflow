import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth';
import { ApiError } from '@/api/client';
import { TeachFlowBrand } from '@/components/branding/TeachFlowBrand';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Địa chỉ email không đúng định dạng');
      return false;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleLogin = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    Keyboard.dismiss();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({
        email: email.trim(),
        password,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setErrorMessage('Email hoặc mật khẩu không chính xác');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.responsiveWrapper}>
              {/* Brand Header */}
              <View style={styles.header}>
                <TeachFlowBrand size="lg" subtitle="Không gian dành cho giáo viên" />
              </View>

              {/* Login Form Card */}
              <View style={styles.card}>
                <Text style={styles.formTitle}>Đăng nhập tài khoản</Text>
                <Text style={styles.formDesc}>Chào mừng bạn quay trở lại giảng dạy</Text>

                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="giaovien@truonghoc.edu.vn"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={10}>
                      <Text style={styles.eyeButtonText}>
                        {showPassword ? 'Ẩn' : 'Hiện'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.submitButtonPressed,
                  ]}
                  onPress={handleLogin}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.textWhite} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Đăng nhập</Text>
                  )}
                </Pressable>

                {/* Register Link */}
                <View style={styles.registerRow}>
                  <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
                  <Pressable onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.registerLink}>Đăng ký ngay</Text>
                  </Pressable>
                </View>
              </View>

              {/* Footer Notice */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  TeachFlow • Trợ lý số toàn diện cho giáo viên tiểu học
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  brandIconBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brandMint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brandTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: Spacing.sm,
  },
  brandIconText: {
    fontSize: 28,
  },
  brandTitle: {
    ...Typography.titleLarge,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  brandSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  formDesc: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  errorContainer: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.labelBold,
    color: '#334155',
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  eyeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  submitButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitButtonText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  registerPrompt: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
