import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/core/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen, { ONBOARDING_KEY } from './src/features/onboarding/screens/OnboardingScreen';
import LoginScreen, { LOGIN_KEY } from './src/features/auth/screens/LoginScreen';
import { useAdhanOnPrayer } from './src/core/audio/useAdhanOnPrayer';
import { palette } from './src/core/theme/tokens';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { OfflineBanner } from './src/shared/components/OfflineBanner';

function AppShell() {
  const { theme, isDark } = useTheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useAdhanOnPrayer();

  useEffect(() => {
    AsyncStorage.multiGet([ONBOARDING_KEY, LOGIN_KEY]).then((entries) => {
      const map = Object.fromEntries(entries);
      setOnboarded(map[ONBOARDING_KEY] === 'true');
      setLoggedIn(map[LOGIN_KEY] === 'true');
    });
  }, []);

  if (onboarded === null || loggedIn === null) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={palette.gold500} />
      </View>
    );
  }

  if (!onboarded) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setOnboarded(true)} />
      </>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen
          onComplete={() => {
            AsyncStorage.setItem(LOGIN_KEY, 'true').catch(() => {});
            setLoggedIn(true);
          }}
        />
      </>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.navBar }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'light'} />
      <OfflineBanner />
      <RootNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={palette.gold500} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  splash: { flex: 1, backgroundColor: '#0D1F18', alignItems: 'center', justifyContent: 'center' },
});
