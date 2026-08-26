import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '@/context/drawer-context';
import { Colors, Radius, Spacing } from '@/theme';

const BUTTON_SIZE = 52;
const MARGIN = 16;
const DRAG_THRESHOLD = 6;

export function FloatingAiAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDrawerOpen, isAccountOpen, isNotifOpen } = useDrawer();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isSnappingLeft, setIsSnappingLeft] = useState(false);

  // Position animated value
  const [pan] = useState(() => new Animated.ValueXY());

  // Initialize PanResponder without accessing refs during render
  const [panResponder] = useState(() => {
    let lastX = 0;
    let lastY = 0;
    let dragging = false;

    // Track latest position
    pan.addListener((p) => {
      lastX = p.x;
      lastY = p.y;
    });

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > DRAG_THRESHOLD ||
          Math.abs(gestureState.dy) > DRAG_THRESHOLD
        );
      },
      onPanResponderGrant: () => {
        dragging = false;
        pan.setOffset({ x: lastX, y: lastY });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (
          Math.abs(gestureState.dx) > DRAG_THRESHOLD ||
          Math.abs(gestureState.dy) > DRAG_THRESHOLD
        ) {
          dragging = true;
          setShowTooltip(false);
        }
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        const movedDist = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy,
        );

        if (movedDist < DRAG_THRESHOLD && !dragging) {
          router.push('/ai');
          return;
        }

        const win = Dimensions.get('window');
        const minX = MARGIN;
        const maxX = win.width - BUTTON_SIZE - MARGIN;
        const minY = 44 + MARGIN;
        const maxY = win.height - 34 - BUTTON_SIZE - MARGIN;

        const currentX = lastX;
        const currentY = lastY;

        const snapLeft = currentX + BUTTON_SIZE / 2 < win.width / 2;
        const targetX = snapLeft ? minX : maxX;
        const targetY = Math.max(minY, Math.min(maxY, currentY));

        setIsSnappingLeft(snapLeft);

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 6,
          tension: 40,
        }).start();
      },
    });
  });

  // Initial placement: bottom right, above safe area
  useEffect(() => {
    const win = Dimensions.get('window');
    const defaultX = win.width - (insets.right || 0) - BUTTON_SIZE - MARGIN;
    const defaultY = win.height - (insets.bottom || 0) - BUTTON_SIZE - 24;
    pan.setValue({ x: defaultX, y: defaultY });
  }, [insets, pan]);

  // Keyboard listener to hide or move button
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Tooltip auto-hide timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Don't render on AI screens, auth screens, when keyboard is active, or when modals/drawer are open
  const isAiScreen = pathname.includes('/ai');
  const isAuthScreen = pathname.includes('/login') || pathname.includes('/register');
  const isModalOrDrawerActive = isDrawerOpen || isAccountOpen || isNotifOpen;

  if (isAiScreen || isAuthScreen || isKeyboardVisible || isModalOrDrawerActive) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Expanded Tooltip / Hint */}
        {showTooltip && (
          <Pressable
            style={[
              styles.tooltip,
              isSnappingLeft ? styles.tooltipRight : styles.tooltipLeft,
            ]}
            onPress={() => {
              setShowTooltip(false);
              router.push('/ai');
            }}>
            <Text style={styles.tooltipText}>✨ Trợ lý AI</Text>
          </Pressable>
        )}

        {/* Floating Circle Button */}
        <View
          style={styles.floatingButton}
          accessibilityRole="button"
          accessibilityLabel="Mở Trợ lý AI">
          <Text style={styles.buttonIcon}>✨</Text>
          <View style={styles.badgeDot} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  floatingButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  buttonIcon: {
    fontSize: 22,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5EE0BD',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 90,
    alignItems: 'center',
  },
  tooltipLeft: {
    right: BUTTON_SIZE + 8,
  },
  tooltipRight: {
    left: BUTTON_SIZE + 8,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
