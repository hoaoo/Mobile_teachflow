import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  type LessonPlanActivityItem,
  type LessonPlanStatus,
} from '@/api/client';

const SUBJECT_OPTIONS = ['Toán', 'Tiếng Việt', 'Đạo đức', 'Tự nhiên và Xã hội', 'Lịch sử và Địa lí', 'Khoa học', 'Tin học', 'Hoạt động trải nghiệm'];
const GRADE_OPTIONS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

export default function CreateLessonPlanScreen() {
  const router = useRouter();

  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Toán');
  const [grade, setGrade] = useState<string>('Lớp 4');
  const [topic, setTopic] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<string>('35');
  const [objective, setObjective] = useState<string>('');
  const [specificCompetencies, setSpecificCompetencies] = useState<string>('');
  const [generalCompetencies, setGeneralCompetencies] = useState<string>('');
  const [qualities, setQualities] = useState<string>('');
  const [teachingEquipment, setTeachingEquipment] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<LessonPlanStatus>('DRAFT');

  // Activities State
  const [activities, setActivities] = useState<LessonPlanActivityItem[]>([
    {
      phase: 'Khởi động',
      title: 'Khởi động & Kết nối',
      minutes: 5,
      objective: 'Tạo hứng thú và kết nối kiến thức bài học.',
      teacher: 'Tổ chức trò chơi hoặc câu hỏi gợi mở.',
      students: 'Tham gia và trả lời.',
    },
    {
      phase: 'Khám phá',
      title: 'Hình thành kiến thức mới',
      minutes: 15,
      objective: 'Học sinh nhận biết kiến thức trọng tâm.',
      teacher: 'Hướng dẫn học sinh quan sát, thảo luận.',
      students: 'Thảo luận nhóm và rút ra kết luận.',
    },
    {
      phase: 'Luyện tập',
      title: 'Luyện tập & Thực hành',
      minutes: 10,
      objective: 'Vận dụng kiến thức làm bài tập.',
      teacher: 'Giao nhiệm vụ và hỗ trợ học sinh.',
      students: 'Làm bài tập cá nhân hoặc theo cặp.',
    },
    {
      phase: 'Vận dụng',
      title: 'Vận dụng & Mở rộng',
      minutes: 5,
      objective: 'Liên hệ thực tiễn và củng cố.',
      teacher: 'Nhận xét và dặn dò.',
      students: 'Lắng nghe và ghi nhớ.',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AI Assistant Modal State
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiLessonTitle, setAiLessonTitle] = useState<string>('');
  const [aiSubject, setAiSubject] = useState<string>('Toán');
  const [aiGrade, setAiGrade] = useState<number>(4);
  const [aiRequirements, setAiRequirements] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Generation Handler
  const handleGenerateAI = async () => {
    if (!aiLessonTitle.trim()) {
      setAiError('Vui lòng nhập tên bài học');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const generated = await apiClient.generateLessonPlanAI({
        grade: aiGrade,
        subject: aiSubject,
        lessonTitle: aiLessonTitle.trim(),
        durationMinutes: parseInt(duration, 10) || 35,
        requirements: aiRequirements.trim() || undefined,
      });

      // Populate draft fields
      setTitle(generated.title || aiLessonTitle.trim());
      setSubject(generated.subject || aiSubject);
      setGrade(`Lớp ${aiGrade}`);
      if (generated.topic) setTopic(generated.topic);
      if (generated.objective) setObjective(generated.objective);
      if (generated.specificCompetencies) setSpecificCompetencies(generated.specificCompetencies);
      if (generated.generalCompetencies) setGeneralCompetencies(generated.generalCompetencies);
      if (generated.qualities) setQualities(generated.qualities);
      if (generated.teachingEquipment) setTeachingEquipment(generated.teachingEquipment);
      if (generated.activities && generated.activities.length > 0) {
        setActivities(generated.activities);
      }

      setShowAiModal(false);
      Alert.alert(
        'Đã tạo bản nháp AI',
        'Trợ lý AI đã soạn thảo nội dung giáo án. Vui lòng xem lại và chỉnh sửa trước khi lưu.',
      );
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : 'Không thể tạo giáo án từ AI',
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Activity Handlers
  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      {
        phase: 'Hoạt động bổ sung',
        title: `Hoạt động ${prev.length + 1}`,
        minutes: 5,
        objective: '',
        teacher: '',
        students: '',
      },
    ]);
  };

  const handleUpdateActivity = (index: number, field: keyof LessonPlanActivityItem, val: any) => {
    setActivities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Lesson Plan
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên bài dạy');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiClient.createLessonPlan({
        title: title.trim(),
        subject,
        grade,
        topic: topic.trim() || undefined,
        date: date.trim() || undefined,
        duration: parseInt(duration, 10) || 35,
        objective: objective.trim() || undefined,
        specificCompetencies: specificCompetencies.trim() || undefined,
        generalCompetencies: generalCompetencies.trim() || undefined,
        qualities: qualities.trim() || undefined,
        teachingEquipment: teachingEquipment.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        activities: activities.map((act, idx) => ({
          ...act,
          sortOrder: idx,
        })),
      });

      Alert.alert('Thành công', 'Đã tạo giáo án mới thành công', [
        {
          text: 'Xem chi tiết',
          onPress: () => {
            router.replace({
              pathname: '/lesson-plans/[id]',
              params: { id: created.id },
            });
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo giáo án';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* AI Assistant Promo Button */}
      <Pressable style={styles.aiBanner} onPress={() => setShowAiModal(true)}>
        <View style={styles.aiBannerLeft}>
          <Text style={styles.aiBannerIcon}>✨</Text>
          <View>
            <Text style={styles.aiBannerTitle}>Soạn giáo án với Trợ lý AI</Text>
            <Text style={styles.aiBannerSubtitle}>
              Tự động gợi ý mục tiêu, phẩm chất và tiến trình hoạt động chuẩn GDVN
            </Text>
          </View>
        </View>
        <Text style={styles.aiBannerArrow}>›</Text>
      </Pressable>

      {/* Basic Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>1. THÔNG TIN CHUNG</Text>

        <Text style={styles.inputLabel}>Tên bài dạy *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Bài 55: Tính chất cơ bản của phân số..."
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

        <View style={styles.rowTwo}>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>Ngày dạy (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>Thời lượng (phút)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Chủ đề bài học</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Phân số và các phép tính..."
          placeholderTextColor="#94A3B8"
          value={topic}
          onChangeText={setTopic}
        />
      </View>

      {/* Objectives Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>2. YÊU CẦU CẦN ĐẠT / MỤC TIÊU</Text>

        <Text style={styles.inputLabel}>Yêu cầu cần đạt về kiến thức & kỹ năng</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Học sinh nhận biết được..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={objective}
          onChangeText={setObjective}
        />

        <Text style={styles.inputLabel}>Năng lực đặc thù</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Năng lực tư duy toán học, giải quyết vấn đề..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          value={specificCompetencies}
          onChangeText={setSpecificCompetencies}
        />

        <Text style={styles.inputLabel}>Năng lực chung</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Tự chủ và tự học, giao tiếp và hợp tác..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          value={generalCompetencies}
          onChangeText={setGeneralCompetencies}
        />

        <Text style={styles.inputLabel}>Phẩm chất chủ yếu</Text>
        <TextInput
          style={styles.input}
          placeholder="Chăm chỉ, trung thực, trách nhiệm..."
          placeholderTextColor="#94A3B8"
          value={qualities}
          onChangeText={setQualities}
        />
      </View>

      {/* Teaching Equipment */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>3. THIẾT BỊ DẠY HỌC & HỌC LIỆU</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Giáo viên: SGK, máy chiếu, bảng phụ...&#10;Học sinh: SGK, vở ghi, bộ đồ dùng..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={teachingEquipment}
          onChangeText={setTeachingEquipment}
        />
      </View>

      {/* Activities Section */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>4. TIẾN TRÌNH HOẠT ĐỘNG ({activities.length})</Text>
          <Pressable style={styles.addActBtn} onPress={handleAddActivity}>
            <Text style={styles.addActBtnText}>＋ Thêm hoạt động</Text>
          </Pressable>
        </View>

        {activities.map((act, index) => (
          <View key={index} style={styles.activityFormBox}>
            <View style={styles.actTopRow}>
              <Text style={styles.actIndexTitle}>Hoạt động {index + 1}</Text>
              {activities.length > 1 ? (
                <Pressable onPress={() => handleRemoveActivity(index)}>
                  <Text style={styles.deleteActText}>✕ Xóa</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.rowTwo}>
              <View style={styles.flex2}>
                <Text style={styles.smallLabel}>Tiến trình</Text>
                <TextInput
                  style={styles.smallInput}
                  value={act.phase}
                  onChangeText={(v) => handleUpdateActivity(index, 'phase', v)}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.smallLabel}>Thời lượng (phút)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={act.minutes?.toString()}
                  onChangeText={(v) =>
                    handleUpdateActivity(index, 'minutes', parseInt(v, 10) || 5)
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.smallLabel}>Tên hoạt động *</Text>
            <TextInput
              style={styles.smallInput}
              value={act.title}
              onChangeText={(v) => handleUpdateActivity(index, 'title', v)}
            />

            <Text style={styles.smallLabel}>Hoạt động của Giáo viên</Text>
            <TextInput
              style={[styles.smallInput, styles.smallTextarea]}
              placeholder="GV tổ chức, hướng dẫn..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              value={act.teacher}
              onChangeText={(v) => handleUpdateActivity(index, 'teacher', v)}
            />

            <Text style={styles.smallLabel}>Hoạt động của Học sinh</Text>
            <TextInput
              style={[styles.smallInput, styles.smallTextarea]}
              placeholder="HS thực hiện, thảo luận..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              value={act.students}
              onChangeText={(v) => handleUpdateActivity(index, 'students', v)}
            />
          </View>
        ))}
      </View>

      {/* Notes & Status */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>5. TRẠNG THÁI & GHI CHÚ</Text>

        <Text style={styles.inputLabel}>Trạng thái lưu</Text>
        <View style={styles.rowTwo}>
          <Pressable
            style={[styles.statusOption, status === 'DRAFT' && styles.statusOptionActive]}
            onPress={() => setStatus('DRAFT')}>
            <Text style={[styles.statusOptionText, status === 'DRAFT' && styles.statusOptionTextActive]}>
              📝 Bản nháp
            </Text>
          </Pressable>

          <Pressable
            style={[styles.statusOption, status === 'COMPLETED' && styles.statusOptionActive]}
            onPress={() => setStatus('COMPLETED')}>
            <Text style={[styles.statusOptionText, status === 'COMPLETED' && styles.statusOptionTextActive]}>
              ✓ Hoàn thành
            </Text>
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Ghi chú bổ sung</Text>
        <TextInput
          style={styles.input}
          placeholder="Ghi chú thêm của giáo viên..."
          placeholderTextColor="#94A3B8"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Bottom Save Button */}
      <Pressable
        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>💾 Lưu giáo án</Text>
        )}
      </Pressable>

      {/* AI Assistant Modal */}
      <Modal visible={showAiModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✨ Trợ lý AI Soạn Giáo án</Text>
            <Text style={styles.modalSubtitle}>
              Nhập tên bài học, AI sẽ thiết kế mục tiêu và tiến trình bài dạy chuẩn
            </Text>

            {aiError ? (
              <View style={styles.aiErrorBox}>
                <Text style={styles.aiErrorText}>{aiError}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Môn học *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {SUBJECT_OPTIONS.map((sub) => (
                <Pressable
                  key={sub}
                  style={[styles.chip, aiSubject === sub && styles.chipActive]}
                  onPress={() => setAiSubject(sub)}>
                  <Text style={[styles.chipText, aiSubject === sub && styles.chipTextActive]}>
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Khối lớp *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {[1, 2, 3, 4, 5].map((g) => (
                <Pressable
                  key={g}
                  style={[styles.chip, aiGrade === g && styles.chipActive]}
                  onPress={() => setAiGrade(g)}>
                  <Text style={[styles.chipText, aiGrade === g && styles.chipTextActive]}>
                    Lớp {g}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Tên bài học *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Trong lời mẹ hát, Phân số bằng nhau..."
              placeholderTextColor="#94A3B8"
              value={aiLessonTitle}
              onChangeText={setAiLessonTitle}
            />

            <Text style={styles.inputLabel}>Yêu cầu sư phạm bổ sung (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Ví dụ: Tăng cường hoạt động thảo luận nhóm, ứng dụng CNTT..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={aiRequirements}
              onChangeText={setAiRequirements}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowAiModal(false)}
                disabled={isAiGenerating}>
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalSubmitBtn,
                  isAiGenerating && styles.submitBtnDisabled,
                ]}
                onPress={handleGenerateAI}
                disabled={isAiGenerating}>
                {isAiGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>✨ Sinh giáo án</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    padding: 14,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  aiBannerIcon: {
    fontSize: 24,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B21A8',
  },
  aiBannerSubtitle: {
    fontSize: 11,
    color: '#7E22CE',
    marginTop: 2,
    lineHeight: 15,
  },
  aiBannerArrow: {
    fontSize: 20,
    color: '#6B21A8',
    fontWeight: '700',
    marginLeft: 8,
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
    height: 68,
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
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  addActBtn: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  addActBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  activityFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    gap: 6,
  },
  actTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actIndexTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  deleteActText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  smallInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  smallTextarea: {
    height: 54,
    paddingTop: 6,
    textAlignVertical: 'top',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B21A8',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  aiErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  aiErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
