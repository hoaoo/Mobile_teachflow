import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  apiClient,
  type ClassroomItem,
  type ClassroomStudentItem,
} from '@/api/client';
import { useAuth } from '@/auth';

export default function ClassroomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<ClassroomItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'INFO'>('STUDENTS');
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchClassroomDetail = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const res = await apiClient.getClassroom(id);
      setClassroom(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải thông tin lớp học');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      if (!id) return;
      try {
        const res = await apiClient.getClassroom(id);
        if (isMounted) {
          setClassroom(res);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải thông tin lớp học');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClassroomDetail();
  }, [fetchClassroomDetail]);

  const currentTeacherId = user?.teacher?.id;
  const isHomeroom = Boolean(
    classroom?.homeroomTeacherId && classroom.homeroomTeacherId === currentTeacherId,
  );

  const handleAddStudent = async () => {
    if (!fullName.trim()) {
      setModalError('Vui lòng nhập họ và tên học sinh');
      return;
    }
    if (!id) return;

    setIsSubmitting(true);
    setModalError(null);
    try {
      await apiClient.addStudentToClass(id, {
        fullName: fullName.trim(),
        gender,
        dob: dob.trim() || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        note: note.trim() || undefined,
      });

      setShowAddModal(false);
      setFullName('');
      setDob('');
      setParentName('');
      setParentPhone('');
      setNote('');
      fetchClassroomDetail();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Không thể thêm học sinh vào lớp');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = (student: ClassroomStudentItem) => {
    if (!id) return;
    Alert.alert(
      'Rút học sinh khỏi lớp',
      `Bạn có chắc chắn muốn rút học sinh "${student.fullName}" khỏi lớp ${classroom?.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rút khỏi lớp',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.removeStudentFromClass(id, student.id);
              fetchClassroomDetail();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Không thể xóa học sinh';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ],
    );
  };

  const handleDeleteClassroom = () => {
    if (!id) return;
    Alert.alert(
      'Lưu trữ / Xóa lớp học',
      `Bạn có chắc chắn muốn xóa lớp "${classroom?.name}"? Hành động này sẽ lưu trữ lớp học.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa lớp',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteClassroom(id);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Không thể xóa lớp';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải chi tiết lớp học...</Text>
      </View>
    );
  }

  if (errorMessage || !classroom) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errorMessage}>{errorMessage || 'Không tìm thấy lớp học'}</Text>
        <Pressable style={styles.retryButton} onPress={fetchClassroomDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const filteredStudents = (classroom.students || []).filter((s) => {
    if (!studentSearch.trim()) return true;
    const kw = studentSearch.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(kw) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(kw)) ||
      (s.guardian && s.guardian.toLowerCase().includes(kw))
    );
  });

  const renderStudentItem = ({ item }: { item: ClassroomStudentItem }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.studentCard, pressed && styles.cardPressed]}
        onPress={() => {
          router.push({
            pathname: '/student/[id]',
            params: { id: item.id },
          });
        }}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>{item.initials || 'HS'}</Text>
        </View>

        <View style={styles.studentInfo}>
          <View style={styles.studentNameRow}>
            <Text style={styles.studentFullName}>{item.fullName}</Text>
            {item.studentCode ? (
              <Text style={styles.studentCodeBadge}>#{item.studentCode}</Text>
            ) : null}
          </View>
          <Text style={styles.studentMeta}>
            {item.gender} • {item.dob}
          </Text>
          {item.guardian && item.guardian !== 'Chưa cập nhật' ? (
            <Text style={styles.studentGuardian}>PH: {item.guardian}</Text>
          ) : null}
        </View>

        <Pressable
          style={styles.removeBtn}
          onPress={() => handleRemoveStudent(item)}
          hitSlop={10}>
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0284C7']}
          />
        }>
        {/* Banner Card */}
        <View style={[styles.bannerCard, isHomeroom && styles.homeroomBanner]}>
          <View style={styles.bannerTopRow}>
            <View style={styles.titleArea}>
              <Text style={styles.classroomTitle}>{classroom.name}</Text>
              <Text style={styles.classroomCode}>Mã lớp: {classroom.code}</Text>
            </View>

            {isHomeroom ? (
              <View style={styles.homeroomBadge}>
                <Text style={styles.homeroomBadgeText}>★ Lớp chủ nhiệm</Text>
              </View>
            ) : (
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>Lớp bộ môn</Text>
              </View>
            )}
          </View>

          <View style={styles.bannerInfoRow}>
            <Text style={styles.bannerMeta}>
              {classroom.gradeDetail?.name || classroom.grade} • {classroom.schoolYear?.name || '2026-2027'}
            </Text>
            <Text style={styles.bannerMeta}>📍 {classroom.room || 'Chưa xếp phòng'}</Text>
          </View>

          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStatItem}>
              <Text style={styles.bannerStatValue}>{classroom.studentCount}</Text>
              <Text style={styles.bannerStatLabel}>Học sinh</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.bannerStatItem}>
              <Text style={styles.bannerStatValue}>
                {classroom.attendance !== null ? `${classroom.attendance}%` : '--'}
              </Text>
              <Text style={styles.bannerStatLabel}>Chuyên cần</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.bannerStatItem}>
              <Text style={styles.bannerStatValue}>
                {classroom.average !== null ? `${classroom.average} đ` : '--'}
              </Text>
              <Text style={styles.bannerStatLabel}>Điểm TB</Text>
            </View>
          </View>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabButtonsRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'STUDENTS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('STUDENTS')}>
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'STUDENTS' && styles.tabBtnTextActive,
              ]}>
              👥 Học sinh ({classroom.studentCount})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'INFO' && styles.tabBtnActive]}
            onPress={() => setActiveTab('INFO')}>
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'INFO' && styles.tabBtnTextActive,
              ]}>
              ℹ️ Thông tin lớp
            </Text>
          </Pressable>
        </View>

        {activeTab === 'STUDENTS' ? (
          <View style={styles.sectionArea}>
            {/* Search & Add Action Header */}
            <View style={styles.studentActionRow}>
              <View style={styles.studentSearchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.studentSearchInput}
                  placeholder="Tìm học sinh trong lớp..."
                  placeholderTextColor="#94A3B8"
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.attendanceBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/attendance',
                    params: { classId: classroom.id },
                  });
                }}>
                <Text style={styles.attendanceBtnText}>📋 Điểm danh</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.attendanceBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/lesson-plans/index',
                  });
                }}>
                <Text style={styles.attendanceBtnText}>📖 Giáo án</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.attendanceBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/worksheets/index',
                  });
                }}>
                <Text style={styles.attendanceBtnText}>📑 Phiếu bài</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.attendanceBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/assessments/index',
                  });
                }}>
                <Text style={styles.attendanceBtnText}>📊 Đánh giá</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.addStudentBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowAddModal(true)}>
                <Text style={styles.addStudentBtnText}>＋ Thêm</Text>
              </Pressable>
            </View>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Lớp này chưa có học sinh</Text>
                <Text style={styles.emptyText}>
                  Bấm nút &ldquo;＋ Thêm&rdquo; ở trên để ghi danh học sinh mới vào lớp.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id}
                renderItem={renderStudentItem}
                scrollEnabled={false}
                contentContainerStyle={styles.studentListGap}
              />
            )}
          </View>
        ) : (
          <View style={styles.sectionArea}>
            {/* Info Card */}
            <View style={styles.infoDetailsCard}>
              <Text style={styles.infoSectionHeading}>Chi tiết quản lý lớp</Text>

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Tên lớp học</Text>
                <Text style={styles.infoFieldValue}>{classroom.name}</Text>
              </View>
              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Mã định danh</Text>
                <Text style={styles.infoFieldValue}>{classroom.code}</Text>
              </View>
              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Khối lớp</Text>
                <Text style={styles.infoFieldValue}>
                  {classroom.gradeDetail?.name || classroom.grade}
                </Text>
              </View>
              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Năm học</Text>
                <Text style={styles.infoFieldValue}>
                  {classroom.schoolYear?.name || 'Năm học hiện tại'}
                </Text>
              </View>
              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Giáo viên chủ nhiệm</Text>
                <Text style={styles.infoFieldValue}>
                  {classroom.homeroomTeacher?.fullName || 'Chưa phân công'}
                </Text>
              </View>
              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Phòng học</Text>
                <Text style={styles.infoFieldValue}>{classroom.room || 'Phòng học'}</Text>
              </View>
              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Text style={styles.infoFieldLabel}>Lịch học</Text>
                <Text style={styles.infoFieldValue}>
                  {classroom.schedule || 'Sáng · Thứ 2 - Thứ 6'}
                </Text>
              </View>
            </View>

            {/* Destructive Actions */}
            <Pressable
              style={({ pressed }) => [
                styles.deleteClassBtn,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleDeleteClassroom}>
              <Text style={styles.deleteClassBtnText}>🗑️ Lưu trữ / Xóa lớp học</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Add Student Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm học sinh vào lớp</Text>
            <Text style={styles.modalSubtitle}>{classroom.name}</Text>

            {modalError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalFormScroll}>
              <Text style={styles.inputLabel}>Họ và tên học sinh *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ví dụ: Nguyễn Văn An"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (modalError) setModalError(null);
                }}
              />

              <Text style={styles.inputLabel}>Giới tính</Text>
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

              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="dd/mm/yyyy (ví dụ: 12/04/2016)"
                placeholderTextColor="#94A3B8"
                value={dob}
                onChangeText={setDob}
              />

              <Text style={styles.inputLabel}>Họ tên phụ huynh</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ví dụ: Nguyễn Thị Hoa"
                placeholderTextColor="#94A3B8"
                value={parentName}
                onChangeText={setParentName}
              />

              <Text style={styles.inputLabel}>Số điện thoại phụ huynh</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ví dụ: 0901 234 567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={parentPhone}
                onChangeText={setParentPhone}
              />

              <Text style={styles.inputLabel}>Ghi chú ban đầu</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Ví dụ: Chủ động phát biểu, chăm ngoan..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}>
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalSubmitBtn,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleAddStudent}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Thêm học sinh</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  homeroomBanner: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
  },
  classroomTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  classroomCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  homeroomBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  homeroomBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  subjectBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerInfoRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerMeta: {
    fontSize: 13,
    color: '#475569',
  },
  bannerStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bannerStatItem: {
    alignItems: 'center',
  },
  bannerStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  tabButtonsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  sectionArea: {
    gap: 12,
  },
  studentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  studentSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 42,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  studentSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  attendanceBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceBtnText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '700',
  },
  addStudentBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStudentBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  studentListGap: {
    gap: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardPressed: {
    opacity: 0.9,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentFullName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentCodeBadge: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  studentMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  studentGuardian: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  removeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoSectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoFieldLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoFieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoFieldDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  deleteClassBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteClassBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
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
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 14,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFormScroll: {
    maxHeight: 380,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalTextarea: {
    height: 72,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    height: 40,
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
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
