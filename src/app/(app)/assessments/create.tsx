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
import { useRouter } from 'expo-router';
import { apiClient, type ClassroomItem } from '@/api/client';

const SUBJECT_OPTIONS = ['Toán', 'Tiếng Việt', 'Đạo đức', 'Tự nhiên và Xã hội', 'Lịch sử và Địa lí', 'Khoa học', 'Tin học', 'Hoạt động trải nghiệm'];

const ASSESSMENT_TYPES = [
  { key: 'THUONG_XUYEN', label: 'Thường xuyên' },
  { key: 'GIUA_KY', label: 'Giữa kỳ' },
  { key: 'CUOI_KY', label: 'Cuối kỳ' },
];

export default function CreateAssessmentScreen() {
  const router = useRouter();

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState<boolean>(true);

  const [title, setTitle] = useState<string>('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [semester, setSemester] = useState<number>(1);
  const [assessmentType, setAssessmentType] = useState<string>('GIUA_KY');
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchClassrooms = async () => {
      try {
        setLoadingClassrooms(true);
        const res = await apiClient.getClassrooms();
        if (isMounted) {
          const list = res?.items || [];
          setClassrooms(list);
          if (list.length > 0) {
            setSelectedClassroomId(list[0].id);
          }
        }
      } catch {
        // Keep empty
      } finally {
        if (isMounted) {
          setLoadingClassrooms(false);
        }
      }
    };

    fetchClassrooms();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên đợt đánh giá');
      return;
    }

    if (!selectedClassroomId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn lớp học');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedClass = classrooms.find((c) => c.id === selectedClassroomId);
      const created = await apiClient.createAssessment({
        title: title.trim(),
        classroomId: selectedClassroomId,
        subtitle: `${selectedSubject} · ${selectedClass?.name || 'Lớp'}`,
        semester,
        assessmentType,
        assessmentDate,
        status: 'IN_PROGRESS',
      });

      Alert.alert('Thành công', 'Đã tạo đợt đánh giá mới thành công', [
        {
          text: 'Nhập điểm ngay',
          onPress: () => {
            router.replace({
              pathname: '/assessments/[id]',
              params: { id: created.id },
            });
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo đợt đánh giá';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.cardHeading}>THÔNG TIN ĐỢT ĐÁNH GIÁ</Text>

        {/* Title */}
        <Text style={styles.inputLabel}>Tên đợt đánh giá *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Đánh giá giữa kỳ I, Kiểm tra thường xuyên tuần 4..."
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* Classroom Selector */}
        <Text style={styles.inputLabel}>Lớp học *</Text>
        {loadingClassrooms ? (
          <ActivityIndicator size="small" color="#0284C7" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {classrooms.map((cls) => (
              <Pressable
                key={cls.id}
                style={[
                  styles.chip,
                  selectedClassroomId === cls.id && styles.chipActive,
                ]}
                onPress={() => setSelectedClassroomId(cls.id)}>
                <Text
                  style={[
                    styles.chipText,
                    selectedClassroomId === cls.id && styles.chipTextActive,
                  ]}>
                  {cls.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Subject Selector */}
        <Text style={styles.inputLabel}>Môn học *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {SUBJECT_OPTIONS.map((sub) => (
            <Pressable
              key={sub}
              style={[
                styles.chip,
                selectedSubject === sub && styles.chipActive,
              ]}
              onPress={() => setSelectedSubject(sub)}>
              <Text
                style={[
                  styles.chipText,
                  selectedSubject === sub && styles.chipTextActive,
                ]}>
                {sub}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Semester Selector */}
        <Text style={styles.inputLabel}>Học kỳ *</Text>
        <View style={styles.rowTwo}>
          <Pressable
            style={[styles.segmentBtn, semester === 1 && styles.segmentBtnActive]}
            onPress={() => setSemester(1)}>
            <Text style={[styles.segmentText, semester === 1 && styles.segmentTextActive]}>
              Học kỳ I
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, semester === 2 && styles.segmentBtnActive]}
            onPress={() => setSemester(2)}>
            <Text style={[styles.segmentText, semester === 2 && styles.segmentTextActive]}>
              Học kỳ II
            </Text>
          </Pressable>
        </View>

        {/* Assessment Type Selector */}
        <Text style={styles.inputLabel}>Loại đánh giá</Text>
        <View style={styles.rowThree}>
          {ASSESSMENT_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[
                styles.segmentBtn,
                assessmentType === t.key && styles.segmentBtnActive,
              ]}
              onPress={() => setAssessmentType(t.key)}>
              <Text
                style={[
                  styles.segmentText,
                  assessmentType === t.key && styles.segmentTextActive,
                ]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Date Input */}
        <Text style={styles.inputLabel}>Ngày đánh giá (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={assessmentDate}
          onChangeText={setAssessmentDate}
        />
      </View>

      {/* Save Button */}
      <Pressable
        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>💾 Tạo đợt đánh giá</Text>
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
    marginTop: 10,
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
    marginTop: 4,
  },
  rowThree: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  segmentTextActive: {
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
});
