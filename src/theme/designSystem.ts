// Re-export everything from core theme for backward compatibility.
// New code should import directly from src/core/theme/.
export { spacing, radii, shadows } from '../core/theme/tokens';
export { lightTheme as theme } from '../core/theme/themes';
export { useTheme } from '../core/theme/ThemeContext';

// Static color aliases (for screens not yet on useTheme)
import { palette } from '../core/theme/tokens';
import { lightTheme } from '../core/theme/themes';

export const colors = {
  primary:      lightTheme.colors.primary,
  primaryDark:  lightTheme.colors.primaryDark,
  primarySoft:  lightTheme.colors.primarySoft,
  accentGold:   lightTheme.colors.accent,
  background:   lightTheme.colors.background,
  card:         lightTheme.colors.surface,
  surface:      lightTheme.colors.surface,
  textDark:     lightTheme.colors.text,
  text:         lightTheme.colors.text,
  textSoft:     lightTheme.colors.textSecondary,
  textMuted:    lightTheme.colors.textSecondary,
  white:        palette.white,
  border:       lightTheme.colors.border,
  borderSubtle: lightTheme.colors.border,
  backgroundDark: '#0D1F18',
  cardDark:     '#162820',
  textDarkMode: '#EDF5F2',
  textSoftDark: '#7AADA0',
};

import { StyleSheet, TextStyle } from 'react-native';
import { fontSizes } from '../core/theme/tokens';

export const textStyles = StyleSheet.create<{
  hero: TextStyle; heading1: TextStyle; heading2: TextStyle;
  body: TextStyle; caption: TextStyle; arabic: TextStyle;
}>({
  hero:     { fontSize: fontSizes.hero, fontWeight: '700', color: colors.textDark, letterSpacing: -1 },
  heading1: { fontSize: fontSizes.xl,   fontWeight: '700', color: colors.textDark },
  heading2: { fontSize: fontSizes.lg,   fontWeight: '600', color: colors.textDark },
  body:     { fontSize: fontSizes.md,   fontWeight: '400', color: colors.textDark },
  caption:  { fontSize: fontSizes.sm,   fontWeight: '400', color: colors.textSoft },
  arabic:   { fontSize: fontSizes.xl,   lineHeight: 44, textAlign: 'right', color: colors.textDark },
});
