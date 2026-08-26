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
import { apiClient, ApiError, type GeneratedQuestionsAIData } from '@/api/client';
import { Colors, Radius, Spacing, Typography } from '@/theme';

const GRADES = [1, 2, 3, 4, 5];
const LEVELS = [
  { key: 'RECOGNITION', label: 'Nhận biết' },
  { key: 'UNDERSTANDING', label: 'Thông hiểu' },
  { key: 'APPLICATION', label: 'Vận dụng' },
  { key: 'ADVANCED_APPLICATION', label: 'Vận dụng cao' },
];

export default function AiQuestionsScreen() {
  const [grade, setGrade] = useState<number>(3);
  const [subject, setSubject] = useState('Toán');
  const [topic, setTopic] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState('4');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['RECOGNITION', 'UNDERSTANDING', 'APPLICATION']);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedQuestionsAIData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chủ đề hoặc bài học cần tạo câu hỏi');
      return;
    }

    Keyboard.dismiss();
    setIsGenerating(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await apiClient.generateQuestionsAI({
        grade,
        subject: subject.trim(),
        topic: topic.trim(),
        numberOfQuestions: parseInt(numberOfQuestions, 10) || 4,
        levels: selectedLevels.length > 0 ? selectedLevels : undefined,
      });

      setResult(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage('Vượt quá giới hạn tạo câu hỏi AI. Vui lòng đợi 1 phút.');
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
          <Text style={styles.cardHeading}>THIẾT LẬP BỘ CÂU HỎI THEO THANG BLOOM</Text>

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

          {/* Subject */}
          <Text style={styles.inputLabel}>Môn học *</Text>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Ví dụ: Toán, Tiếng Việt, Khoa học..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* Topic */}
          <Text style={styles.inputLabel}>Chủ đề / Bài học *</Text>
          <TextInput
            style={styles.textInput}
            value={topic}
            onChangeText={setTopic}
            placeholder="Ví dụ: Bảng nhân 7, Từ chỉ đặc điểm..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* Levels */}
          <Text style={styles.inputLabel}>Mức độ nhận thức (Thang Bloom)</Text>
          <View style={styles.levelGrid}>
            {LEVELS.map((lvl) => {
              const isSelected = selectedLevels.includes(lvl.key);
              return (
                <Pressable
                  key={lvl.key}
                  style={[styles.levelChip, isSelected && styles.levelChipActive]}
                  onPress={() => toggleLevel(lvl.key)}>
                  <Text
                    style={[
                      styles.levelChipText,
                      isSelected && styles.levelChipTextActive,
                    ]}>
                    {isSelected ? '✓ ' : ''}{lvl.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Number of Questions */}
          <Text style={styles.inputLabel}>Số lượng câu hỏi</Text>
          <TextInput
            style={styles.textInput}
            value={numberOfQuestions}
            onChangeText={setNumberOfQuestions}
            keyboardType="number-pad"
            placeholder="4"
            placeholderTextColor={Colors.textMuted}
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
              <Text style={styles.generateBtnText}>✨ Tạo bộ câu hỏi bằng AI</Text>
            )}
          </Pressable>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeading}>BỘ CÂU HỎI ĐƯỢC TẠO ({result.questions?.length || 0} CÂU)</Text>
              <Text style={styles.resultTopic}>{result.topic}</Text>
            </View>

            {result.questions?.map((q, index) => (
              <View key={index} style={styles.questionCard}>
                <View style={styles.qTopRow}>
                  <View style={styles.qNumberBadge}>
                    <Text style={styles.qNumberText}>Câu {index + 1}</Text>
                  </View>
                  {q.difficulty && (
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>{q.difficulty}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.qContent}>{q.content}</Text>

                {q.options && q.options.length > 0 && (
                  <View style={styles.optionsList}>
                    {q.options.map((opt, oIdx) => (
                      <View key={oIdx} style={styles.optionItem}>
                        <Text style={styles.optionText}>{opt}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {q.correctAnswer ? (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Đáp án:</Text>
                    <Text style={styles.answerText}>{q.correctAnswer}</Text>
                  </View>
                ) : null}

                {q.explanation ? (
                  <View style={styles.explainBox}>
                    <Text style={styles.explainLabel}>Giải thích:</Text>
                    <Text style={styles.explainText}>{q.explanation}</Text>
                  </View>
                ) : null}
              </View>
            ))}
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
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  levelChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  levelChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  levelChipText: {
    fontSize: 12,
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
  resultContainer: {
    gap: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  resultTopic: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  qTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumberBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  qNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  difficultyBadge: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  difficultyText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  qContent: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  optionsList: {
    gap: 4,
    marginTop: 2,
  },
  optionItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  optionText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  answerBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  answerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  explainBox: {
    gap: 2,
    paddingTop: 4,
  },
  explainLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  explainText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
