import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { radii, shadows, spacing } from '../../core/theme/tokens';

type Props = ViewProps & {
  padded?: boolean;
};

export function Card({ children, padded = true, style, ...rest }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        padded && styles.cardPadded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.card,
  },
  cardPadded: {
    padding: spacing.md,
  },
});
