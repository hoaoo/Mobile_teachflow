import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Spacing, Typography } from '@/theme';
import { BrandMark, type BrandMarkSize } from './BrandMark';

interface TeachFlowBrandProps {
  size?: BrandMarkSize;
  theme?: 'light' | 'dark';
  subtitle?: string;
  layout?: 'vertical' | 'horizontal';
  showSubtitle?: boolean;
}

export function TeachFlowBrand({
  size = 'md',
  theme = 'light',
  subtitle = 'Trợ lý số dành cho giáo viên',
  layout = 'vertical',
  showSubtitle = true,
}: TeachFlowBrandProps) {
  const isDark = theme === 'dark';
  const isHorizontal = layout === 'horizontal';

  const titleFontSize =
    size === 'splash' || size === 'lg' ? 24 : size === 'md' ? 20 : 16;
  const subtitleFontSize =
    size === 'splash' || size === 'lg' ? 13 : size === 'md' ? 12 : 10;

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontalContainer : styles.verticalContainer,
      ]}>
      <BrandMark size={size} />

      <View
        style={[
          styles.textGroup,
          isHorizontal ? styles.horizontalTextGroup : styles.verticalTextGroup,
        ]}>
        <Text
          style={[
            styles.title,
            {
              fontSize: titleFontSize,
              color: isDark ? Colors.brandTextOnDark : Colors.textPrimary,
            },
          ]}>
          TeachFlow
        </Text>

        {showSubtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: subtitleFontSize,
                color: isDark ? Colors.brandTextMutedOnDark : Colors.textSecondary,
              },
            ]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  verticalContainer: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  textGroup: {
    justifyContent: 'center',
  },
  verticalTextGroup: {
    alignItems: 'center',
    gap: 3,
  },
  horizontalTextGroup: {
    alignItems: 'flex-start',
    gap: 1,
  },
  title: {
    ...Typography.titleLarge,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    textAlign: 'center',
  },
});
