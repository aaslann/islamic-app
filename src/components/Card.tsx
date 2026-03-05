import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme/designSystem';

type Props = ViewProps & {
  padded?: boolean;
};

export function Card({ children, padded = true, style, ...rest }: Props) {
  return (
    <View
      style={[
        styles.card,
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
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    ...shadows.card,
  },
  cardPadded: {
    padding: spacing.md,
  },
});

