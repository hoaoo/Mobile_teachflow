import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface AiActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  onPress: () => void;
}

function AiActionCard({
  icon,
  title,
  subtitle,
  tag,
  tagColor,
  onPress,
}: AiActionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={[styles.tagBadge, { backgroundColor: tagColor + '15' }]}>
          <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function AiHubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>✨ Trí tuệ Nhân tạo Sư phạm</Text>
          </View>
          <Text style={styles.bannerTitle}>Trợ lý Giáo viên TeachFlow</Text>
          <Text style={styles.bannerDesc}>
            Công cụ hỗ trợ soạn bài, gợi ý phương pháp, thiết kế bài tập và nhận xét học sinh chuẩn định hướng GDPT Việt Nam.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            💡 <Text style={styles.disclaimerBold}>Lưu ý:</Text> Nội dung do AI gợi ý mang tính chất tham khảo sư phạm. Thầy/Cô hãy kiểm tra và chỉnh sửa phù hợp trước khi áp dụng.
          </Text>
        </View>

        {/* Grid Tasks */}
        <Text style={styles.sectionHeading}>TÁC VỤ SƯ PHẠM THƯỜNG DÙNG</Text>

        <View style={styles.grid}>
          {/* Chat */}
          <AiActionCard
            icon="💬"
            title="Hỏi đáp Sư phạm"
            subtitle="Trao đổi, giải đáp tình huống giảng dạy và phương pháp giáo dục"
            tag="Tương tác"
            tagColor={Colors.primary}
            onPress={() => router.push('/(app)/ai/chat')}
          />

          {/* Lesson Plan */}
          <AiActionCard
            icon="📖"
            title="Soạn Giáo án AI"
            subtitle="Kế hoạch bài dạy chi tiết với mục tiêu, thiết bị và các hoạt động"
            tag="Kế hoạch"
            tagColor={Colors.brandTeal}
            onPress={() => router.push('/(app)/lesson-plans/create')}
          />

          {/* Activity */}
          <AiActionCard
            icon="🎯"
            title="Hoạt động Dạy học"
            subtitle="Thiết kế Khởi động, Khám phá, Luyện tập & Vận dụng sinh động"
            tag="Phương pháp"
            tagColor="#E11D48"
            onPress={() => router.push('/(app)/ai/activity')}
          />

          {/* Worksheet */}
          <AiActionCard
            icon="📑"
            title="Phiếu Bài tập AI"
            subtitle="Tạo phiếu học tập trắc nghiệm & tự luận kèm hướng dẫn giải"
            tag="Luyện tập"
            tagColor="#7C3AED"
            onPress={() => router.push('/(app)/worksheets/create')}
          />

          {/* Student Comment */}
          <AiActionCard
            icon="✍️"
            title="Gợi ý Nhận xét Học sinh"
            subtitle="Nhận xét sự tiến bộ, ưu điểm và gợi ý rèn luyện chuẩn mực"
            tag="Đánh giá"
            tagColor="#D97706"
            onPress={() => router.push('/(app)/ai/student-comment')}
          />

          {/* Homeroom Summary */}
          <AiActionCard
            icon="🌟"
            title="Báo cáo Nề nếp Chủ nhiệm"
            subtitle="Tổng hợp tình hình chuyên cần, nề nếp và học tập theo tuần/tháng"
            tag="Chủ nhiệm"
            tagColor="#059669"
            onPress={() => router.push('/(app)/ai/homeroom-summary')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  banner: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  bannerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  bannerTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    fontSize: 20,
    marginBottom: 6,
  },
  bannerDesc: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  disclaimerBold: {
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  grid: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: Colors.surfaceMuted,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  tagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
