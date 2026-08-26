import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Typography } from '@/theme';
import { BrandMark } from './BrandMark';

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish?: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const insets = useSafeAreaInsets();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);

  // Animation values
  const [splashOpacity] = useState(() => new Animated.Value(1));
  const [logoScale] = useState(() => new Animated.Value(0.84));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [ringsScale] = useState(() => new Animated.Value(0.8));
  const [ringsOpacity] = useState(() => new Animated.Value(0));
  const [titleOpacity] = useState(() => new Animated.Value(0));
  const [titleTranslateY] = useState(() => new Animated.Value(10));
  const [subtitleOpacity] = useState(() => new Animated.Value(0));
  const [footerOpacity] = useState(() => new Animated.Value(0));

  // Check reduced motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReducedMotion(enabled);
    });
  }, []);

  // Entrance Animation Sequence
  useEffect(() => {
    if (reducedMotion) {
      splashOpacity.setValue(1);
      logoScale.setValue(1);
      logoOpacity.setValue(1);
      ringsScale.setValue(1);
      ringsOpacity.setValue(1);
      titleOpacity.setValue(1);
      titleTranslateY.setValue(0);
      subtitleOpacity.setValue(1);
      footerOpacity.setValue(1);
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start(() => {
        setEntranceDone(true);
      });
      return;
    }

    // Phase A: Rings & Logo entrance
    Animated.parallel([
      Animated.timing(ringsOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(ringsScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase B & C: Title & Subtitle & Footer
      Animated.sequence([
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setEntranceDone(true);
      });
    });
  }, [
    reducedMotion,
    splashOpacity,
    logoScale,
    logoOpacity,
    ringsScale,
    ringsOpacity,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    footerOpacity,
  ]);

  // Exit Animation when isReady & entrance is finished
  useEffect(() => {
    if (isReady && entranceDone) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }
  }, [isReady, entranceDone, splashOpacity, onFinish]);

  return (
    <Animated.View
      style={[
        styles.splashContainer,
        {
          opacity: splashOpacity,
        },
      ]}
      pointerEvents={isReady && entranceDone ? 'none' : 'auto'}>
      <StatusBar style="light" />

      {/* Decorative Radial Background Rings */}
      <Animated.View
        style={[
          styles.ringsWrapper,
          {
            opacity: ringsOpacity,
            transform: [{ scale: ringsScale }],
          },
        ]}>
        <View style={styles.outerRing} />
        <View style={styles.innerRing} />
      </Animated.View>

      {/* Center Branding Group */}
      <View style={styles.centerGroup}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}>
          <BrandMark size="splash" />
        </Animated.View>

        <Animated.View
          style={[
            styles.textCol,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}>
          <Text style={styles.titleText}>TeachFlow</Text>

          <Animated.Text
            style={[
              styles.subtitleText,
              {
                opacity: subtitleOpacity,
              },
            ]}>
            Trợ lý số dành cho giáo viên
          </Animated.Text>
        </Animated.View>
      </View>

      {/* Footer Copyright Area */}
      <Animated.View
        style={[
          styles.footerWrapper,
          {
            opacity: footerOpacity,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}>
        <View style={styles.divider} />
        <Text style={styles.copyrightText}>© Nguyễn Đỗ Hoan</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.splashBackground,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  ringsWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(94, 224, 189, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(94, 224, 189, 0.06)',
  },
  innerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(94, 224, 189, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(94, 224, 189, 0.1)',
  },
  centerGroup: {
    alignItems: 'center',
    gap: Spacing.lg,
    zIndex: 10,
  },
  textCol: {
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    ...Typography.titleLarge,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brandTextOnDark,
    letterSpacing: -0.5,
  },
  subtitleText: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.brandTextMutedOnDark,
    letterSpacing: 0.2,
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  divider: {
    width: '100%',
    maxWidth: 240,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.copyrightOnDark,
    letterSpacing: 0.3,
  },
});
