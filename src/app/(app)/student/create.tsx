import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, type ClassroomItem } from '@/api/client';

export default function CreateStudentScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>('');
  const [studentCode, setStudentCode] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getClassrooms()
      .then((res) => {
        const items = res.items || [];
        setClassrooms(items);
        if (items.length > 0) {
          setSelectedClassId(items[0].id);
        }
      })
      .catch(() => {
        setErrorMessage('Không thể tải danh sách lớp học');
      })
      .finally(() => {
        setLoadingClasses(false);
      });
  }, []);

  const handleCreate = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên học sinh');
      return;
    }
    if (!selectedClassId) {
      setErrorMessage('Vui lòng chọn lớp học để phân lớp cho học sinh');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.createStudent({
        fullName: fullName.trim(),
        studentCode: studentCode.trim() || undefined,
        classroomId: selectedClassId,
        gender,
        dob: dob.trim() || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        note: note.trim() || undefined,
      });

      router.back();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tạo hồ sơ học sinh');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingClasses) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải danh sách lớp học...</Text>
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
          <Text style={styles.label}>Họ và tên học sinh *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Nguyễn Văn An"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={(val) => {
              setFullName(val);
              if (errorMessage) setErrorMessage(null);
            }}
          />

          <Text style={styles.label}>Mã học sinh (tùy chọn)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: HS001"
            placeholderTextColor="#94A3B8"
            value={studentCode}
            onChangeText={setStudentCode}
          />

          <Text style={styles.label}>Phân vào lớp học *</Text>
          {classrooms.length === 0 ? (
            <Text style={styles.noClassNotice}>
              Chưa có lớp học nào. Vui lòng tạo lớp học trước khi thêm học sinh.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {classrooms.map((cls) => (
                <Pressable
                  key={cls.id}
                  style={[
                    styles.chip,
                    selectedClassId === cls.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedClassId(cls.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      selectedClassId === cls.id && styles.chipTextActive,
                    ]}>
                    {cls.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={[
                styles.genderOption,
                gender === 'Nam' && styles.genderOptionActive,
              ]}
              onPress={() => setGender('Nam')}>
              <Text
                style={[
                  styles.genderOptionText,
                  gender === 'Nam' && styles.genderOptionTextActive,
                ]}>
                Nam
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.genderOption,
                gender === 'Nữ' && styles.genderOptionActive,
              ]}
              onPress={() => setGender('Nữ')}>
              <Text
                style={[
                  styles.genderOptionText,
                  gender === 'Nữ' && styles.genderOptionTextActive,
                ]}>
                Nữ
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Ngày sinh</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/yyyy (ví dụ: 12/04/2016)"
            placeholderTextColor="#94A3B8"
            value={dob}
            onChangeText={setDob}
          />

          <Text style={styles.label}>Họ tên phụ huynh</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Nguyễn Thị Hoa"
            placeholderTextColor="#94A3B8"
            value={parentName}
            onChangeText={setParentName}
          />

          <Text style={styles.label}>Số điện thoại phụ huynh</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 0901 234 567"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={parentPhone}
            onChangeText={setParentPhone}
          />

          <Text style={styles.label}>Ghi chú ban đầu</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Ví dụ: Chăm ngoan, tích cực phát biểu..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            (isSubmitting || classrooms.length === 0) && styles.submitBtnDisabled,
            pressed && !isSubmitting && styles.btnPressed,
          ]}
          onPress={handleCreate}
          disabled={isSubmitting || classrooms.length === 0}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Tạo hồ sơ học sinh</Text>
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
  textarea: {
    height: 76,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  noClassNotice: {
    fontSize: 13,
    color: '#DC2626',
    fontStyle: 'italic',
    marginVertical: 4,
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
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  genderOptionActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  genderOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
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
