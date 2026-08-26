import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, type WorksheetItem, type WorksheetQuestionItem } from '@/api/client';

function getStatusBadge(status?: string) {
  if (status === 'Đã xuất bản' || status === 'PUBLISHED') {
    return { label: 'Đã xuất bản', color: '#059669', bg: '#ECFDF5' };
  }
  return { label: status || 'Bản nháp', color: '#D97706', bg: '#FFFBEB' };
}

function getQuestionTypeLabel(type?: string) {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return { label: 'Trắc nghiệm', bg: '#E0F2FE', color: '#0369A1' };
    case 'TRUE_FALSE':
      return { label: 'Đúng / Sai', bg: '#FEF3C7', color: '#D97706' };
    case 'FILL_BLANK':
      return { label: 'Điền khuyết', bg: '#F3E8FF', color: '#7E22CE' };
    case 'MATCHING':
      return { label: 'Nối cột', bg: '#DCFCE7', color: '#15803D' };
    case 'ESSAY':
      return { label: 'Tự luận', bg: '#FFE4E6', color: '#E11D48' };
    default:
      return { label: 'Câu hỏi', bg: '#F1F5F9', color: '#475569' };
  }
}

export default function WorksheetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [worksheet, setWorksheet] = useState<WorksheetItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        setErrorMessage(null);
        if (!isRefresh) setLoading(true);
        const res = await apiClient.getWorksheetById(id);
        setWorksheet(res);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Không thể tải chi tiết phiếu học tập',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      if (!id) return;
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getWorksheetById(id);
        if (isMounted) {
          setWorksheet(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải chi tiết phiếu học tập',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail(true);
  }, [fetchDetail]);

  const handleExportDocx = async (includeAnswers = true) => {
    if (!id) return;
    const url = apiClient.getWorksheetExportDocxUrl(id, includeAnswers);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Xuất Word', `Đường dẫn tải file DOCX:\n${url}`);
    }
  };

  const handleExportPdf = async (includeAnswers = true) => {
    if (!id) return;
    const url = apiClient.getWorksheetExportPdfUrl(id, includeAnswers);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Xuất PDF', `Đường dẫn tải file PDF:\n${url}`);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const duplicated = await apiClient.duplicateWorksheet(id);
      Alert.alert('Thành công', 'Đã nhân bản phiếu học tập thành công', [
        {
          text: 'Mở phiếu mới',
          onPress: () => {
            router.replace({
              pathname: '/worksheets/[id]',
              params: { id: duplicated.id },
            });
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi nhân bản phiếu';
      Alert.alert('Lỗi', msg);
    }
  };

  const handleDelete = () => {
    if (!id || !worksheet) return;
    Alert.alert(
      'Xóa phiếu học tập',
      `Bạn có chắc chắn muốn xóa "${worksheet.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteWorksheet(id);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Lỗi xóa phiếu';
              Alert.alert('Lỗi', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải phiếu học tập...</Text>
      </View>
    );
  }

  if (errorMessage || !worksheet) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errIcon}>⚠️</Text>
        <Text style={styles.errTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errText}>{errorMessage || 'Không tìm thấy phiếu học tập'}</Text>
        <Pressable style={styles.retryBtn} onPress={() => fetchDetail()}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const badge = getStatusBadge(worksheet.status);
  const questions = worksheet.questions || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#0284C7']}
        />
      }>
      {/* Top Banner Card */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerTopRow}>
          <View style={styles.badgeGroup}>
            {worksheet.subtitle ? (
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{worksheet.subtitle}</Text>
              </View>
            ) : worksheet.subject?.name ? (
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{worksheet.subject.name}</Text>
              </View>
            ) : null}

            {worksheet.grade?.name ? (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>{worksheet.grade.name}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.planTitle}>{worksheet.title}</Text>
        {worksheet.description ? (
          <Text style={styles.planDesc}>{worksheet.description}</Text>
        ) : null}

        {/* Action Toolbar */}
        <View style={styles.actionToolbar}>
          <Pressable style={styles.actionBtn} onPress={() => handleExportDocx(true)}>
            <Text style={styles.actionBtnIcon}>📄</Text>
            <Text style={styles.actionBtnText}>Xuất Word</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => handleExportPdf(true)}>
            <Text style={styles.actionBtnIcon}>📥</Text>
            <Text style={styles.actionBtnText}>Xuất PDF</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              router.push({
                pathname: '/worksheets/edit',
                params: { id: worksheet.id },
              });
            }}>
            <Text style={styles.actionBtnIcon}>✏️</Text>
            <Text style={styles.actionBtnText}>Sửa</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleDuplicate}>
            <Text style={styles.actionBtnIcon}>📋</Text>
            <Text style={styles.actionBtnText}>Nhân bản</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.deleteActionBtn]}
            onPress={handleDelete}
            disabled={isDeleting}>
            <Text style={styles.actionBtnIcon}>🗑️</Text>
            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Xóa</Text>
          </Pressable>
        </View>
      </View>

      {/* Questions Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>
            DANH SÁCH CÂU HỎI ({questions.length})
          </Text>
        </View>

        {questions.length === 0 ? (
          <Text style={styles.emptyQuestionsText}>
            Phiếu học tập này chưa có câu hỏi nào.
          </Text>
        ) : (
          questions.map((q: WorksheetQuestionItem, index: number) => {
            const typeInfo = getQuestionTypeLabel(q.questionType);
            const options = q.options || q.optionsJson || [];
            const correctAnswer = q.correctAnswer ?? q.correctAnswerJson;

            return (
              <View key={q.id || index} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNum}>Câu {index + 1}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                      {typeInfo.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.questionContent}>{q.content}</Text>

                {/* Options for Multiple Choice & True/False */}
                {options.length > 0 ? (
                  <View style={styles.optionsList}>
                    {options.map((opt: string, optIdx: number) => {
                      const isCorrect =
                        opt === correctAnswer ||
                        (typeof correctAnswer === 'string' &&
                          opt.toLowerCase().startsWith(correctAnswer.toLowerCase()));

                      return (
                        <View
                          key={optIdx}
                          style={[
                            styles.optionItem,
                            isCorrect && styles.optionItemCorrect,
                          ]}>
                          <Text
                            style={[
                              styles.optionText,
                              isCorrect && styles.optionTextCorrect,
                            ]}>
                            {opt} {isCorrect ? ' ✓' : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                {/* Correct Answer Box for Fill Blank, Essay, etc. */}
                {options.length === 0 && correctAnswer ? (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>💡 Đáp án / Hướng dẫn chấm:</Text>
                    <Text style={styles.answerValue}>
                      {typeof correctAnswer === 'object'
                        ? JSON.stringify(correctAnswer)
                        : String(correctAnswer)}
                    </Text>
                  </View>
                ) : null}

                {/* Explanation */}
                {q.explanation ? (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>📖 Giải thích chi tiết:</Text>
                    <Text style={styles.explanationText}>{q.explanation}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  planDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  actionToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.2,
  },
  emptyQuestionsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionContent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  optionsList: {
    gap: 6,
    marginTop: 4,
  },
  optionItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionItemCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  optionText: {
    fontSize: 13,
    color: '#334155',
  },
  optionTextCorrect: {
    color: '#047857',
    fontWeight: '700',
  },
  answerBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  answerValue: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  explanationBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: 2,
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B21A8',
    marginBottom: 2,
  },
  explanationText: {
    fontSize: 12,
    color: '#581C87',
    lineHeight: 17,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  errIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  errText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
