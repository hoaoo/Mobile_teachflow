import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  apiClient,
  type GradeItem,
  type SchoolYearItem,
} from '@/api/client';

export default function CreateClassroomScreen() {
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>('');
  const [isHomeroom, setIsHomeroom] = useState<boolean>(false);

  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiClient.getGrades(), apiClient.getSchoolYears()])
      .then(([gradesRes, syRes]) => {
        setGrades(gradesRes || []);
        if (gradesRes && gradesRes.length > 0) {
          setSelectedGradeId(gradesRes[0].id);
        }

        setSchoolYears(syRes || []);
        const currentSy = (syRes || []).find((sy) => sy.isCurrent) || syRes?.[0];
        if (currentSy) {
          setSelectedSchoolYearId(currentSy.id);
        }
      })
      .catch(() => {
        setErrorMessage('Không thể tải danh mục khối và năm học');
      })
      .finally(() => {
        setLoadingMeta(false);
      });
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên lớp học');
      return;
    }
    if (!selectedGradeId) {
      setErrorMessage('Vui lòng chọn khối lớp');
      return;
    }
    if (!selectedSchoolYearId) {
      setErrorMessage('Vui lòng chọn năm học');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.createClassroom({
        name: name.trim(),
        code: code.trim() || undefined,
        gradeId: selectedGradeId,
        schoolYearId: selectedSchoolYearId,
        room: room.trim() || undefined,
        isHomeroom,
        isActive: true,
      });

      router.back();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tạo lớp học');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải danh mục cấu hình...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Tên lớp học *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Lớp 4A1"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (!code) {
                // Auto suggest code
                const auto = val.replace(/lớp/i, '').trim();
                setCode(auto);
              }
              if (errorMessage) setErrorMessage(null);
            }}
          />

          <Text style={styles.label}>Mã lớp (tùy chọn)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 4A1"
            placeholderTextColor="#94A3B8"
            value={code}
            onChangeText={setCode}
          />

          <Text style={styles.label}>Khối lớp *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            {grades.map((g) => (
              <Pressable
                key={g.id}
                style={[
                  styles.chip,
                  selectedGradeId === g.id && styles.chipActive,
                ]}
                onPress={() => setSelectedGradeId(g.id)}>
                <Text
                  style={[
                    styles.chipText,
                    selectedGradeId === g.id && styles.chipTextActive,
                  ]}>
                  {g.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Năm học *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            {schoolYears.map((sy) => (
              <Pressable
                key={sy.id}
                style={[
                  styles.chip,
                  selectedSchoolYearId === sy.id && styles.chipActive,
                ]}
                onPress={() => setSelectedSchoolYearId(sy.id)}>
                <Text
                  style={[
                    styles.chipText,
                    selectedSchoolYearId === sy.id && styles.chipTextActive,
                  ]}>
                  {sy.name} {sy.isCurrent ? '(Hiện tại)' : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Phòng học</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Phòng 204"
            placeholderTextColor="#94A3B8"
            value={room}
            onChangeText={setRoom}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Đặt làm lớp chủ nhiệm</Text>
              <Text style={styles.switchSubLabel}>
                Bạn sẽ là giáo viên chủ nhiệm trực tiếp của lớp này
              </Text>
            </View>
            <Switch
              value={isHomeroom}
              onValueChange={setIsHomeroom}
              trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
              thumbColor={isHomeroom ? '#0284C7' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Submit Action */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            isSubmitting && styles.submitBtnDisabled,
            pressed && !isSubmitting && styles.btnPressed,
          ]}
          onPress={handleCreate}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Tạo lớp học</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  submitBtn: {
    height: 50,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  btnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
