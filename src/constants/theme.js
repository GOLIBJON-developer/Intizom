// Linear-inspired design system — Intizom
// Dark: deep space + violet energy | Light: soft lavender + deep violet

export const darkTheme = {
  bg:            '#0A0A0F',
  bgSecondary:   '#111118',
  card:          '#16161F',
  cardElevated:  '#1E1E2A',
  cardBorder:    '#2A2A3A',
  accent:        '#7C3AED',
  accentLight:   '#A78BFA',
  accentDim:     '#4C1D95',
  accentGlow:    'rgba(124, 58, 237, 0.25)',
  accentGlowHot: 'rgba(124, 58, 237, 0.55)',
  text:          '#F0EEFF',
  textSecondary: '#8B85A0',
  textMuted:     '#4A4560',
  success:       '#10B981',
  successBg:     'rgba(16, 185, 129, 0.12)',
  warning:       '#F59E0B',
  warningBg:     'rgba(245, 158, 11, 0.12)',
  danger:        '#EF4444',
  dangerBg:      'rgba(239, 68, 68, 0.12)',
  white:         '#FFFFFF',
  black:         '#000000',
  overlay:       'rgba(0,0,0,0.6)',
  separator:     'rgba(255,255,255,0.06)',
  isDark: true,
};

export const lightTheme = {
  bg:            '#F4F2FF',
  bgSecondary:   '#EDE9FA',
  card:          '#FFFFFF',
  cardElevated:  '#F9F7FF',
  cardBorder:    '#DDD6F3',
  accent:        '#6D28D9',
  accentLight:   '#7C3AED',
  accentDim:     '#EDE9FA',
  accentGlow:    'rgba(109, 40, 217, 0.12)',
  accentGlowHot: 'rgba(109, 40, 217, 0.30)',
  text:          '#1A0533',
  textSecondary: '#5B4B8A',
  textMuted:     '#9B8EC4',
  success:       '#059669',
  successBg:     'rgba(5, 150, 105, 0.08)',
  warning:       '#D97706',
  warningBg:     'rgba(217, 119, 6, 0.08)',
  danger:        '#DC2626',
  dangerBg:      'rgba(220, 38, 38, 0.08)',
  white:         '#FFFFFF',
  black:         '#000000',
  overlay:       'rgba(0,0,0,0.35)',
  separator:     'rgba(0,0,0,0.07)',
  isDark: false,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radius = {
  sm:   6,
  md:   12,
  lg:   18,
  xl:   24,
  full: 999,
};

export const typography = {
  // DM Sans for UI
  h1:      { fontFamily: 'DMSans_700Bold',     fontSize: 32, lineHeight: 40 },
  h2:      { fontFamily: 'DMSans_700Bold',     fontSize: 24, lineHeight: 32 },
  h3:      { fontFamily: 'DMSans_600SemiBold', fontSize: 20, lineHeight: 28 },
  title:   { fontFamily: 'DMSans_600SemiBold', fontSize: 17, lineHeight: 24 },
  body:    { fontFamily: 'DMSans_400Regular',  fontSize: 15, lineHeight: 22 },
  bodyMed: { fontFamily: 'DMSans_500Medium',   fontSize: 15, lineHeight: 22 },
  small:   { fontFamily: 'DMSans_400Regular',  fontSize: 13, lineHeight: 18 },
  smallMed:{ fontFamily: 'DMSans_500Medium',   fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: 'DMSans_400Regular',  fontSize: 11, lineHeight: 15 },
  // Space Mono for numbers / timer
  timer:   { fontFamily: 'SpaceMono_700Bold',  fontSize: 48, lineHeight: 56 },
  timerSm: { fontFamily: 'SpaceMono_400Regular',fontSize: 20, lineHeight: 26 },
  mono:    { fontFamily: 'SpaceMono_400Regular',fontSize: 13, lineHeight: 18 },
};
