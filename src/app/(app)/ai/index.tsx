import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface ActionGridCardProps {
  icon: string;
  title: string;
  desc: string;
  tag?: string;
  tagColor?: string;
  onPress: () => void;
}

function ActionGridCard({
  icon,
  title,
  desc,
  tag,
  tagColor,
  onPress,
}: ActionGridCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
      onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        {tag && (
          <View style={[styles.tagBadge, { backgroundColor: (tagColor || Colors.primary) + '15' }]}>
            <Text style={[styles.tagText, { color: tagColor || Colors.primary }]}>{tag}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{desc}</Text>
    </Pressable>
  );
}

interface HomeroomActionCardProps {
  icon: string;
  title: string;
  desc: string;
  onPress: () => void;
}

function HomeroomActionCard({
  icon,
  title,
  desc,
  onPress,
}: HomeroomActionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fullCard, pressed && styles.cardPressed]}
      onPress={onPress}>
      <View style={styles.fullCardLeft}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.fullCardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{desc}</Text>
        </View>
      </View>
      <Text style={styles.cardArrow}>→</Text>
    </Pressable>
  );
}

export default function AiHomeScreen() {
  const router = useRouter();
  const [queryText, setQueryText] = useState('');

  const handleAskQuick = () => {
    Keyboard.dismiss();
    const query = queryText.trim();
    if (query) {
      router.push('/ai/chat');
    } else {
      router.push('/ai/chat');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>Trợ lý AI</Text>
          <Text style={styles.headerSubtitle}>Hỗ trợ công việc giảng dạy của bạn</Text>
        </View>

        {/* Quick Query Bar */}
        <View style={styles.quickQueryCard}>
          <TextInput
            style={styles.queryInput}
            placeholder="Bạn muốn AI hỗ trợ gì hôm nay?"
            placeholderTextColor={Colors.textMuted}
            value={queryText}
            onChangeText={setQueryText}
            onSubmitEditing={handleAskQuick}
            returnKeyType="search"
          />
          <Pressable
            style={({ pressed }) => [
              styles.querySubmitBtn,
              pressed && styles.querySubmitBtnPressed,
            ]}
            onPress={handleAskQuick}>
            <Text style={styles.querySubmitText}>Hỏi AI →</Text>
          </Pressable>
        </View>

        {/* Section 1: Gợi ý nhanh / Soạn giảng & Học liệu */}
        <Text style={styles.sectionHeading}>GỢI Ý NHANH</Text>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <ActionGridCard
              icon="✨"
              title="Soạn giáo án"
              desc="Kế hoạch bài dạy chuẩn GDPT"
              tag="Kế hoạch"
              tagColor={Colors.primary}
              onPress={() => router.push('/lesson-plans/create')}
            />
          </View>
          <View style={styles.gridCol}>
            <ActionGridCard
              icon="💡"
              title="Hoạt động DH"
              desc="Khởi động, khám phá, luyện tập"
              tag="Phương pháp"
              tagColor={Colors.brandTeal}
              onPress={() => router.push('/ai/activity')}
            />
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <ActionGridCard
              icon="📝"
              title="Tạo phiếu BT"
              desc="Phiếu học tập và đề ôn tập"
              tag="Luyện tập"
              tagColor="#7C3AED"
              onPress={() => router.push('/worksheets/create')}
            />
          </View>
          <View style={styles.gridCol}>
            <ActionGridCard
              icon="❓"
              title="Tạo câu hỏi"
              desc="Ngân hàng câu hỏi thang Bloom"
              tag="Đánh giá"
              tagColor="#E11D48"
              onPress={() => router.push('/ai/questions')}
            />
          </View>
        </View>

        {/* Section 2: Dành cho chủ nhiệm */}
        <Text style={styles.sectionHeading}>DÀNH CHO CHỦ NHIỆM</Text>
        <View style={styles.listStack}>
          <HomeroomActionCard
            icon="🌟"
            title="Gợi ý nhận xét học sinh"
            desc="Nhận xét sự tiến bộ, ưu điểm & rèn luyện chuẩn mực"
            onPress={() => router.push('/ai/student-comment')}
          />

          <HomeroomActionCard
            icon="📊"
            title="Nhận xét tuần / Báo cáo tháng"
            desc="Tự động tổng hợp số liệu chuyên cần, nề nếp & học tập"
            onPress={() => router.push('/ai/homeroom-summary')}
          />
        </View>

        {/* Section 3: Trợ lý chung */}
        <Text style={styles.sectionHeading}>TRỢ LÝ CHUNG</Text>
        <HomeroomActionCard
          icon="💬"
          title="Hỏi TeachFlow"
          desc="Trao đổi, giải đáp thắc mắc phương pháp và tình huống sư phạm"
          onPress={() => router.push('/ai/chat')}
        />

        {/* Disclaimer Footer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            💡 <Text style={styles.disclaimerBold}>Lưu ý:</Text> Nội dung do AI gợi ý mang tính chất tham khảo sư phạm. Vui lòng kiểm tra trước khi sử dụng.
          </Text>
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
    gap: Spacing.md,
  },
  headerBlock: {
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.titleLarge,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickQueryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.sm,
  },
  queryInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  querySubmitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  querySubmitBtnPressed: {
    opacity: 0.85,
  },
  querySubmitText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 116,
    justifyContent: 'space-between',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: Colors.surfaceMuted,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  tagBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    ...Typography.titleSmall,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  listStack: {
    gap: Spacing.sm,
  },
  fullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  fullCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  fullCardContent: {
    flex: 1,
  },
  cardArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  disclaimerBold: {
    fontWeight: '700',
  },
});
