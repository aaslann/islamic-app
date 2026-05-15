import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../core/theme/ThemeContext';
import { palette } from '../../core/theme/tokens';

const DOT_SIZE = 5;
const DOT_SPACING = 28;
const PATTERN_OPACITY = 0.07;

export function IslamicBackground({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();

  const cols = Math.ceil(width / DOT_SPACING) + 2;
  const rows = Math.ceil(height / DOT_SPACING) + 2;
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : DOT_SPACING / 2;
    for (let c = 0; c < cols; c++) {
      dots.push({ x: c * DOT_SPACING - DOT_SPACING + offset, y: r * DOT_SPACING - DOT_SPACING });
    }
  }

  const gradientColors: [string, string, string, string, string, string] = theme.dark
    ? [palette.green900, '#0a2010', '#0F3D2E', '#122e20', '#0D1F18', '#0D1F18']
    : [palette.green800, '#0a2e2e', palette.green500, '#1a5c4d', palette.green50, '#EEF6F2'];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.18, 0.35, 0.5, 0.78, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${palette.gold500}18`, 'transparent', 'transparent', `${palette.gold500}0C`]}
        locations={[0, 0.25, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.goldOverlay]}
      />
      <View
        style={[styles.pattern, { width: width + DOT_SPACING * 2, height: height + DOT_SPACING * 2 }]}
        pointerEvents="none"
      >
        {dots.map((d, i) => (
          <View
            key={i}
            style={[styles.dot, { left: d.x, top: d.y, backgroundColor: palette.gold500, opacity: PATTERN_OPACITY }]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  goldOverlay: { opacity: 0.95 },
  pattern: { position: 'absolute', top: -DOT_SPACING, left: -DOT_SPACING },
  dot: { position: 'absolute', width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
});
