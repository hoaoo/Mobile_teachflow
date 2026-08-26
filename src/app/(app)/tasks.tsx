import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { apiClient, type TeacherTaskItem } from '@/api/client';
import { AppHeader } from '@/components/AppHeader';
import { TeachFlowLoader } from '@/components/branding/TeachFlowLoader';

function formatDisplayDate(date = new Date()): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

type TaskFilterStatus = 'ALL' | 'PENDING' | 'COMPLETED';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TeacherTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status Filter
  const [filterStatus, setFilterStatus] = useState<TaskFilterStatus>('ALL');

  // Mutation IDs (to prevent spamming toggle on individual task)
  const [mutatingTaskIds, setMutatingTaskIds] = useState<Record<string, boolean>>({});

  // Add/Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TeacherTaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDue, setTaskDue] = useState<string>('Hôm nay');
  const [taskDone, setTaskDone] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // 1. Fetch Tasks from Backend
  const loadTasks = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage(null);
      if (!isRefresh) setLoading(true);
      const res = await apiClient.getTasks();
      setTasks(res || []);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách công việc',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getTasks();
        if (isMounted) {
          setTasks(res || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách công việc',
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
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks(true);
  }, [loadTasks]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE TASK STATUS (Optimistic UI with Rollback)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleToggleTask = async (task: TeacherTaskItem) => {
    if (mutatingTaskIds[task.id]) return;

    const newDoneState = !task.done;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, done: newDoneState } : t,
      ),
    );

    setMutatingTaskIds((prev) => ({ ...prev, [task.id]: true }));

    try {
      const updated = await apiClient.updateTask(task.id, { done: newDoneState });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updated : t)),
      );
    } catch (err: unknown) {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)),
      );
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái';
      Alert.alert('Lỗi', msg);
    } finally {
      setMutatingTaskIds((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE / EDIT TASK
  // ═══════════════════════════════════════════════════════════════════════════

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDue('Hôm nay');
    setTaskDone(false);
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (task: TeacherTaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDue(task.due || 'Hôm nay');
    setTaskDone(task.done);
    setModalError(null);
    setShowModal(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) {
      setModalError('Vui lòng nhập nội dung công việc');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingTask) {
        const updated = await apiClient.updateTask(editingTask.id, {
          title: taskTitle.trim(),
          due: taskDue.trim() || undefined,
          done: taskDone,
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updated : t)),
        );
      } else {
        const created = await apiClient.createTask({
          title: taskTitle.trim(),
          due: taskDue.trim() || undefined,
          done: taskDone,
        });
        setTasks((prev) => [...prev, created]);
      }

      setShowModal(false);
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : 'Không thể lưu công việc',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE TASK
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDeleteTask = (task: TeacherTaskItem) => {
    Alert.alert(
      'Xóa công việc',
      `Bạn có chắc chắn muốn xóa "${task.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteTask(task.id);
              setTasks((prev) => prev.filter((t) => t.id !== task.id));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Không thể xóa công việc';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ],
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.done).length;
  const pendingTasks = totalTasks - completedTasks;
  const percentDone = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'PENDING') return tasks.filter((t) => !t.done);
    if (filterStatus === 'COMPLETED') return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filterStatus]);

  const renderTaskItem = ({ item }: { item: TeacherTaskItem }) => {
    const isMutating = Boolean(mutatingTaskIds[item.id]);

    return (
      <View style={[styles.taskCard, item.done && styles.taskCardDone]}>
        {/* Checkbox */}
        <Pressable
          style={[styles.checkbox, item.done && styles.checkboxDone]}
          onPress={() => handleToggleTask(item)}
          disabled={isMutating}
          hitSlop={8}>
          {isMutating ? (
            <ActivityIndicator size="small" color="#0284C7" />
          ) : item.done ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : null}
        </Pressable>

        {/* Task Content */}
        <Pressable
          style={styles.taskInfo}
          onPress={() => handleToggleTask(item)}>
          <Text
            style={[
              styles.taskTitle,
              item.done && styles.taskTitleDone,
            ]}>
            {item.title}
          </Text>
          <View style={styles.taskMetaRow}>
            <Text style={styles.taskDue}>⏰ {item.due || 'Hôm nay'}</Text>
            {item.taskDate ? (
              <Text style={styles.taskDateTag}>📅 {item.taskDate}</Text>
            ) : null}
          </View>
        </Pressable>

        {/* Actions (Edit / Delete) */}
        <View style={styles.taskActionsRow}>
          <Pressable
            style={styles.taskActionBtn}
            onPress={() => openEditModal(item)}
            hitSlop={8}>
            <Text style={styles.taskActionIcon}>✏️</Text>
          </Pressable>

          <Pressable
            style={styles.taskActionBtn}
            onPress={() => handleDeleteTask(item)}
            hitSlop={8}>
            <Text style={styles.taskActionIcon}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppHeader title="Nhiệm vụ" subtitle={formatDisplayDate()} />

      {/* Action Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>Danh sách công việc</Text>
            <Text style={styles.headerDate}>Nhiệm vụ giảng dạy & hành chính</Text>
          </View>

          <Pressable style={styles.addTaskBtn} onPress={openCreateModal}>
            <Text style={styles.addTaskBtnText}>＋ Thêm việc</Text>
          </Pressable>
        </View>

        {/* Progress Card */}
        {totalTasks > 0 ? (
          <View style={styles.progressCard}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTitle}>Tiến độ hôm nay</Text>
              <Text style={styles.progressPercent}>
                {completedTasks}/{totalTasks} việc ({percentDone}%)
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
          </View>
        ) : null}

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterChip,
              filterStatus === 'ALL' && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus('ALL')}>
            <Text
              style={[
                styles.filterChipText,
                filterStatus === 'ALL' && styles.filterChipTextActive,
              ]}>
              Tất cả ({totalTasks})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              filterStatus === 'PENDING' && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus('PENDING')}>
            <Text
              style={[
                styles.filterChipText,
                filterStatus === 'PENDING' && styles.filterChipTextActive,
              ]}>
              Chưa xong ({pendingTasks})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              filterStatus === 'COMPLETED' && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus('COMPLETED')}>
            <Text
              style={[
                styles.filterChipText,
                filterStatus === 'COMPLETED' && styles.filterChipTextActive,
              ]}>
              Đã xong ({completedTasks})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Task List */}
      {loading && !refreshing ? (
        <TeachFlowLoader variant="fullscreen" label="Đang tải công việc..." />
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errTitle}>Không thể tải danh sách</Text>
          <Text style={styles.errText}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadTasks()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>
            {filterStatus === 'COMPLETED'
              ? 'Chưa có công việc nào hoàn thành'
              : filterStatus === 'PENDING'
                ? 'Tuyệt vời! Không còn công việc tồn đọng'
                : 'Hôm nay bạn chưa có công việc nào'}
          </Text>
          <Text style={styles.emptySubtitle}>
            Hệ thống tự động lưu trữ và làm mới danh sách công việc vào 00:00 hàng ngày.
          </Text>
          {filterStatus === 'ALL' ? (
            <Pressable style={styles.createTaskBtn} onPress={openCreateModal}>
              <Text style={styles.createTaskBtnText}>＋ Thêm công việc mới</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
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

      {/* Create / Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Cập nhật công việc' : 'Thêm công việc mới'}
            </Text>
            <Text style={styles.modalSubtitle}>Nhiệm vụ trong ngày hôm nay</Text>

            {modalError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            ) : null}

            {/* Title Input */}
            <Text style={styles.inputLabel}>Nội dung công việc *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Ví dụ: Soạn giáo án Tiếng Việt Tuần 4, Chấm bài kiểm tra..."
              placeholderTextColor="#94A3B8"
              value={taskTitle}
              onChangeText={setTaskTitle}
              multiline
              numberOfLines={3}
            />

            {/* Due Input */}
            <Text style={styles.inputLabel}>Thời gian / Hạn hoàn thành</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Hôm nay, 14:00, Trước tiết 3..."
              placeholderTextColor="#94A3B8"
              value={taskDue}
              onChangeText={setTaskDue}
            />

            {/* Done Toggle */}
            <Pressable
              style={styles.modalDoneToggle}
              onPress={() => setTaskDone((prev) => !prev)}>
              <View style={[styles.checkbox, taskDone && styles.checkboxDone]}>
                {taskDone ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.modalDoneText}>Đánh dấu đã hoàn thành</Text>
            </Pressable>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowModal(false)}
                disabled={isSubmitting}>
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalSubmitBtn,
                  isSubmitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSaveTask}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>
                    {editingTask ? 'Lưu cập nhật' : 'Tạo công việc'}
                  </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  addTaskBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  progressCard: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskCardDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.85,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  taskDue: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  taskDateTag: {
    fontSize: 11,
    color: '#94A3B8',
  },
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  taskActionBtn: {
    padding: 6,
  },
  taskActionIcon: {
    fontSize: 15,
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
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  createTaskBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    maxHeight: '80%',
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
    marginBottom: 12,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
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
  modalDoneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  modalDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
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
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
