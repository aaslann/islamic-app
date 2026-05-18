import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, spacing } from '../../core/theme/tokens';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Beklenmeyen Hata</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
        <Pressable onPress={this.reset} style={styles.btn}>
          <Text style={styles.btnText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0D1F18', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emoji:   { fontSize: 48, marginBottom: spacing.lg },
  title:   { fontSize: 20, fontWeight: '800', color: '#EDF5F2', marginBottom: spacing.sm },
  message: { fontSize: 13, color: 'rgba(237,245,242,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },
  btn:     { backgroundColor: palette.gold500, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12 },
  btnText: { fontSize: 15, fontWeight: '800', color: '#000' },
});
