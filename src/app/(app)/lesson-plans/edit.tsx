import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  apiClient,
  type LessonPlanActivityItem,
  type LessonPlanStatus,
} from '@/api/client';

const SUBJECT_OPTIONS = ['Toán', 'Tiếng Việt', 'Đạo đức', 'Tự nhiên và Xã hội', 'Lịch sử và Địa lí', 'Khoa học', 'Tin học', 'Hoạt động trải nghiệm'];
const GRADE_OPTIONS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

export default function EditLessonPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [version, setVersion] = useState<number>(1);

  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Toán');
  const [grade, setGrade] = useState<string>('Lớp 4');
  const [topic, setTopic] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [duration, setDuration] = useState<string>('35');
  const [objective, setObjective] = useState<string>('');
  const [specificCompetencies, setSpecificCompetencies] = useState<string>('');
  const [generalCompetencies, setGeneralCompetencies] = useState<string>('');
  const [qualities, setQualities] = useState<string>('');
  const [teachingEquipment, setTeachingEquipment] = useState<string>('');
  const [postLessonAdjustment, setPostLessonAdjustment] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<LessonPlanStatus>('DRAFT');
  const [activities, setActivities] = useState<LessonPlanActivityItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      if (!id) return;
      try {
        setLoadingInitial(true);
        const plan = await apiClient.getLessonPlanById(id);
        if (isMounted) {
          setTitle(plan.title || '');
          setSubject(plan.subject || 'Toán');
          setGrade(plan.grade || 'Lớp 4');
          setTopic(plan.topic || '');
          setDate(plan.date || '');
          setDuration((plan.duration || 35).toString());
          setObjective(plan.objective || '');
          setSpecificCompetencies(plan.specificCompetencies || '');
          setGeneralCompetencies(plan.generalCompetencies || '');
          setQualities(plan.qualities || '');
          setTeachingEquipment(plan.teachingEquipment || '');
          setPostLessonAdjustment(plan.postLessonAdjustment || '');
          setNotes(plan.notes || '');
          setStatus(plan.status || 'DRAFT');
          setVersion(plan.version || 1);
          setActivities(plan.activities || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải giáo án';
          Alert.alert('Lỗi', msg, [{ text: 'Quay lại', onPress: () => router.back() }]);
        }
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    };

    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, [id, router]);

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

  const handleSave = async () => {
    if (!id) return;
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên bài dạy');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.updateLessonPlan(id, {
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
        postLessonAdjustment: postLessonAdjustment.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        version,
        activities: activities.map((act, idx) => ({
          ...act,
          sortOrder: idx,
        })),
      });

      Alert.alert('Thành công', 'Đã cập nhật giáo án thành công', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('phiên làm việc khác')) {
        Alert.alert(
          'Xung đột dữ liệu',
          'Giáo án đã được cập nhật bởi một phiên khác. Vui lòng tải lại dữ liệu mới nhất.',
          [{ text: 'Tải lại', onPress: () => router.replace({ pathname: '/lesson-plans/[id]', params: { id } }) }],
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Lỗi cập nhật giáo án';
        Alert.alert('Lỗi', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải dữ liệu giáo án...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Basic Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>1. THÔNG TIN CHUNG (Phiên bản {version})</Text>

        <Text style={styles.inputLabel}>Tên bài dạy *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tên bài dạy..."
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
          placeholder="Chủ đề bài học..."
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
          placeholder="Năng lực đặc thù..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          value={specificCompetencies}
          onChangeText={setSpecificCompetencies}
        />

        <Text style={styles.inputLabel}>Năng lực chung</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Năng lực chung..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          value={generalCompetencies}
          onChangeText={setGeneralCompetencies}
        />

        <Text style={styles.inputLabel}>Phẩm chất chủ yếu</Text>
        <TextInput
          style={styles.input}
          placeholder="Phẩm chất..."
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
          placeholder="Đồ dùng dạy học của giáo viên và học sinh..."
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

      {/* Notes, Adjustment & Status */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>5. TRẠNG THÁI, ĐIỀU CHỈNH & GHI CHÚ</Text>

        <Text style={styles.inputLabel}>Trạng thái</Text>
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

          <Pressable
            style={[styles.statusOption, status === 'TAUGHT' && styles.statusOptionActive]}
            onPress={() => setStatus('TAUGHT')}>
            <Text style={[styles.statusOptionText, status === 'TAUGHT' && styles.statusOptionTextActive]}>
              🏫 Đã dạy
            </Text>
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Điều chỉnh sau bài dạy</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Nhận xét, kinh nghiệm rút ra sau tiết dạy..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          value={postLessonAdjustment}
          onChangeText={setPostLessonAdjustment}
        />

        <Text style={styles.inputLabel}>Ghi chú bổ sung</Text>
        <TextInput
          style={styles.input}
          placeholder="Ghi chú thêm..."
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
          <Text style={styles.saveBtnText}>💾 Cập nhật giáo án</Text>
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
});
