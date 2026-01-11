// App theme constants
export const colors = {
  // Primary palette - warm coral/rose
  primary: '#E85D75',
  primaryDark: '#C94B61',
  primaryLight: '#FF8A9E',
  
  // Secondary palette - deep purple
  secondary: '#6C5CE7',
  secondaryDark: '#5849C4',
  secondaryLight: '#A29BFE',
  
  // Background
  background: '#0F0F1A',
  backgroundSecondary: '#1A1A2E',
  surface: '#252542',
  surfaceLight: '#2F2F4A',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B8B8D0',
  textMuted: '#6B6B85',
  
  // Status
  success: '#00D9A5',
  warning: '#FFB84D',
  error: '#FF6B6B',
  
  // Actions
  like: '#4ECDC4',
  pass: '#95A5A6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    hero: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
