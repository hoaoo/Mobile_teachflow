import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { BrandMark, type BrandMarkSize } from './BrandMark';

export type LoaderVariant = 'fullscreen' | 'inline' | 'card' | 'ai';

interface TeachFlowLoaderProps {
  variant?: LoaderVariant;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TeachFlowLoader({
  variant = 'fullscreen',
  label,
  size = 'md',
}: TeachFlowLoaderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Animation values
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [haloAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Check reduced motion accessibility
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReducedMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReducedMotion(enabled),
    );

    return () => {
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      pulseAnim.setValue(1);
      haloAnim.setValue(0.5);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    haloLoop.start();

    return () => {
      pulseLoop.stop();
      haloLoop.stop();
    };
  }, [pulseAnim, haloAnim, reducedMotion]);

  let markSize: BrandMarkSize = 'md';
  if (size === 'sm') markSize = 'sm';
  if (size === 'lg') markSize = 'lg';

  const defaultLabel =
    variant === 'ai'
      ? 'TeachFlow AI đang tạo nội dung...'
      : 'Đang tải dữ liệu...';
  const displayLabel = label || defaultLabel;

  const haloScale = haloAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const haloOpacity = haloAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.35, 0.2, 0],
  });

  const content = (
    <View style={styles.contentWrapper}>
      {/* Animated Logo Container with Halo */}
      <View style={styles.logoWrapper}>
        {!reducedMotion && (
          <Animated.View
            style={[
              styles.haloRing,
              {
                transform: [{ scale: haloScale }],
                opacity: haloOpacity,
              },
            ]}
          />
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <BrandMark size={markSize} />
        </Animated.View>
      </View>

      {/* Branded Loading Label */}
      {displayLabel ? (
        <Text
          style={[
            styles.label,
            variant === 'ai' && styles.aiLabel,
          ]}>
          {displayLabel}
        </Text>
      ) : null}
    </View>
  );

  if (variant === 'fullscreen') {
    return <View style={styles.fullscreenContainer}>{content}</View>;
  }

  if (variant === 'card') {
    return <View style={styles.cardContainer}>{content}</View>;
  }

  return <View style={styles.inlineContainer}>{content}</View>;
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.brandMint,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiLabel: {
    color: Colors.brandTealLight,
    fontWeight: '700',
  },
});
