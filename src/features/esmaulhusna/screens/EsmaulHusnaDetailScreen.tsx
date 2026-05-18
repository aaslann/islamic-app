import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ESMA_NAMES } from '../data/names';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';

const STORAGE_KEY = '@esma-counters-v1';

type CounterMap = Record<number, number>;
type DetailRoute = RouteProp<RootStackParamList, 'EsmaulHusnaDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EsmaulHusnaDetailScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();

  const currentIdx = useMemo(() => ESMA_NAMES.findIndex((n) => n.no === route.params.no), [route.params.no]);
  const name = ESMA_NAMES[currentIdx];
  const prev = currentIdx > 0 ? ESMA_NAMES[currentIdx - 1] : null;
  const next = currentIdx < ESMA_NAMES.length - 1 ? ESMA_NAMES[currentIdx + 1] : null;

  const [counters, setCounters] = useState<CounterMap>({});
  const count = counters[name.no] ?? 0;
  const pulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setCounters(JSON.parse(raw) as CounterMap);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((next: CounterMap) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const increment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCounters((prev) => {
      const next = { ...prev, [name.no]: (prev[name.no] ?? 0) + 1 };
      persist(next);
      return next;
    });
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 90, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
  }, [name.no, persist, pulse]);

  const reset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCounters((prev) => {
      const next = { ...prev, [name.no]: 0 };
      persist(next);
      return next;
    });
  }, [name.no, persist]);

  useEffect(() => {
    navigation.setOptions({ title: `${name.no}. ${name.latin}` });
  }, [navigation, name]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{name.no} / 99</Text>
        </View>
        <Text style={styles.arabic}>{name.arabic}</Text>
        <Text style={styles.latin}>{name.latin}</Text>
        <Text style={styles.meaning}>"{name.meaning}"</Text>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionLabel, { color: palette.gold400 }]}>AÇIKLAMA</Text>
        <Text style={[t.body, { color: c.text, lineHeight: 22 }]}>{name.description}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionLabel, { color: palette.gold400 }]}>FAZİLETİ</Text>
        <Text style={[t.body, { color: c.text, fontStyle: 'italic', lineHeight: 22 }]}>{name.virtue}</Text>
      </View>

      <View style={[styles.counterCard, { backgroundColor: c.surface, borderColor: `${palette.gold500}40` }]}>
        <Text style={[styles.sectionLabel, { color: palette.gold400 }]}>ZİKİR SAYACI</Text>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Text style={styles.counterNumber}>{count}</Text>
        </Animated.View>
        <Pressable
          onPress={increment}
          style={({ pressed }) => [styles.bigButton, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <LinearGradient
            colors={['#F4D67E', '#C8A24A', '#8A6418']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="add" size={28} color="#0D1F18" />
          <Text style={styles.bigButtonText}>Zikret</Text>
        </Pressable>

        <Pressable onPress={reset} style={styles.resetBtn}>
          <Ionicons name="refresh" size={14} color={c.textSecondary} />
          <Text style={[styles.resetText, { color: c.textSecondary }]}>Sıfırla</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => prev && navigation.replace('EsmaulHusnaDetail', { no: prev.no })}
          disabled={!prev}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: c.surface, borderColor: c.border },
            !prev && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={c.text} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.navLabel, { color: c.textSecondary }]}>ÖNCEKİ</Text>
            <Text style={[styles.navName, { color: c.text }]} numberOfLines={1}>
              {prev ? prev.latin : '—'}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => next && navigation.replace('EsmaulHusnaDetail', { no: next.no })}
          disabled={!next}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: c.surface, borderColor: c.border },
            !next && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={{ flex: 1, marginRight: 8, alignItems: 'flex-end' }}>
            <Text style={[styles.navLabel, { color: c.textSecondary }]}>SONRAKİ</Text>
            <Text style={[styles.navName, { color: c.text }]} numberOfLines={1}>
              {next ? next.latin : '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.text} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  numBadge: {
    backgroundColor: 'rgba(200,162,74,0.18)',
    borderColor: `${palette.gold500}50`,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: spacing.md,
  },
  numText: { fontSize: 10, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5 },
  arabic: { fontSize: 56, color: palette.gold400, fontWeight: '600', textAlign: 'center', lineHeight: 80 },
  latin: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 6 },
  meaning: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: 4 },

  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.sm },

  counterCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  counterNumber: { fontSize: 72, fontWeight: '900', color: palette.gold400, marginVertical: spacing.sm },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 60,
    paddingHorizontal: 40,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: palette.gold500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginTop: spacing.sm,
  },
  bigButtonText: { fontSize: 16, fontWeight: '900', color: '#0D1F18', letterSpacing: 0.5 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, padding: 6 },
  resetText: { fontSize: 12, fontWeight: '600' },

  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  navLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  navName: { fontSize: 14, fontWeight: '700', marginTop: 2 },
});
