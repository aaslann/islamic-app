import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/designSystem';

const DOT_SIZE = 5;
const DOT_SPACING = 28;
const PATTERN_OPACITY = 0.08;

/**
 * Islamic-style background: deep teal/green gradient with subtle gold warmth
 * and a soft geometric dot pattern evoking traditional Islamic design.
 */
export function IslamicBackground({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const cols = Math.ceil(width / DOT_SPACING) + 2;
  const rows = Math.ceil(height / DOT_SPACING) + 2;
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : DOT_SPACING / 2;
    for (let c = 0; c < cols; c++) {
      dots.push({
        x: c * DOT_SPACING - DOT_SPACING + offset,
        y: r * DOT_SPACING - DOT_SPACING,
      });
    }
  }

  return (
    <View style={styles.root}>
      {/* Ana gradient: üstte koyu İslami yeşil, altta yumuşak krem/açık yeşil — tek parça arka plan */}
      <LinearGradient
        colors={[
          colors.primaryDark,
          '#0a2e2e',
          colors.primary,
          '#1a5c4d',
          colors.primarySoft,
          '#Eef6f2',
        ]}
        locations={[0, 0.18, 0.35, 0.5, 0.78, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Altın ışıltı: üst ve alt köşelerde hafif vurgu */}
      <LinearGradient
        colors={[`${colors.accentGold}18`, 'transparent', 'transparent', `${colors.accentGold}0C`]}
        locations={[0, 0.25, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.goldOverlay]}
      />
      {/* Geometrik nokta deseni — tüm ekranda, altta daha hafif */}
      <View style={[styles.pattern, { width: width + DOT_SPACING * 2, height: height + DOT_SPACING * 2 }]} pointerEvents="none">
        {dots.map((d, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                left: d.x,
                top: d.y,
                backgroundColor: colors.accentGold,
                opacity: PATTERN_OPACITY,
              },
            ]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  goldOverlay: {
    opacity: 0.95,
  },
  pattern: {
    position: 'absolute',
    top: -DOT_SPACING,
    left: -DOT_SPACING,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
