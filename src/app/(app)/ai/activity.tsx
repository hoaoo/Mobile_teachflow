import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { apiClient, ApiError, type GeneratedActivityAIData } from '@/api/client';
import { Colors, Radius, Spacing, Typography } from '@/theme';

const GRADES = [1, 2, 3, 4, 5];
const ACTIVITY_TYPES = [
  { key: 'WARM_UP', label: 'Khởi động' },
  { key: 'EXPLORE', label: 'Khám phá kiến thức' },
  { key: 'PRACTICE', label: 'Luyện tập - Thực hành' },
  { key: 'APPLY', label: 'Vận dụng - Mở rộng' },
];

export default function AiActivityScreen() {
  const [grade, setGrade] = useState<number>(3);
  const [subject, setSubject] = useState('Toán');
  const [lessonTitle, setLessonTitle] = useState('');
  const [activityType, setActivityType] = useState('WARM_UP');
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [requirement, setRequirement] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivityAIData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!lessonTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên bài học hoặc chủ đề');
      return;
    }

    Keyboard.dismiss();
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedActivity(null);

    try {
      const res = await apiClient.generateActivityAI({
        grade,
        subject: subject.trim(),
        lessonTitle: lessonTitle.trim(),
        activityType,
        durationMinutes: parseInt(durationMinutes, 10) || 10,
        requirement: requirement.trim() || undefined,
      });

      setGeneratedActivity(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage('Vượt quá giới hạn tạo nội dung AI. Vui lòng đợi 1 phút.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ AI. Vui lòng thử lại sau.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>THÔNG TIN HOẠT ĐỘNG DẠY HỌC</Text>

          {/* Grade Picker */}
          <Text style={styles.inputLabel}>Khối lớp</Text>
          <View style={styles.chipRow}>
            {GRADES.map((g) => (
              <Pressable
                key={g}
                style={[styles.gradeChip, grade === g && styles.gradeChipActive]}
                onPress={() => setGrade(g)}>
                <Text
                  style={[
                    styles.gradeChipText,
                    grade === g && styles.gradeChipTextActive,
                  ]}>
                  Lớp {g}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Subject Input */}
          <Text style={styles.inputLabel}>Môn học *</Text>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Ví dụ: Toán, Tiếng Việt, Tự nhiên và Xã hội..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* Lesson Title Input */}
          <Text style={styles.inputLabel}>Tên bài học / Chủ đề *</Text>
          <TextInput
            style={styles.textInput}
            value={lessonTitle}
            onChangeText={setLessonTitle}
            placeholder="Ví dụ: Phép nhân số có hai chữ số, Luyện từ và câu..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* Activity Type */}
          <Text style={styles.inputLabel}>Loại hoạt động</Text>
          <View style={styles.typeGrid}>
            {ACTIVITY_TYPES.map((t) => (
              <Pressable
                key={t.key}
                style={[
                  styles.typeChip,
                  activityType === t.key && styles.typeChipActive,
                ]}
                onPress={() => setActivityType(t.key)}>
                <Text
                  style={[
                    styles.typeChipText,
                    activityType === t.key && styles.typeChipTextActive,
                  ]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Duration */}
          <Text style={styles.inputLabel}>Thời lượng dự kiến (phút)</Text>
          <TextInput
            style={styles.textInput}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Special requirement */}
          <Text style={styles.inputLabel}>Yêu cầu đặc biệt (tùy chọn)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={requirement}
            onChangeText={setRequirement}
            placeholder="Ví dụ: Sử dụng hình thức trò chơi tiếp sức, tích hợp công nghệ thông tin..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          {/* Error */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.generateBtn,
              isGenerating && styles.generateBtnDisabled,
              pressed && !isGenerating && styles.generateBtnPressed,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}>
            {isGenerating ? (
              <ActivityIndicator color={Colors.textWhite} size="small" />
            ) : (
              <Text style={styles.generateBtnText}>✨ Thiết kế hoạt động bằng AI</Text>
            )}
          </Pressable>
        </View>

        {/* Result Preview */}
        {generatedActivity && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Hoàn thành đề xuất AI</Text>
              </View>
              <Text style={styles.resultDuration}>⏱️ {generatedActivity.durationMinutes} phút</Text>
            </View>

            <Text style={styles.resultTitle}>{generatedActivity.title}</Text>

            {/* Objective */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>🎯 Mục tiêu hoạt động:</Text>
              <Text style={styles.sectionValue}>{generatedActivity.objective}</Text>
            </View>

            {/* Methods & Techniques */}
            {generatedActivity.methods?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>🛠️ Phương pháp dạy học:</Text>
                <Text style={styles.sectionValue}>{generatedActivity.methods.join(', ')}</Text>
              </View>
            )}

            {/* Teacher Activity */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>👨‍🏫 Hoạt động của Giáo viên:</Text>
              <Text style={styles.sectionValue}>{generatedActivity.teacherActivity}</Text>
            </View>

            {/* Student Activity */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>🧒 Hoạt động của Học sinh:</Text>
              <Text style={styles.sectionValue}>{generatedActivity.studentActivity}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    ...Typography.labelBold,
    color: '#334155',
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  gradeChip: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  gradeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  gradeChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  textInput: {
    height: 44,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 70,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
  },
  generateBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  generateBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  generateBtnPressed: {
    opacity: 0.85,
  },
  generateBtnText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  resultDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  resultTitle: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  sectionBlock: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionValue: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
