import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, type TeachingResourceItem } from '@/api/client';

function getResourceIcon(type?: string): string {
  switch (type?.toUpperCase()) {
    case 'DOCUMENT':
      return '📄';
    case 'PRESENTATION':
      return '📊';
    case 'SPREADSHEET':
      return '📈';
    case 'IMAGE':
      return '🖼️';
    case 'VIDEO':
      return '🎥';
    case 'LINK':
      return '🔗';
    default:
      return '📁';
  }
}

function getResourceTypeName(type?: string): string {
  switch (type?.toUpperCase()) {
    case 'DOCUMENT':
      return 'Tài liệu văn bản';
    case 'PRESENTATION':
      return 'Bài giảng trình chiếu';
    case 'SPREADSHEET':
      return 'Bảng tính dữ liệu';
    case 'IMAGE':
      return 'Hình ảnh minh họa';
    case 'VIDEO':
      return 'Video bài giảng';
    case 'LINK':
      return 'Liên kết ngoài';
    default:
      return 'Học liệu khác';
  }
}

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [resource, setResource] = useState<TeachingResourceItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      setLoading(true);
      const res = await apiClient.getResourceById(id);
      setResource(res);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải chi tiết tài nguyên',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!id) return;
      try {
        setErrorMessage(null);
        setLoading(true);
        const res = await apiClient.getResourceById(id);
        if (isMounted) {
          setResource(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải chi tiết tài nguyên',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleOpenOrDownload = async () => {
    if (!id || !resource) return;

    if (resource.externalUrl || resource.fileUrl) {
      const targetUrl = resource.externalUrl || resource.fileUrl;
      if (targetUrl) {
        const canOpen = await Linking.canOpenURL(targetUrl);
        if (canOpen) {
          Linking.openURL(targetUrl);
        } else {
          Alert.alert('Lỗi', 'Không thể mở liên kết này');
        }
        return;
      }
    }

    if (resource.storedFileName) {
      const downloadUrl = apiClient.getResourceDownloadUrl(id);
      Linking.openURL(downloadUrl);
    }
  };

  const handleDelete = () => {
    if (!id || !resource) return;
    Alert.alert(
      'Xóa tài nguyên',
      `Bạn có chắc chắn muốn xóa "${resource.title || resource.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteResource(id);
              Alert.alert('Thành công', 'Đã xóa tài nguyên thành công', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Lỗi khi xóa tài nguyên';
              Alert.alert('Lỗi', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải tài nguyên...</Text>
      </View>
    );
  }

  if (errorMessage || !resource) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errIcon}>⚠️</Text>
        <Text style={styles.errTitle}>Lỗi tải dữ liệu</Text>
        <Text style={styles.errText}>{errorMessage || 'Không tìm thấy tài nguyên'}</Text>
        <Pressable style={styles.retryBtn} onPress={fetchDetail}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const icon = getResourceIcon(resource.resourceType);
  const typeName = getResourceTypeName(resource.resourceType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Box */}
      <View style={styles.card}>
        <View style={styles.iconCenterRow}>
          <View style={styles.largeIconBox}>
            <Text style={styles.largeIconText}>{icon}</Text>
          </View>
        </View>

        <Text style={styles.resourceTitle}>{resource.title || resource.name}</Text>

        <View style={styles.badgesRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeName}</Text>
          </View>

          {resource.subjectName ? (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>{resource.subjectName}</Text>
            </View>
          ) : null}

          {resource.gradeName ? (
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{resource.gradeName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* File Metadata Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kích thước:</Text>
          <Text style={styles.infoValue}>{resource.formattedSize || resource.meta || 'Không rõ'}</Text>
        </View>

        {resource.originalFileName ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên tệp gốc:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {resource.originalFileName}
            </Text>
          </View>
        ) : null}

        {resource.createdAt ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tải lên:</Text>
            <Text style={styles.infoValue}>{resource.createdAt.split('T')[0]}</Text>
          </View>
        ) : null}
      </View>

      {/* Description & Lesson relation Card */}
      {resource.description || resource.lessonTitle ? (
        <View style={styles.card}>
          {resource.description ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>MÔ TẢ HỌC LIỆU</Text>
              <Text style={styles.descText}>{resource.description}</Text>
            </View>
          ) : null}

          {resource.lessonTitle ? (
            <View style={[styles.sectionBlock, { marginTop: 10 }]}>
              <Text style={styles.sectionHeading}>GIÁO ÁN / BÀI HỌC LIÊN KẾT</Text>
              <View style={styles.lessonBox}>
                <Text style={styles.lessonIcon}>📖</Text>
                <Text style={styles.lessonTitleText}>{resource.lessonTitle}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionCard}>
        <Pressable style={styles.primaryActionBtn} onPress={handleOpenOrDownload}>
          <Text style={styles.primaryActionText}>
            {resource.resourceType === 'LINK' || resource.externalUrl
              ? '🌐 Mở liên kết ngoài'
              : '📥 Tải xuống / Xem tập tin'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text style={styles.deleteBtnText}>🗑️ Xóa tài nguyên</Text>
          )}
        </Pressable>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCenterRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  largeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  largeIconText: {
    fontSize: 32,
  },
  resourceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  subjectBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  gradeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  sectionBlock: {
    gap: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  descText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  lessonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8,
  },
  lessonIcon: {
    fontSize: 18,
  },
  lessonTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    flex: 1,
  },
  actionCard: {
    gap: 10,
  },
  primaryActionBtn: {
    height: 48,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    height: 44,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
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
});
