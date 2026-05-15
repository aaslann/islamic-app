import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const palette = {
  // Brand greens
  green900: '#0A2B1E',
  green800: '#0F3D2E',
  green700: '#145E43',
  green600: '#1A7A56',
  green500: '#1F6E5A',
  green400: '#2D8A70',
  green300: '#4AA88C',
  green200: '#8ECEC0',
  green100: '#D0EDE7',
  green50:  '#EAF6F3',

  // Gold accent
  gold500: '#C8A24A',
  gold400: '#D4B46A',
  gold300: '#E0C88A',
  gold100: '#F5EDD5',

  // Cream / neutral
  cream50:  '#F7F3E8',
  cream100: '#EDE8D5',

  // Grays
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  gray50:  '#F9FAFB',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const fontSizes = {
  xs:   11,
  sm:   13,
  md:   16,
  lg:   18,
  xl:   24,
  xxl:  28,
  hero: 42,
} as const;

export const shadows = StyleSheet.create<{ card: ViewStyle; strong: ViewStyle }>({
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  strong: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
