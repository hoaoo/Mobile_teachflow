import React, { useEffect, useState } from 'react';
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
import { apiClient, ApiError, type ClassroomItem, type GeneratedHomeroomSummaryAIData } from '@/api/client';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export default function AiHomeroomSummaryScreen() {
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [period, setPeriod] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [weekNumber, setWeekNumber] = useState('1');

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedHomeroomSummaryAIData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadClasses = async () => {
      try {
        const res = await apiClient.getClassrooms();
        if (isMounted) {
          const list = res.items || [];
          setClassrooms(list);
          if (list.length > 0) {
            setSelectedClassId(list[0].id);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingClasses(false);
      }
    };

    loadClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerate = async () => {
    if (!selectedClassId) {
      Alert.alert('Chưa chọn lớp', 'Vui lòng chọn một lớp học để lập báo cáo');
      return;
    }

    Keyboard.dismiss();
    setIsGenerating(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await apiClient.generateHomeroomSummaryAI({
        classroomId: selectedClassId,
        period,
        weekNumber: period === 'WEEK' ? parseInt(weekNumber, 10) || 1 : undefined,
      });

      setResult(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 403) {
          setErrorMessage('Bạn không có quyền chủ nhiệm hoặc truy cập lớp học này.');
        } else if (err.statusCode === 429) {
          setErrorMessage('Vượt quá giới hạn tạo báo cáo AI. Vui lòng đợi 1 phút.');
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
          <Text style={styles.cardHeading}>THIẾT LẬP BÁO CÁO CHỦ NHIỆM</Text>

          {/* Classroom Picker */}
          <Text style={styles.inputLabel}>Chọn lớp học chủ nhiệm</Text>
          {isLoadingClasses ? (
            <ActivityIndicator color={Colors.primary} size="small" style={{ marginVertical: 8 }} />
          ) : (
            <View style={styles.classRow}>
              {classrooms.map((cls) => (
                <Pressable
                  key={cls.id}
                  style={[
                    styles.classChip,
                    selectedClassId === cls.id && styles.classChipActive,
                  ]}
                  onPress={() => setSelectedClassId(cls.id)}>
                  <Text
                    style={[
                      styles.classChipText,
                      selectedClassId === cls.id && styles.classChipTextActive,
                    ]}>
                    {cls.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Period Mode */}
          <Text style={styles.inputLabel}>Kỳ báo cáo</Text>
          <View style={styles.periodRow}>
            <Pressable
              style={[styles.periodChip, period === 'WEEK' && styles.periodChipActive]}
              onPress={() => setPeriod('WEEK')}>
              <Text
                style={[
                  styles.periodChipText,
                  period === 'WEEK' && styles.periodChipTextActive,
                ]}>
                Theo Tuần
              </Text>
            </Pressable>

            <Pressable
              style={[styles.periodChip, period === 'MONTH' && styles.periodChipActive]}
              onPress={() => setPeriod('MONTH')}>
              <Text
                style={[
                  styles.periodChipText,
                  period === 'MONTH' && styles.periodChipTextActive,
                ]}>
                Theo Tháng
              </Text>
            </Pressable>
          </View>

          {/* Week Number if WEEK */}
          {period === 'WEEK' && (
            <>
              <Text style={styles.inputLabel}>Tuần học số (1 - 35)</Text>
              <TextInput
                style={styles.textInput}
                value={weekNumber}
                onChangeText={setWeekNumber}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
              />
            </>
          )}

          {/* Description banner */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              📊 Backend sẽ tự động tổng hợp tỷ lệ chuyên cần, các lượt khen/nhắc nhở nề nếp và các đánh giá gần đây của lớp để AI soạn dự thảo báo cáo.
            </Text>
          </View>

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
              <Text style={styles.generateBtnText}>✨ Lập báo cáo tổng hợp bằng AI</Text>
            )}
          </Pressable>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Dự thảo Báo cáo Chủ nhiệm</Text>
              </View>
              <Text style={styles.resultPeriod}>
                {period === 'MONTH' ? 'Báo cáo Tháng' : `Tuần ${weekNumber}`}
              </Text>
            </View>

            {/* Summary */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>📌 Nhận xét chung:</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>🌟 Ưu điểm & Nề nếp tích cực:</Text>
                {result.strengths.map((str, i) => (
                  <Text key={i} style={styles.bulletItem}>
                    • {str}
                  </Text>
                ))}
              </View>
            )}

            {/* Concerns */}
            {result.concerns && result.concerns.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>⚠️ Tồn tại & Lưu ý theo dõi:</Text>
                {result.concerns.map((c, i) => (
                  <Text key={i} style={styles.bulletItem}>
                    • {c}
                  </Text>
                ))}
              </View>
            )}

            {/* Next Steps */}
            {result.nextSteps && result.nextSteps.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>🚀 Kế hoạch & Biện pháp tuần tới:</Text>
                {result.nextSteps.map((step, i) => (
                  <Text key={i} style={styles.bulletItem}>
                    • {step}
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
  classRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  classChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  classChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  classChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  classChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  periodChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodChipTextActive: {
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
  infoBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginTop: Spacing.xs,
  },
  infoBoxText: {
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 18,
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
  resultPeriod: {
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
  summaryText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bulletItem: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 19,
    paddingLeft: 4,
  },
});
