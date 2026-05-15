import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { radii, spacing, fontSizes } from '../../core/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function PrimaryButton({ label, onPress, disabled, style }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.colors.primary },
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
