import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PrayerStatus = 'none' | 'prayed' | 'qada';
type DayLog = Record<PrayerId, PrayerStatus>;
type PrayerLogState = Record<string, DayLog>;
type ZikrHistoryEntry = { id: string; timestamp: string; count: number };
type ZikrPresetState = { count: number; target: number; history: ZikrHistoryEntry[] };
type ZikrState = { activePhrase: string; presets: string[]; data: Record<string, ZikrPresetState> };
type QuranDailyState = Record<string, boolean>;

const PRAYER_LOG_KEY = 'prayer-log-v1';
const ZIKR_KEY = 'zikr-counter-presets-v2';
const QURAN_DAILY_KEY = 'quran-daily-v1';

function getDateKey(d: Date) { return d.toISOString().slice(0, 10); }

type GoalCardProps = {
  emoji: string;
  title: string;
  subtitle: string;
  current: number;
  target: number;
  color: string;
  unit: string;
  extra?: string;
  c: import('../../../core/theme/themes').AppTheme['colors'];
};

function GoalCard({ emoji, title, subtitle, current, target, color, unit, extra, c }: GoalCardProps) {
  const pct = Math.min(1, target > 0 ? current / target : 0);
  const done = current >= target;

  return (
    <View style={[styles.goalCard, { backgroundColor: c.surface, borderColor: done ? `${color}40` : c.border }]}>
      {done && (
        <View style={[styles.completedBanner, { backgroundColor: `${color}18` }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color, letterSpacing: 0.8 }}>✓  HEDEF TAMAMLANDI</Text>
        </View>
      )}
      <View style={styles.goalBody}>
        {/* Ring */}
        <View style={styles.ringWrap}>
          <View style={[styles.ringOuter, { borderColor: `${color}20` }]}>
            <View style={[styles.ringFill, {
              borderColor: color,
              transform: [{ rotate: `${pct * 360}deg` }],
            }]} />
            <View style={styles.ringCenter}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color, marginTop: 4, textAlign: 'center' }}>
            {Math.round(pct * 100)}%
          </Text>
        </View>

        {/* Text info */}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{title}</Text>
          <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{subtitle}</Text>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: `${color}15`, marginTop: spacing.sm }]}>
            <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
          </View>
          <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 4 }}>
            <Text style={{ fontWeight: '700', color }}>{current}</Text> / {target} {unit}
          </Text>
          {extra && <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>{extra}</Text>}
        </View>
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const today = useMemo(() => new Date(), []);
  const todayKey = getDateKey(today);

  const [prayerLog, setPrayerLog] = useState<PrayerLogState>({});
  const [zikrState, setZikrState] = useState<ZikrState | null>(null);
  const [quranDaily, setQuranDaily] = useState<QuranDailyState>({});

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PRAYER_LOG_KEY),
      AsyncStorage.getItem(ZIKR_KEY),
      AsyncStorage.getItem(QURAN_DAILY_KEY),
    ]).then(([pRaw, zRaw, qRaw]) => {
      if (pRaw) setPrayerLog(JSON.parse(pRaw) as PrayerLogState);
      if (zRaw) setZikrState(JSON.parse(zRaw) as ZikrState);
      if (qRaw) setQuranDaily(JSON.parse(qRaw) as QuranDailyState);
    }).catch(() => {});
  }, []);

  // Sabah streak (consecutive fajr days)
  const sabahStreak = useMemo(() => {
    let streak = 0;
    const d = new Date(today);
    for (let i = 0; i < 365; i++) {
      const key = getDateKey(d);
      if (prayerLog[key]?.fajr === 'prayed') { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [prayerLog, today]);

  const sabahBest = useMemo(() => {
    let best = 0, cur = 0;
    Object.keys(prayerLog).sort().forEach((key) => {
      if (prayerLog[key]?.fajr === 'prayed') { cur++; if (cur > best) best = cur; }
      else cur = 0;
    });
    return best;
  }, [prayerLog]);

  // Today's 5 prayers count
  const prayedToday = useMemo(() => {
    const day = prayerLog[todayKey];
    if (!day) return 0;
    return (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]).filter((id) => day[id] === 'prayed').length;
  }, [prayerLog, todayKey]);

  // Today's zikir total
  const zikrToday = useMemo(() => {
    if (!zikrState) return 0;
    return Object.values(zikrState.data ?? {}).reduce((sum, preset) => {
      return sum + (preset.history ?? []).filter((e) => e.timestamp.startsWith(todayKey)).reduce((s, e) => s + e.count, 0);
    }, 0);
  }, [zikrState, todayKey]);

  const quranTodayDone = !!quranDaily[todayKey];
  const toggleQuranToday = async () => {
    const next = { ...quranDaily, [todayKey]: !quranTodayDone };
    setQuranDaily(next);
    try { await AsyncStorage.setItem(QURAN_DAILY_KEY, JSON.stringify(next)); } catch {}
  };

  // Weekly prayer completion %
  const weeklyPct = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const day = prayerLog[getDateKey(d)];
      if (day) total += (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]).filter((id) => day[id] === 'prayed').length;
    }
    return Math.round((total / 35) * 100);
  }, [prayerLog, today]);

  return (
    <IslamicBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>HEDEFLERİM</Text>
          <Text style={styles.heroTitle}>Günlük İbadet</Text>
          <Text style={styles.heroTitle}>Takibi</Text>
          <Text style={styles.heroSub}>Sabah namazı, zikir ve Kur'an hedeflerini takip et; istikrar kur.</Text>
        </LinearGradient>

        {/* Weekly overview */}
        <View style={[styles.weeklyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold500, letterSpacing: 1 }}>GEÇTİĞİMİZ 7 GÜN</Text>
          <View style={styles.weeklyRow}>
            <View style={styles.weeklyRing}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: weeklyPct >= 80 ? '#22C55E' : weeklyPct >= 50 ? '#F59E0B' : c.text }}>
                {weeklyPct}%
              </Text>
              <Text style={{ fontSize: 10, color: c.textSecondary }}>tamamlandı</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[t.bodyBold, { color: c.text }]}>Haftalık Namaz Oranı</Text>
              <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>7 gün × 5 vakit = 35 hedef</Text>
              <View style={[styles.progressTrack, { backgroundColor: `${palette.green500}20`, marginTop: spacing.sm }]}>
                <View style={[styles.progressFill, {
                  width: `${weeklyPct}%`,
                  backgroundColor: weeklyPct >= 80 ? '#22C55E' : weeklyPct >= 50 ? '#F59E0B' : '#EF4444',
                }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Goal cards */}
        <View style={{ paddingHorizontal: spacing.lg }}>

          <GoalCard
            emoji="🌅"
            title="Sabah Namazı Serisi"
            subtitle="30 gün kesintisiz sabah namazı"
            current={sabahStreak}
            target={30}
            color="#F59E0B"
            unit="gün"
            extra={sabahBest > 0 ? `En iyi seri: ${sabahBest} gün` : undefined}
            c={c}
          />

          <GoalCard
            emoji="🕌"
            title="Bugün 5 Vakit"
            subtitle="Tüm namaz vakitlerini kılmak"
            current={prayedToday}
            target={5}
            color="#22C55E"
            unit="vakit"
            c={c}
          />

          <GoalCard
            emoji="📿"
            title="Günlük 100 Zikir"
            subtitle="Bugün çekilen toplam zikir"
            current={zikrToday}
            target={100}
            color={palette.gold500}
            unit="zikir"
            c={c}
          />

          {/* Quran daily toggle */}
          <View style={[styles.goalCard, { backgroundColor: c.surface, borderColor: quranTodayDone ? `${palette.green500}40` : c.border }]}>
            {quranTodayDone && (
              <View style={[styles.completedBanner, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#22C55E', letterSpacing: 0.8 }}>✓  HEDEF TAMAMLANDI</Text>
              </View>
            )}
            <View style={styles.goalBody}>
              <View style={styles.ringWrap}>
                <View style={[styles.ringOuter, { borderColor: 'rgba(34,197,94,0.2)' }]}>
                  <View style={styles.ringCenter}>
                    <Text style={{ fontSize: 22 }}>📖</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#22C55E', marginTop: 4, textAlign: 'center' }}>
                  {quranTodayDone ? '100%' : '0%'}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>Günlük 1 Sayfa Kur'an</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>Bugün en az bir sayfa oku</Text>
                <Pressable
                  onPress={toggleQuranToday}
                  style={[
                    styles.quranBtn,
                    { borderColor: quranTodayDone ? '#22C55E' : c.border, backgroundColor: quranTodayDone ? 'rgba(34,197,94,0.12)' : 'transparent' },
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: quranTodayDone ? '#22C55E' : c.textSecondary }}>
                    {quranTodayDone ? '✓  Tamamlandı' : '○  Tamamla'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: c.surface, borderColor: `${palette.gold500}25` }]}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.gold500, marginBottom: 4 }}>💡  İpucu</Text>
          <Text style={{ fontSize: 12, color: c.textSecondary, lineHeight: 18 }}>
            Sabah namazı serisi, Namaz Hatıra Defteri'nde sabah vakti "Kılındı" olarak işaretlendiğinde ilerler.
            Zikir hedefi de Zikir Sayacı'nda "Kaydet" ile oluşturulan kayıtlarla güncellenir.
          </Text>
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:             { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:        { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:        { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 34 },
  heroSub:          { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs, lineHeight: 18 },
  weeklyCard:       { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  weeklyRow:        { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  weeklyRing:       { alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: `${palette.green500}25` },
  goalCard:         { borderRadius: radii.xl, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  completedBanner:  { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  goalBody:         { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  ringWrap:         { alignItems: 'center', width: 68 },
  ringOuter:        { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringFill:         { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: 'transparent' },
  ringCenter:       { alignItems: 'center', justifyContent: 'center' },
  progressTrack:    { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: 3 },
  quranBtn:         { marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full, borderWidth: 1.5 },
  tipCard:          { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1 },
});
