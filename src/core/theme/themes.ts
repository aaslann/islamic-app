import { StyleSheet, TextStyle } from 'react-native';
import { palette, fontSizes } from './tokens';

export interface AppTheme {
  dark: boolean;
  colors: {
    primary: string;
    primaryDark: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    text: string;
    textSecondary: string;
    textInverse: string;
    white: string;
    heroGradientStart: string;
    heroGradientEnd: string;
    navBar: string;
    navBarBorder: string;
    tabBar: string;
    tabBarActive: string;
    tabBarInactive: string;
  };
  text: {
    hero: TextStyle;
    heading1: TextStyle;
    heading2: TextStyle;
    body: TextStyle;
    bodyBold: TextStyle;
    caption: TextStyle;
    captionBold: TextStyle;
    arabic: TextStyle;
  };
}

const makeTextStyles = (textColor: string, secondaryColor: string): AppTheme['text'] =>
  StyleSheet.create({
    hero: {
      fontSize: fontSizes.hero,
      fontWeight: '700',
      color: textColor,
      letterSpacing: -1,
    },
    heading1: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
      color: textColor,
      letterSpacing: -0.3,
    },
    heading2: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      color: textColor,
    },
    body: {
      fontSize: fontSizes.md,
      fontWeight: '400',
      color: textColor,
    },
    bodyBold: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: textColor,
    },
    caption: {
      fontSize: fontSizes.sm,
      fontWeight: '400',
      color: secondaryColor,
    },
    captionBold: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: secondaryColor,
    },
    arabic: {
      fontSize: fontSizes.xl,
      lineHeight: 44,
      textAlign: 'right',
      color: textColor,
    },
  });

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    primary:          palette.green500,
    primaryDark:      palette.green800,
    primarySoft:      palette.green50,
    accent:           palette.gold500,
    accentSoft:       palette.gold100,
    background:       palette.gray50,
    surface:          palette.white,
    surfaceElevated:  palette.white,
    border:           palette.green100,
    text:             palette.gray900,
    textSecondary:    palette.gray500,
    textInverse:      palette.white,
    white:            palette.white,
    heroGradientStart:'rgba(15,61,46,0.94)',
    heroGradientEnd:  'rgba(31,110,90,0.90)',
    navBar:           palette.green800,
    navBarBorder:     palette.green700,
    tabBar:           palette.white,
    tabBarActive:     palette.green500,
    tabBarInactive:   palette.gray400,
  },
  text: makeTextStyles(palette.gray900, palette.gray500),
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    primary:          palette.green400,
    primaryDark:      palette.green900,
    primarySoft:      'rgba(45,138,112,0.15)',
    accent:           palette.gold400,
    accentSoft:       'rgba(200,162,74,0.15)',
    background:       '#0D1F18',
    surface:          '#162820',
    surfaceElevated:  '#1D3328',
    border:           'rgba(45,138,112,0.25)',
    text:             '#EDF5F2',
    textSecondary:    '#7AADA0',
    textInverse:      palette.gray900,
    white:            palette.white,
    heroGradientStart:'rgba(9,40,28,0.97)',
    heroGradientEnd:  'rgba(15,61,46,0.95)',
    navBar:           '#0D1F18',
    navBarBorder:     'rgba(45,138,112,0.2)',
    tabBar:           '#162820',
    tabBarActive:     palette.green300,
    tabBarInactive:   '#4A6B62',
  },
  text: makeTextStyles('#EDF5F2', '#7AADA0'),
};
