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
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { apiClient } from '@/api/client';

const SUBJECT_OPTIONS = ['Toán', 'Tiếng Việt', 'Đạo đức', 'Tự nhiên và Xã hội', 'Lịch sử và Địa lí', 'Khoa học', 'Tin học', 'Hoạt động trải nghiệm'];
const GRADE_OPTIONS = ['Khối 1', 'Khối 2', 'Khối 3', 'Khối 4', 'Khối 5'];

export default function CreateResourceScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<'FILE' | 'LINK'>('FILE');

  // Selected file state
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [selectedGrade, setSelectedGrade] = useState<string>('Khối 4');
  const [description, setDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
        });
        if (!title.trim()) {
          // Auto fill title from file name without extension
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setTitle(cleanName);
        }
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể chọn tệp tin từ thiết bị');
    }
  };

  const handleSave = async () => {
    if (mode === 'FILE') {
      if (!selectedFile) {
        Alert.alert('Thiếu tệp tin', 'Vui lòng chọn một tập tin từ thiết bị');
        return;
      }
      if (!title.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hiển thị của tài nguyên');
        return;
      }

      setIsSubmitting(true);
      try {
        const created = await apiClient.uploadResourceFile({
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream',
          description: description.trim() || undefined,
          tone: 'teal',
        });

        Alert.alert('Thành công', 'Đã tải lên học liệu mới thành công', [
          {
            text: 'Xem chi tiết',
            onPress: () => {
              router.replace({
                pathname: '/resources/[id]',
                params: { id: created.id },
              });
            },
          },
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi tải lên học liệu';
        Alert.alert('Lỗi', msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // LINK mode
      if (!title.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề liên kết');
        return;
      }
      if (!linkUrl.trim()) {
        Alert.alert('Thiếu liên kết', 'Vui lòng nhập URL liên kết');
        return;
      }

      if (!linkUrl.trim().startsWith('http://') && !linkUrl.trim().startsWith('https://')) {
        Alert.alert('Lỗi định dạng', 'URL phải bắt đầu bằng http:// hoặc https://');
        return;
      }

      setIsSubmitting(true);
      try {
        const created = await apiClient.createResource({
          title: title.trim(),
          externalUrl: linkUrl.trim(),
          resourceType: 'LINK',
          subtitle: `${selectedSubject} · ${selectedGrade}`,
          description: description.trim() || undefined,
          status: 'ACTIVE',
          tone: 'blue',
        });

        Alert.alert('Thành công', 'Đã thêm liên kết tài nguyên mới thành công', [
          {
            text: 'Xem chi tiết',
            onPress: () => {
              router.replace({
                pathname: '/resources/[id]',
                params: { id: created.id },
              });
            },
          },
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi thêm liên kết';
        Alert.alert('Lỗi', msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Mode Switcher */}
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeBtn, mode === 'FILE' && styles.modeBtnActive]}
          onPress={() => setMode('FILE')}>
          <Text style={[styles.modeBtnText, mode === 'FILE' && styles.modeBtnTextActive]}>
            📁 Tải lên tệp tin
          </Text>
        </Pressable>

        <Pressable
          style={[styles.modeBtn, mode === 'LINK' && styles.modeBtnActive]}
          onPress={() => setMode('LINK')}>
          <Text style={[styles.modeBtnText, mode === 'LINK' && styles.modeBtnTextActive]}>
            🔗 Thêm liên kết ngoài
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>
          {mode === 'FILE' ? 'THÔNG TIN TẬP TIN HỌC LIỆU' : 'THÔNG TIN LIÊN KẾT NGOÀI'}
        </Text>

        {/* File Picker if mode is FILE */}
        {mode === 'FILE' ? (
          <View style={styles.filePickerContainer}>
            <Pressable style={styles.pickFileBtn} onPress={handlePickDocument}>
              <Text style={styles.pickFileBtnIcon}>📎</Text>
              <Text style={styles.pickFileBtnText}>
                {selectedFile ? 'Đổi tập tin khác' : 'Chọn tập tin từ thiết bị'}
              </Text>
            </Pressable>

            {selectedFile ? (
              <View style={styles.selectedFileBox}>
                <Text style={styles.selectedFileIcon}>📄</Text>
                <View style={styles.selectedFileInfo}>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.selectedFileSize}>
                    {formatFileSize(selectedFile.size)} • {selectedFile.mimeType || 'Tập tin'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.hintText}>
                Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), Hình ảnh (PNG, JPG) và Video (MP4).
              </Text>
            )}
          </View>
        ) : null}

        {/* Title Input */}
        <Text style={styles.inputLabel}>Tên tài nguyên / Tiêu đề *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Slide bài giảng Phân số, Video minh họa..."
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* Link URL if mode is LINK */}
        {mode === 'LINK' ? (
          <View>
            <Text style={styles.inputLabel}>Địa chỉ liên kết URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor="#94A3B8"
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        ) : null}

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

        {/* Grade Selector */}
        <Text style={styles.inputLabel}>Khối lớp *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {GRADE_OPTIONS.map((gr) => (
            <Pressable
              key={gr}
              style={[
                styles.chip,
                selectedGrade === gr && styles.chipActive,
              ]}
              onPress={() => setSelectedGrade(gr)}>
              <Text
                style={[
                  styles.chipText,
                  selectedGrade === gr && styles.chipTextActive,
                ]}>
                {gr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Description Input */}
        <Text style={styles.inputLabel}>Mô tả học liệu</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Mô tả nội dung tài nguyên, hướng dẫn sử dụng..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
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
          <Text style={styles.saveBtnText}>
            {mode === 'FILE' ? '💾 Tải lên tài nguyên' : '💾 Lưu liên kết tài nguyên'}
          </Text>
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
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  modeBtnTextActive: {
    color: '#0284C7',
    fontWeight: '800',
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
    marginBottom: 8,
  },
  filePickerContainer: {
    marginBottom: 10,
    gap: 8,
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderStyle: 'dashed',
    backgroundColor: '#F0F9FF',
    gap: 8,
  },
  pickFileBtnIcon: {
    fontSize: 18,
  },
  pickFileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  selectedFileIcon: {
    fontSize: 22,
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedFileSize: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
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
  textarea: {
    height: 72,
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
