// Premium App Theme - Designed for engagement and delight
// Psychology: Warm colors trigger attraction, dark backgrounds create intimacy,
// gradients add energy and movement, generous spacing feels luxurious

export const colors = {
  // Primary palette - Passionate coral to rose gradient
  primary: '#FF6B6B',
  primaryDark: '#E85D75',
  primaryLight: '#FF8E8E',
  primaryMuted: 'rgba(255, 107, 107, 0.15)',

  // Secondary palette - Electric violet for special moments
  secondary: '#8B5CF6',
  secondaryDark: '#7C3AED',
  secondaryLight: '#A78BFA',
  secondaryMuted: 'rgba(139, 92, 246, 0.15)',

  // Accent - Golden warmth for highlights
  accent: '#F59E0B',
  accentLight: '#FBBF24',
  accentMuted: 'rgba(245, 158, 11, 0.15)',

  // Background - Deep, intimate dark tones
  background: '#09090B',
  backgroundElevated: '#18181B',
  backgroundCard: '#1F1F23',
  surface: '#27272A',
  surfaceLight: '#3F3F46',
  surfaceLighter: '#52525B',

  // Text - Warm whites for better readability
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textSubtle: '#52525B',

  // Status - Vibrant and clear
  success: '#10B981',
  successLight: '#34D399',
  successMuted: 'rgba(16, 185, 129, 0.15)',

  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningMuted: 'rgba(245, 158, 11, 0.15)',

  error: '#EF4444',
  errorLight: '#F87171',
  errorMuted: 'rgba(239, 68, 68, 0.15)',

  // Actions - Clear visual language
  like: '#10B981',
  likeGlow: 'rgba(16, 185, 129, 0.4)',
  pass: '#71717A',
  superLike: '#8B5CF6',
  superLikeGlow: 'rgba(139, 92, 246, 0.4)',

  // Overlays & Effects
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  overlayDark: 'rgba(0, 0, 0, 0.85)',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassStroke: 'rgba(255, 255, 255, 0.1)',

  // Gradients (as array for LinearGradient)
  gradientPrimary: ['#FF6B6B', '#E85D75', '#D946EF'],
  gradientSecondary: ['#8B5CF6', '#6366F1'],
  gradientSuccess: ['#10B981', '#059669'],
  gradientWarm: ['#FF6B6B', '#F59E0B'],
  gradientCard: ['rgba(39, 39, 42, 0.8)', 'rgba(24, 24, 27, 0.9)'],
  gradientOverlay: ['transparent', 'rgba(0, 0, 0, 0.8)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Premium shadow effects
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }),
  cardFloat: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
    xxxl: 34,
    hero: 42,
    display: 56,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// Animation timings for consistent feel
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 100,
    mass: 0.8,
  },
};

// Haptic feedback patterns
export const haptics = {
  light: 'light' as const,
  medium: 'medium' as const,
  heavy: 'heavy' as const,
  success: 'success' as const,
  warning: 'warning' as const,
  error: 'error' as const,
};

// Common component styles
export const components = {
  button: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  input: {
    height: 56,
    paddingHorizontal: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  avatar: {
    sm: 40,
    md: 56,
    lg: 80,
    xl: 120,
  },
};
