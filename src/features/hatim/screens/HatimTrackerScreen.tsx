import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';

const HATIM_KEY = '@hatim-state-v1';
const QURAN_TOTAL_PAGES = 604; // Mushaf-ı Şerif sayfa sayısı

type HatimPlan = '30' | '60' | '90' | 'free';
type HatimState = {
  startDate: string;
  plan: HatimPlan;
  pagesRead: number;
  history: { date: string; pages: number }[];
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PLAN_OPTIONS: { id: HatimPlan; label: string; days: number; perDay: number; desc: string }[] = [
  { id: '30', label: '30 Gün', days: 30, perDay: 20, desc: 'Ramazan temposu · günde 1 cüz' },
  { id: '60', label: '60 Gün', days: 60, perDay: 10, desc: 'Dengeli plan · günde yarım cüz' },
  { id: '90', label: '90 Gün', days: 90, perDay: 7, desc: 'Yavaş ve sindirerek' },
  { id: 'free', label: 'Serbest', days: 0, perDay: 0, desc: 'Kendi tempon, hedef yok' },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(startISO: string): number {
  const start = new Date(startISO);
  const today = new Date(todayKey());
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HatimTrackerScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;
  const navigation = useNavigation<Nav>();
  const [state, setState] = useState<HatimState | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HATIM_KEY)
      .then((raw) => {
        if (raw) setState(JSON.parse(raw) as HatimState);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((next: HatimState | null) => {
    if (next) AsyncStorage.setItem(HATIM_KEY, JSON.stringify(next)).catch(() => {});
    else AsyncStorage.removeItem(HATIM_KEY).catch(() => {});
  }, []);

  const startPlan = useCallback((plan: HatimPlan) => {
    const next: HatimState = {
      startDate: todayKey(),
      plan,
      pagesRead: 0,
      history: [],
    };
    setState(next);
    persist(next);
  }, [persist]);

  const addPages = useCallback((pages: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const newTotal = Math.min(prev.pagesRead + pages, QURAN_TOTAL_PAGES);
      const today = todayKey();
      const existingTodayIdx = prev.history.findIndex((h) => h.date === today);
      let history = [...prev.history];
      if (existingTodayIdx >= 0) {
        history[existingTodayIdx] = { date: today, pages: history[existingTodayIdx].pages + pages };
      } else {
        history = [{ date: today, pages }, ...history];
      }
      const next: HatimState = { ...prev, pagesRead: newTotal, history };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetPlan = useCallback(() => {
    Alert.alert(
      'Planı sıfırla',
      'Mevcut hatim ilerlemen silinecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            setState(null);
            persist(null);
          },
        },
      ],
    );
  }, [persist]);

  const planMeta = useMemo(() => (state ? PLAN_OPTIONS.find((p) => p.id === state.plan) : null), [state]);
  const elapsed = state ? daysBetween(state.startDate) : 0;
  const todayPages = state ? state.history.find((h) => h.date === todayKey())?.pages ?? 0 : 0;
  const percent = state ? Math.round((state.pagesRead / QURAN_TOTAL_PAGES) * 100) : 0;
  const expectedPages = planMeta && planMeta.days > 0 ? Math.min(QURAN_TOTAL_PAGES, (elapsed + 1) * planMeta.perDay) : 0;
  const onTrack = !planMeta || planMeta.days === 0 || state!.pagesRead >= expectedPages;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {!state ? (
        <PlanSelector startPlan={startPlan} />
      ) : (
        <>
          <LinearGradient
            colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
            style={styles.hero}
          >
            <Text style={styles.heroLabel}>HATİM TAKİBİ</Text>
            <Text style={styles.heroTitle}>{planMeta?.label} Planı</Text>
            <Text style={styles.heroSub}>{planMeta?.desc}</Text>

            <View style={styles.progressWrap}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#F4D67E', '#C8A24A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.max(2, percent)}%` }]}
                />
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.progressText}>
                  <Text style={{ color: palette.gold400, fontWeight: '900' }}>{state.pagesRead}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)' }}> / {QURAN_TOTAL_PAGES} sayfa</Text>
                </Text>
                <Text style={styles.progressPct}>%{percent}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{elapsed + 1}</Text>
                <Text style={styles.statLabel}>GÜN</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayPages}</Text>
                <Text style={styles.statLabel}>BUGÜN</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: onTrack ? '#22C55E' : '#FB923C' }]}>
                  {planMeta && planMeta.days > 0 ? (onTrack ? '✓' : '!') : '∞'}
                </Text>
                <Text style={styles.statLabel}>{onTrack ? 'YOLUNDA' : 'GERİDE'}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>BUGÜN OKUDUM</Text>
            <View style={styles.quickRow}>
              {[1, 5, 10, 20].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => addPages(n)}
                  style={({ pressed }) => [
                    styles.quickBtn,
                    { backgroundColor: c.surface, borderColor: c.border },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.quickNumber, { color: palette.gold400 }]}>+{n}</Text>
                  <Text style={[styles.quickLabel, { color: c.textSecondary }]}>sayfa</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => navigation.navigate('QuranSurahList')}
              style={({ pressed }) => [
                styles.openQuranBtn,
                { backgroundColor: c.surface, borderColor: `${palette.gold500}40` },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="book" size={18} color={palette.gold400} />
              <Text style={[styles.openQuranText, { color: c.text }]}>Kur'an-ı Kerim'i Aç</Text>
              <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
            </Pressable>
          </View>

          {state.history.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SON OKUMALAR</Text>
              {state.history.slice(0, 7).map((entry) => (
                <View
                  key={entry.date}
                  style={[styles.historyRow, { backgroundColor: c.surface, borderColor: c.border }]}
                >
                  <View style={[styles.historyDot, { backgroundColor: palette.gold500 }]} />
                  <Text style={[styles.historyDate, { color: c.text }]}>
                    {new Date(entry.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                  </Text>
                  <Text style={[styles.historyPages, { color: palette.gold400 }]}>{entry.pages} sayfa</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable onPress={resetPlan} style={styles.resetBtn}>
            <Ionicons name="trash-outline" size={14} color="#FCA5A5" />
            <Text style={styles.resetText}>Planı sıfırla</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function PlanSelector({ startPlan }: { startPlan: (plan: HatimPlan) => void }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View>
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>HATİM PLANI</Text>
        <Text style={styles.heroTitle}>Yeni Bir Yolculuk</Text>
        <Text style={styles.heroSub}>Tempona en uygun planı seç, başla.</Text>
      </LinearGradient>

      <View style={styles.section}>
        {PLAN_OPTIONS.map((plan) => (
          <Pressable
            key={plan.id}
            onPress={() => startPlan(plan.id)}
            style={({ pressed }) => [
              styles.planCard,
              { backgroundColor: c.surface, borderColor: `${palette.gold500}30` },
              pressed && { transform: [{ scale: 0.99 }], borderColor: palette.gold500 },
            ]}
          >
            <View style={styles.planIcon}>
              <Text style={styles.planIconText}>{plan.id === 'free' ? '∞' : plan.id}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: c.text }]}>{plan.label}</Text>
              <Text style={[styles.planDesc, { color: c.textSecondary }]}>{plan.desc}</Text>
              {plan.days > 0 && (
                <Text style={[styles.planPerDay, { color: palette.gold400 }]}>
                  Günde ~{plan.perDay} sayfa
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.gold400} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  hero: { padding: spacing.lg, paddingBottom: spacing.md },
  heroLabel: { fontSize: 10, color: palette.gold400, fontWeight: '700', letterSpacing: 3 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  progressWrap: { marginTop: spacing.md },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: 13 },
  progressPct: { fontSize: 13, fontWeight: '900', color: palette.gold400 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(200,162,74,0.2)',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: '900', color: palette.gold400 },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },

  section: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },

  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickNumber: { fontSize: 22, fontWeight: '900' },
  quickLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  openQuranBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  openQuranText: { flex: 1, fontSize: 14, fontWeight: '700' },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyDate: { flex: 1, fontSize: 12, fontWeight: '600' },
  historyPages: { fontSize: 12, fontWeight: '800' },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  planIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(200,162,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconText: { fontSize: 18, fontWeight: '900', color: palette.gold400 },
  planTitle: { fontSize: 16, fontWeight: '800' },
  planDesc: { fontSize: 11, marginTop: 2 },
  planPerDay: { fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  resetText: { fontSize: 12, fontWeight: '600', color: '#FCA5A5' },
});
