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
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { apiClient, ApiError, type GeneratedStudentCommentAIData } from '@/api/client';
import { Colors, Radius, Spacing, Typography } from '@/theme';

const ASSESSMENT_LEVELS = [
  { key: 'Hoàn thành tốt', label: 'Hoàn thành tốt (T)' },
  { key: 'Hoàn thành', label: 'Hoàn thành (H)' },
  { key: 'Cần cố gắng', label: 'Cần cố gắng (C)' },
];

export default function AiStudentCommentScreen() {
  const [subject, setSubject] = useState('Tiếng Việt');
  const [assessmentLevel, setAssessmentLevel] = useState('Hoàn thành tốt');
  const [notes, setNotes] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedStudentCommentAIData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    Keyboard.dismiss();
    setIsGenerating(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await apiClient.generateStudentCommentAI({
        subject: subject.trim() || 'Tổng hợp',
        assessmentLevel,
        notes: notes.trim() || undefined,
      });

      setResult(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage('Vượt quá giới hạn tạo nhận xét AI. Vui lòng đợi 1 phút.');
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
          <Text style={styles.cardHeading}>THÔNG TIN ĐÁNH GIÁ SỰ TIẾN BỘ</Text>

          {/* Subject */}
          <Text style={styles.inputLabel}>Môn học / Lĩnh vực đánh giá</Text>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Ví dụ: Tiếng Việt, Toán, Đạo đức, Năng khiếu..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* Level */}
          <Text style={styles.inputLabel}>Mức độ hoàn thành</Text>
          <View style={styles.levelRow}>
            {ASSESSMENT_LEVELS.map((lvl) => (
              <Pressable
                key={lvl.key}
                style={[
                  styles.levelChip,
                  assessmentLevel === lvl.key && styles.levelChipActive,
                ]}
                onPress={() => setAssessmentLevel(lvl.key)}>
                <Text
                  style={[
                    styles.levelChipText,
                    assessmentLevel === lvl.key && styles.levelChipTextActive,
                  ]}>
                  {lvl.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.inputLabel}>Ghi chú quan sát thực tế (tùy chọn)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ví dụ: Đọc to rõ ràng, chữ viết tiến bộ; cần rèn thêm tính cẩn thận khi làm toán..."
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
              <Text style={styles.generateBtnText}>✨ Gợi ý nhận xét sư phạm</Text>
            )}
          </Pressable>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Đề xuất nhận xét GDPT</Text>
              </View>
              <Text style={styles.resultSubject}>{subject}</Text>
            </View>

            {/* Comment */}
            {(result.comment || result.comments?.[0]) && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>📝 Lời nhận xét gợi ý:</Text>
                <View style={styles.commentBox}>
                  <Text style={styles.commentText}>
                    “{result.comment || result.comments?.[0]}”
                  </Text>
                </View>
              </View>
            )}

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>🌟 Điểm mạnh & Tiến bộ:</Text>
                {result.strengths.map((str, i) => (
                  <Text key={i} style={styles.bulletItem}>
                    • {str}
                  </Text>
                ))}
              </View>
            )}

            {/* Areas for improvement */}
            {result.areasForImprovement && result.areasForImprovement.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>🌱 Điểm cần rèn luyện thêm:</Text>
                {result.areasForImprovement.map((area, i) => (
                  <Text key={i} style={styles.bulletItem}>
                    • {area}
                  </Text>
                ))}
              </View>
            )}
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
  levelRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  levelChip: {
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  levelChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  levelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  levelChipTextActive: {
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
    height: 80,
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  resultSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionBlock: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  commentBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  commentText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bulletItem: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 19,
    paddingLeft: 4,
  },
});
