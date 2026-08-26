/**
 * TeachFlow Mobile Design Tokens
 * Harmonized with TeachFlow Web Design System
 */

export const Colors = {
  // Brand Colors
  primary: '#0284C7',
  primaryDark: '#0369A1',
  primaryLight: '#38BDF8',
  primaryBg: '#F0F9FF',
  primaryBorder: '#BAE6FD',

  brandTeal: '#103C36',
  brandTealDark: '#0B2C27',
  brandTealLight: '#164E46',
  brandMint: '#5EE0BD',
  brandMintDark: '#10B981',
  brandMintLight: '#A7F3D0',
  brandDark: '#103C36',

  // Splash & Identity Specific Tokens
  splashBackground: '#103C36',
  splashAccentGlow: 'rgba(94, 224, 189, 0.12)',
  brandTextOnDark: '#FFFFFF',
  brandTextMutedOnDark: '#A7F3D0',
  copyrightOnDark: 'rgba(255, 255, 255, 0.65)',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceActive: '#E0F2FE',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textLink: '#0284C7',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  borderDark: '#94A3B8',

  // Status & Semantic Feedback
  success: '#059669',
  successDark: '#047857',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',

  warning: '#D97706',
  warningDark: '#B45309',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',

  info: '#0284C7',
  infoBg: '#F0F9FF',
  infoBorder: '#BAE6FD',

  purple: '#7E22CE',
  purpleBg: '#F3E8FF',
  purpleBorder: '#E9D5FF',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const Typography = {
  titleLarge: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bodySmall: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  labelBold: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
};
