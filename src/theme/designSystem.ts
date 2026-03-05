// Centralized design tokens and helpers for the Islamic app UI.
// All screens should import from this file instead of hardcoding colors/sizes.

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Brand
  primary: '#1F6E5A',
  primaryDark: '#0F3D3E',
  primarySoft: '#E8F3EF',

  // Accent
  accentGold: '#C8A951',

  // Light theme basics
  background: '#F7F9F8',
  card: '#FFFFFF',
  textDark: '#1A1A1A',
  textSoft: '#6B7280',
  white: '#FFFFFF',

  // Dark mode
  backgroundDark: '#0E1B18',
  cardDark: '#162522',
  textDarkMode: '#F5F5F5',
  textSoftDark: '#A0A0A0',
};

// Strict 8pt spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography presets
export const textStyles = StyleSheet.create<{
  hero: TextStyle;
  heading1: TextStyle;
  heading2: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  arabic: TextStyle;
}>({
  hero: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.textDark,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textDark,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textDark,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textDark,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSoft,
  },
  arabic: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: 'right',
    color: colors.textDark,
  },
});

// Soft shadow presets
export const shadows = StyleSheet.create<{
  card: ViewStyle;
}>({
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

// Reusable corner radii
export const radii = {
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

