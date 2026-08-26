import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { Colors } from '@/theme';

export type BrandMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'splash' | number;

interface BrandMarkProps {
  size?: BrandMarkSize;
  showAccentDot?: boolean;
}

export function BrandMark({ size = 'md', showAccentDot = true }: BrandMarkProps) {
  let dimension = 48;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'xs':
        dimension = 28;
        break;
      case 'sm':
        dimension = 36;
        break;
      case 'md':
        dimension = 48;
        break;
      case 'lg':
        dimension = 64;
        break;
      case 'xl':
        dimension = 76;
        break;
      case 'splash':
        dimension = 88;
        break;
    }
  }

  const borderRadius = Math.round(dimension * 0.34);
  const iconScale = dimension / 48;
  const dotSize = Math.max(7, Math.round(dimension * 0.22));

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius,
        },
      ]}>
      {/* Graduation Cap Vector Shape */}
      <View style={[styles.capWrapper, { transform: [{ scale: iconScale }] }]}>
        {/* Diamond Mortarboard Top */}
        <View style={styles.diamondCap} />

        {/* Skull Cap Lower Base */}
        <View style={styles.capBase} />

        {/* Cap Button / Node */}
        <View style={styles.capButton} />

        {/* Hanging Tassel */}
        <View style={styles.tasselCord} />
        <View style={styles.tasselEnd} />
      </View>

      {/* Brand Accent Dot at Top-Right */}
      {showAccentDot && (
        <View
          style={[
            styles.accentDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              top: -Math.round(dotSize * 0.2),
              right: -Math.round(dotSize * 0.2),
              borderWidth: Math.max(1.5, Math.round(dotSize * 0.2)),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.brandMint,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: Colors.brandMint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  capWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  diamondCap: {
    width: 20,
    height: 20,
    backgroundColor: Colors.brandTeal,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }, { scaleY: 0.58 }],
    position: 'absolute',
    top: 5,
  },
  capBase: {
    width: 14,
    height: 7,
    backgroundColor: Colors.brandTeal,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    position: 'absolute',
    top: 17,
  },
  capButton: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 10,
    zIndex: 3,
  },
  tasselCord: {
    position: 'absolute',
    width: 1.5,
    height: 7,
    backgroundColor: Colors.brandTeal,
    top: 11,
    right: 5,
    transform: [{ rotate: '-25deg' }],
  },
  tasselEnd: {
    position: 'absolute',
    width: 2.5,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    top: 17,
    right: 3.5,
  },
  accentDot: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.brandTeal,
    zIndex: 5,
  },
});
