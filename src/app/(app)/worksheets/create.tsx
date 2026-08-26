import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  apiClient,
  type WorksheetQuestionItem,
  type WorksheetQuestionType,
} from '@/api/client';

const SUBJECT_OPTIONS = ['Toán', 'Tiếng Việt', 'Đạo đức', 'Tự nhiên và Xã hội', 'Lịch sử và Địa lí', 'Khoa học', 'Tin học', 'Hoạt động trải nghiệm'];
const GRADE_OPTIONS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

const QUESTION_TYPES: { type: WorksheetQuestionType; label: string }[] = [
  { type: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { type: 'TRUE_FALSE', label: 'Đúng / Sai' },
  { type: 'FILL_BLANK', label: 'Điền khuyết' },
  { type: 'MATCHING', label: 'Nối cột' },
  { type: 'ESSAY', label: 'Tự luận' },
];

export default function CreateWorksheetScreen() {
  const router = useRouter();

  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Toán');
  const [grade, setGrade] = useState<string>('Lớp 4');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('Đã xuất bản');

  // Questions State
  const [questions, setQuestions] = useState<WorksheetQuestionItem[]>([
    {
      questionType: 'MULTIPLE_CHOICE',
      content: 'Phân số nào sau đây bằng phân số 1/2?',
      options: ['A. 2/4', 'B. 2/3', 'C. 3/5', 'D. 1/3'],
      correctAnswer: 'A. 2/4',
      explanation: 'Ta có 1/2 = (1 × 2)/(2 × 2) = 2/4.',
      sortOrder: 0,
    },
    {
      questionType: 'TRUE_FALSE',
      content: 'Phân số có tử số lớn hơn mẫu số là phân số lớn hơn 1.',
      options: ['Đúng', 'Sai'],
      correctAnswer: 'Đúng',
      explanation: 'Quy tắc so sánh phân số với 1: Tử số > Mẫu số thì phân số > 1.',
      sortOrder: 1,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Question Management
  const handleAddQuestion = (type: WorksheetQuestionType = 'MULTIPLE_CHOICE') => {
    let initialOptions: string[] | undefined;
    let initialAnswer: string = '';

    if (type === 'MULTIPLE_CHOICE') {
      initialOptions = ['A. ', 'B. ', 'C. ', 'D. '];
      initialAnswer = 'A. ';
    } else if (type === 'TRUE_FALSE') {
      initialOptions = ['Đúng', 'Sai'];
      initialAnswer = 'Đúng';
    }

    setQuestions((prev) => [
      ...prev,
      {
        questionType: type,
        content: '',
        options: initialOptions,
        correctAnswer: initialAnswer,
        explanation: '',
        sortOrder: prev.length,
      },
    ]);
  };

  const handleUpdateQuestion = (
    index: number,
    field: keyof WorksheetQuestionItem,
    value: any,
  ) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const currentOpts = [...(next[qIndex].options || [])];
      currentOpts[optIndex] = text;
      next[qIndex] = { ...next[qIndex], options: currentOpts };
      return next;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    setQuestions((prev) => {
      if (
        (direction === 'UP' && index === 0) ||
        (direction === 'DOWN' && index === prev.length - 1)
      ) {
        return prev;
      }
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Submit Handler
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề phiếu học tập');
      return;
    }

    if (questions.length === 0) {
      Alert.alert('Thiếu câu hỏi', 'Vui lòng thêm ít nhất một câu hỏi vào phiếu học tập');
      return;
    }

    // Validate question content
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].content.trim()) {
        Alert.alert('Lỗi nội dung', `Câu hỏi ${i + 1} chưa có nội dung`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const created = await apiClient.createWorksheet({
        title: title.trim(),
        subtitle: `${subject} · ${grade}`,
        description: description.trim() || undefined,
        status,
        meta: `${questions.length} câu hỏi · ${grade}`,
        questions: questions.map((q, idx) => ({
          ...q,
          sortOrder: idx,
        })),
      });

      Alert.alert('Thành công', 'Đã tạo phiếu học tập mới thành công', [
        {
          text: 'Xem chi tiết',
          onPress: () => {
            router.replace({
              pathname: '/worksheets/[id]',
              params: { id: created.id },
            });
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo phiếu học tập';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Basic Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>1. THÔNG TIN PHIẾU HỌC TẬP</Text>

        <Text style={styles.inputLabel}>Tiêu đề phiếu *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Phiếu luyện tập: Phân số bằng nhau..."
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.inputLabel}>Môn học *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {SUBJECT_OPTIONS.map((sub) => (
            <Pressable
              key={sub}
              style={[styles.chip, subject === sub && styles.chipActive]}
              onPress={() => setSubject(sub)}>
              <Text style={[styles.chipText, subject === sub && styles.chipTextActive]}>
                {sub}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Khối lớp *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {GRADE_OPTIONS.map((gr) => (
            <Pressable
              key={gr}
              style={[styles.chip, grade === gr && styles.chipActive]}
              onPress={() => setGrade(gr)}>
              <Text style={[styles.chipText, grade === gr && styles.chipTextActive]}>
                {gr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Mô tả / Hướng dẫn làm bài</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Ví dụ: Học sinh đọc kỹ câu hỏi và chọn một đáp án đúng nhất..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.inputLabel}>Trạng thái</Text>
        <View style={styles.rowTwo}>
          <Pressable
            style={[styles.statusOption, status === 'Đã xuất bản' && styles.statusOptionActive]}
            onPress={() => setStatus('Đã xuất bản')}>
            <Text style={[styles.statusOptionText, status === 'Đã xuất bản' && styles.statusOptionTextActive]}>
              ✓ Đã xuất bản
            </Text>
          </Pressable>

          <Pressable
            style={[styles.statusOption, status === 'Bản nháp' && styles.statusOptionActive]}
            onPress={() => setStatus('Bản nháp')}>
            <Text style={[styles.statusOptionText, status === 'Bản nháp' && styles.statusOptionTextActive]}>
              📝 Bản nháp
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Questions Section */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>2. CÂU HỎI ({questions.length})</Text>
          <Pressable
            style={styles.addQuestionBtn}
            onPress={() => handleAddQuestion('MULTIPLE_CHOICE')}>
            <Text style={styles.addQuestionBtnText}>＋ Thêm câu hỏi</Text>
          </Pressable>
        </View>

        {questions.map((q, qIdx) => (
          <View key={qIdx} style={styles.questionEditorBox}>
            {/* Header / Actions */}
            <View style={styles.qHeaderRow}>
              <Text style={styles.qIndexTitle}>Câu {qIdx + 1}</Text>
              <View style={styles.qActionRow}>
                {qIdx > 0 ? (
                  <Pressable
                    style={styles.reorderBtn}
                    onPress={() => handleMoveQuestion(qIdx, 'UP')}>
                    <Text style={styles.reorderBtnText}>▲</Text>
                  </Pressable>
                ) : null}

                {qIdx < questions.length - 1 ? (
                  <Pressable
                    style={styles.reorderBtn}
                    onPress={() => handleMoveQuestion(qIdx, 'DOWN')}>
                    <Text style={styles.reorderBtnText}>▼</Text>
                  </Pressable>
                ) : null}

                {questions.length > 1 ? (
                  <Pressable
                    style={styles.deleteQBtn}
                    onPress={() => handleRemoveQuestion(qIdx)}>
                    <Text style={styles.deleteQText}>✕ Xóa</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Question Type Selector */}
            <Text style={styles.smallLabel}>Dạng câu hỏi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {QUESTION_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  style={[
                    styles.typeChip,
                    q.questionType === t.type && styles.typeChipActive,
                  ]}
                  onPress={() => {
                    handleUpdateQuestion(qIdx, 'questionType', t.type);
                    if (t.type === 'MULTIPLE_CHOICE' && (!q.options || q.options.length === 0)) {
                      handleUpdateQuestion(qIdx, 'options', ['A. ', 'B. ', 'C. ', 'D. ']);
                      handleUpdateQuestion(qIdx, 'correctAnswer', 'A. ');
                    } else if (t.type === 'TRUE_FALSE') {
                      handleUpdateQuestion(qIdx, 'options', ['Đúng', 'Sai']);
                      handleUpdateQuestion(qIdx, 'correctAnswer', 'Đúng');
                    } else if (t.type === 'FILL_BLANK' || t.type === 'ESSAY') {
                      handleUpdateQuestion(qIdx, 'options', undefined);
                    }
                  }}>
                  <Text
                    style={[
                      styles.typeChipText,
                      q.questionType === t.type && styles.typeChipTextActive,
                    ]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Content Input */}
            <Text style={styles.smallLabel}>Nội dung câu hỏi *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Nhập nội dung câu hỏi..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              value={q.content}
              onChangeText={(v) => handleUpdateQuestion(qIdx, 'content', v)}
            />

            {/* Options Editor for Multiple Choice & True/False */}
            {q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE' ? (
              <View style={styles.optionsEditor}>
                <Text style={styles.smallLabel}>Các lựa chọn & Đáp án đúng (Chạm để chọn đáp án đúng):</Text>
                {(q.options || []).map((opt, optIdx) => {
                  const isCorrect = q.correctAnswer === opt;

                  return (
                    <View key={optIdx} style={styles.optRow}>
                      <Pressable
                        style={[styles.optCheckBtn, isCorrect && styles.optCheckBtnCorrect]}
                        onPress={() => handleUpdateQuestion(qIdx, 'correctAnswer', opt)}>
                        <Text style={[styles.optCheckText, isCorrect && styles.optCheckTextCorrect]}>
                          {isCorrect ? '✓ Đúng' : 'Chọn'}
                        </Text>
                      </Pressable>

                      <TextInput
                        style={[styles.optInput, isCorrect && styles.optInputCorrect]}
                        value={opt}
                        onChangeText={(v) => handleUpdateOption(qIdx, optIdx, v)}
                        placeholder={`Lựa chọn ${optIdx + 1}`}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Answer Input for Fill Blank, Essay, etc. */}
            {q.questionType !== 'MULTIPLE_CHOICE' && q.questionType !== 'TRUE_FALSE' ? (
              <View>
                <Text style={styles.smallLabel}>Đáp án đúng / Gợi ý chấm *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập đáp án hoặc hướng dẫn chấm..."
                  placeholderTextColor="#94A3B8"
                  value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                  onChangeText={(v) => handleUpdateQuestion(qIdx, 'correctAnswer', v)}
                />
              </View>
            ) : null}

            {/* Explanation */}
            <Text style={styles.smallLabel}>Giải thích chi tiết (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Giải thích vì sao đáp án đúng..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              value={q.explanation || ''}
              onChangeText={(v) => handleUpdateQuestion(qIdx, 'explanation', v)}
            />
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <Pressable
        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>💾 Lưu phiếu học tập</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textarea: {
    height: 60,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statusOption: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  addQuestionBtn: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  addQuestionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  questionEditorBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    gap: 6,
  },
  qHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qIndexTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  qActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  reorderBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reorderBtnText: {
    fontSize: 10,
    color: '#475569',
  },
  deleteQBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  deleteQText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  optionsEditor: {
    gap: 6,
    marginTop: 4,
  },
  optRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  optCheckBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  optCheckBtnCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  optCheckText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  optCheckTextCorrect: {
    color: '#059669',
    fontWeight: '700',
  },
  optInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  optInputCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  saveBtn: {
    height: 48,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
