export const lightColors = {
  primary: '#1F3C34',
  secondary: '#D17934',
  accent: '#D17934',
  danger: '#C9483B',
  warning: '#E08A1E',
  success: '#2E9B5F',
  background: '#F4EFE7',
  surface: '#FFFDF9',
  surfaceAlt: '#F8F3EC',
  surfaceTint: '#E8F1EB',
  glass: 'rgba(255,255,255,0.05)',
  textPrimary: '#1D2A24',
  textSecondary: '#625A4F',
  textMuted: '#8A8174',
  textInverted: '#FFFFFF',
  border: '#E3DACE',
  borderGlow: '#E9E0D4',
};

export const darkColors = {
  primary: '#00D26A',
  secondary: '#EAB308',
  accent: '#00D26A',
  danger: '#FF3B4D',
  warning: '#EAB308',
  success: '#00D26A',
  background: '#141A22',
  surface: '#1D232D',
  surfaceAlt: '#252B35',
  surfaceTint: '#252B35',
  glass: 'rgba(255,255,255,0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#7C8798',
  textInverted: '#FFFFFF',
  border: '#2F3744',
  borderGlow: '#3A4352',
};

export const getThemeColors = (scheme) => (scheme === 'dark' ? darkColors : lightColors);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  heading: {
    fontFamily: 'System',
    fontWeight: '800',
  },
  body: {
    fontFamily: 'System',
    fontWeight: '600',
  },
  label: {
    fontFamily: 'System',
    fontWeight: '700',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
};

export const radius = {
  xs: 6,
  sm: 10,
  btn: 18,
  card: 24,
  lg: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  glow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
};
