import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/core/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppShell() {
  const { theme, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.navBar }]}>
      <StatusBar style={isDark ? 'light' : 'light'} />
      <RootNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
