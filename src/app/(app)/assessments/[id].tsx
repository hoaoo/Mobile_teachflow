import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  apiClient,
  type AssessmentItem,
  type AssessmentLevelType,
} from '@/api/client';

const LEVELS: { key: AssessmentLevelType; label: string; short: string; color: string; bg: string; border: string }[] = [
  { key: 'EXCELLENT', label: 'Tốt', short: 'T', color: '#059669', bg: '#ECFDF5', border: '#10B981' },
  { key: 'COMPLETED', label: 'Hoàn thành', short: 'H', color: '#0284C7', bg: '#F0F9FF', border: '#0284C7' },
  { key: 'NEEDS_SUPPORT', label: 'Cần cố gắng', short: 'C', color: '#D97706', bg: '#FFFBEB', border: '#F59E0B' },
];

interface StudentScoreDraft {
  studentId: string;
  fullName: string;
  gender?: string;
  level: AssessmentLevelType;
  score: string;
  comment: string;
  isEvaluated: boolean;
}

export default function AssessmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentItem | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<StudentScoreDraft[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        setErrorMessage(null);
        if (!isRefresh) setLoading(true);
        const res = await apiClient.getAssessmentById(id);
        setAssessment(res);

        // Map students and their existing assessment scores
        const existingScoreMap = new Map<string, any>();
        (res.studentAssessments || []).forEach((sa) => {
          existingScoreMap.set(sa.studentId, sa);
        });

        const drafts: StudentScoreDraft[] = (res.students || []).map((st) => {
          const sa = existingScoreMap.get(st.id);
          return {
            studentId: st.id,
            fullName: st.fullName,
            gender: st.gender,
            level: (sa?.level as AssessmentLevelType) || 'COMPLETED',
            score: sa?.score !== null && sa?.score !== undefined ? String(sa.score) : '',
            comment: sa?.comment || '',
            isEvaluated: Boolean(sa),
          };
        });

        setStudentDrafts(drafts);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Không thể tải chi tiết đợt đánh giá',
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
        const res = await apiClient.getAssessmentById(id);
        if (isMounted) {
          setAssessment(res);

          const existingScoreMap = new Map<string, any>();
          (res.studentAssessments || []).forEach((sa) => {
            existingScoreMap.set(sa.studentId, sa);
          });

          const drafts: StudentScoreDraft[] = (res.students || []).map((st) => {
            const sa = existingScoreMap.get(st.id);
            return {
              studentId: st.id,
              fullName: st.fullName,
              gender: st.gender,
              level: (sa?.level as AssessmentLevelType) || 'COMPLETED',
              score: sa?.score !== null && sa?.score !== undefined ? String(sa.score) : '',
              comment: sa?.comment || '',
              isEvaluated: Boolean(sa),
            };
          });

          setStudentDrafts(drafts);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải chi tiết đợt đánh giá',
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

  const handleLevelChange = (studentId: string, level: AssessmentLevelType) => {
    setStudentDrafts((prev) =>
      prev.map((d) =>
        d.studentId === studentId
          ? {
              ...d,
              level,
              isEvaluated: true,
            }
          : d,
      ),
    );
  };

  const handleScoreChange = (studentId: string, scoreText: string) => {
    setStudentDrafts((prev) =>
      prev.map((d) => {
        if (d.studentId !== studentId) return d;
        const num = parseFloat(scoreText);
        let derivedLevel = d.level;
        if (!isNaN(num)) {
          if (num >= 8.0) derivedLevel = 'EXCELLENT';
          else if (num >= 5.0) derivedLevel = 'COMPLETED';
          else derivedLevel = 'NEEDS_SUPPORT';
        }
        return {
          ...d,
          score: scoreText,
          level: derivedLevel,
          isEvaluated: true,
        };
      }),
    );
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setStudentDrafts((prev) =>
      prev.map((d) => (d.studentId === studentId ? { ...d, comment } : d)),
    );
  };

  const handleSaveAll = async () => {
    if (!id) return;
    setIsSaving(true);

    try {
      const payloadScores = studentDrafts.map((d) => {
        const numScore = d.score.trim() ? parseFloat(d.score.trim()) : null;
        return {
          studentId: d.studentId,
          level: d.level,
          score: numScore !== null && !isNaN(numScore) ? numScore : null,
          comment: d.comment.trim() || undefined,
        };
      });

      await apiClient.batchSaveAssessmentScores(id, {
        scores: payloadScores,
      });

      Alert.alert('Thành công', 'Đã lưu kết quả đánh giá cho toàn bộ học sinh');
      fetchDetail(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu kết quả đánh giá';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id || !assessment) return;
    Alert.alert(
      'Xóa đợt đánh giá',
      `Bạn có chắc chắn muốn xóa "${assessment.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteAssessment(id);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Lỗi xóa đợt đánh giá';
              Alert.alert('Lỗi', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  // Metrics
  const totalStudents = studentDrafts.length;
  const evaluatedCount = studentDrafts.filter((d) => d.isEvaluated).length;
  const excellentCount = studentDrafts.filter((d) => d.level === 'EXCELLENT').length;
  const completedCount = studentDrafts.filter((d) => d.level === 'COMPLETED').length;
  const needsSupportCount = studentDrafts.filter((d) => d.level === 'NEEDS_SUPPORT').length;
  const percentDone = totalStudents > 0 ? Math.round((evaluatedCount / totalStudents) * 100) : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải đợt đánh giá...</Text>
      </View>
    );
  }

  if (errorMessage || !assessment) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errIcon}>⚠️</Text>
        <Text style={styles.errTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errText}>{errorMessage || 'Không tìm thấy đợt đánh giá'}</Text>
        <Pressable style={styles.retryBtn} onPress={() => fetchDetail()}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const renderStudentItem = ({ item, index }: { item: StudentScoreDraft; index: number }) => {
    return (
      <View style={styles.studentCard}>
        {/* Row 1: Student Name & Gender */}
        <View style={styles.studentHeaderRow}>
          <View style={styles.studentInfoLeft}>
            <Text style={styles.studentIndex}>{index + 1}.</Text>
            <Text style={styles.studentName}>{item.fullName}</Text>
            {item.gender ? (
              <Text style={styles.genderTag}>
                ({item.gender === 'MALE' ? 'Nam' : item.gender === 'FEMALE' ? 'Nữ' : item.gender})
              </Text>
            ) : null}
          </View>

          {/* Score Input */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Điểm:</Text>
            <TextInput
              style={styles.scoreInput}
              value={item.score}
              onChangeText={(v) => handleScoreChange(item.studentId, v)}
              placeholder="0-10"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Row 2: Level Selector Chips */}
        <View style={styles.levelRow}>
          {LEVELS.map((lvl) => {
            const isSelected = item.level === lvl.key;
            return (
              <Pressable
                key={lvl.key}
                style={[
                  styles.levelChip,
                  isSelected && {
                    backgroundColor: lvl.bg,
                    borderColor: lvl.border,
                  },
                ]}
                onPress={() => handleLevelChange(item.studentId, lvl.key)}>
                <Text
                  style={[
                    styles.levelChipText,
                    isSelected && { color: lvl.color, fontWeight: '800' },
                  ]}>
                  {isSelected ? '✓ ' : ''}{lvl.label} ({lvl.short})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Row 3: Comment Input */}
        <TextInput
          style={styles.commentInput}
          placeholder="Nhận xét sự tiến bộ, ưu điểm hoặc điểm cần lưu ý..."
          placeholderTextColor="#94A3B8"
          value={item.comment}
          onChangeText={(v) => handleCommentChange(item.studentId, v)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerTopRow}>
          <View style={styles.badgeGroup}>
            {assessment.classroom?.name ? (
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{assessment.classroom.name}</Text>
              </View>
            ) : null}
            {assessment.subject?.name ? (
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{assessment.subject.name}</Text>
              </View>
            ) : null}
            <View style={styles.semesterBadge}>
              <Text style={styles.semesterBadgeText}>
                {assessment.semester === 2 ? 'HK2' : 'HK1'}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.deleteHeaderBtn}
            onPress={handleDelete}
            disabled={isDeleting}>
            <Text style={styles.deleteHeaderText}>🗑️ Xóa đợt</Text>
          </Pressable>
        </View>

        <Text style={styles.planTitle}>{assessment.title}</Text>

        {/* Progress Metrics */}
        <View style={styles.progressBox}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressTitle}>Tiến độ đánh giá</Text>
            <Text style={styles.progressPercent}>
              {evaluatedCount}/{totalStudents} học sinh ({percentDone}%)
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentDone}%` },
              ]}
            />
          </View>

          <View style={styles.statSummaryRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#059669' }]}>{excellentCount}</Text>
              <Text style={styles.statLabel}>Tốt (T)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#0284C7' }]}>{completedCount}</Text>
              <Text style={styles.statLabel}>Hoàn thành (H)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#D97706' }]}>{needsSupportCount}</Text>
              <Text style={styles.statLabel}>Cần cố gắng (C)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Student Assessment List */}
      {studentDrafts.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Lớp này chưa có học sinh để đánh giá</Text>
        </View>
      ) : (
        <FlatList
          data={studentDrafts}
          keyExtractor={(item) => item.studentId}
          renderItem={renderStudentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
            />
          }
        />
      )}

      {/* Bottom Floating Save Button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.saveAllBtn, isSaving && styles.saveAllBtnDisabled]}
          onPress={handleSaveAll}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveAllBtnText}>💾 Lưu toàn bộ kết quả đánh giá</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  classBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  subjectBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  semesterBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semesterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  deleteHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  deleteHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  progressBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  statSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  studentIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  genderTag: {
    fontSize: 11,
    color: '#64748B',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scoreInput: {
    width: 54,
    height: 34,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  commentInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveAllBtn: {
    height: 48,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAllBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveAllBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
});
