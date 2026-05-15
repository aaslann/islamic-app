import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

const PRAYERS: { id: PrayerId; label: string; emoji: string }[] = [
  { id: 'fajr',    label: 'Sabah',  emoji: '🌅' },
  { id: 'dhuhr',   label: 'Öğle',   emoji: '☀️' },
  { id: 'asr',     label: 'İkindi', emoji: '🌤️' },
  { id: 'maghrib', label: 'Akşam',  emoji: '🌇' },
  { id: 'isha',    label: 'Yatsı',  emoji: '🌙' },
];

const PRAYER_LOG_KEY = 'prayer-log-v1';
const ZIKR_KEY = 'zikr-counter-presets-v2';

type DayStat = { dateKey: string; label: string; shortLabel: string; prayedCount: number; qadaCount: number; zikrCount: number };

const MOTIVATIONS = [
  'Maşallah! Bu hafta çok iyi gidiyor, devam et!',
  'Küçük adımlar büyük yolculuklar açar. Devam et!',
  'Namaz, müminin miracıdır. Her vakti bir hediye bil.',
  'Düzenli ibadet, kalbin huzurudur.',
  'İstikrar, azdan çok olanı bereketlendirir.',
  'Her vakti kılmak, büyük bir nimete şükrüdür.',
  'Bugün dünden daha iyi olmak için fırsat var.',
];

function getMotivation(score: number): string {
  if (score >= 90) return MOTIVATIONS[0];
  if (score >= 70) return MOTIVATIONS[1];
  if (score >= 50) return MOTIVATIONS[3];
  return MOTIVATIONS[6];
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [prayerLog, setPrayerLog] = useState<PrayerLogState>({});
  const [zikrState, setZikrState] = useState<ZikrState | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PRAYER_LOG_KEY),
      AsyncStorage.getItem(ZIKR_KEY),
    ]).then(([pRaw, zRaw]) => {
      if (pRaw) setPrayerLog(JSON.parse(pRaw) as PrayerLogState);
      if (zRaw) setZikrState(JSON.parse(zRaw) as ZikrState);
    }).catch(() => {});
  }, []);

  const stats = useMemo<DayStat[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateKey = d.toISOString().slice(0, 10);
      const dayLog = prayerLog[dateKey] ?? { fajr: 'none', dhuhr: 'none', asr: 'none', maghrib: 'none', isha: 'none' };
      const prayedCount = PRAYERS.filter((p) => dayLog[p.id] === 'prayed').length;
      const qadaCount = PRAYERS.filter((p) => dayLog[p.id] === 'qada').length;
      let zikrCount = 0;
      if (zikrState) {
        Object.values(zikrState.data ?? {}).forEach((preset) => {
          (preset.history ?? []).forEach((e) => { if (e.timestamp.startsWith(dateKey)) zikrCount += e.count; });
        });
      }
      const isToday = d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
      return {
        dateKey,
        label: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        shortLabel: isToday ? 'Bugün' : d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        prayedCount, qadaCount, zikrCount,
      };
    });
  }, [prayerLog, zikrState]);

  const weeklyScore = useMemo(() => {
    const total = stats.reduce((s, d) => s + d.prayedCount, 0);
    return Math.round((total / 35) * 100);
  }, [stats]);

  const totalZikr = useMemo(() => stats.reduce((s, d) => s + d.zikrCount, 0), [stats]);

  const perPrayerStats = useMemo(() => {
    return PRAYERS.map((p) => {
      const prayed = Object.values(prayerLog).filter((day) => day[p.id] === 'prayed').length;
      const qada   = Object.values(prayerLog).filter((day) => day[p.id] === 'qada').length;
      const total  = Object.keys(prayerLog).length;
      return { ...p, prayed, qada, total, pct: total > 0 ? Math.round((prayed / total) * 100) : 0 };
    });
  }, [prayerLog]);

  const mostMissed = useMemo(() => {
    return [...perPrayerStats].sort((a, b) => b.qada - a.qada)[0];
  }, [perPrayerStats]);

  const bestDay = useMemo(() => {
    return [...stats].sort((a, b) => (b.prayedCount * 2 + b.zikrCount / 10) - (a.prayedCount * 2 + a.zikrCount / 10))[0];
  }, [stats]);

  const maxBar = Math.max(...stats.map((s) => s.prayedCount), 1);

  return (
    <IslamicBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>MANEVİ ANALİZ</Text>
          <Text style={styles.heroTitle}>Haftalık Özet</Text>
          <Text style={styles.heroSub}>Son 7 gün için namaz ve zikir alışkanlıklarına dair analiz.</Text>
        </LinearGradient>

        {/* Score + motivation */}
        <View style={[styles.scoreCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreRing, {
              borderColor: weeklyScore >= 80 ? '#22C55E' : weeklyScore >= 50 ? '#F59E0B' : '#EF4444',
            }]}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: weeklyScore >= 80 ? '#22C55E' : weeklyScore >= 50 ? '#F59E0B' : '#EF4444' }}>
                {weeklyScore}
              </Text>
              <Text style={{ fontSize: 10, color: c.textSecondary }}>puan</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[t.bodyBold, { color: c.text }]}>Haftalık Namaz Skoru</Text>
              <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2, lineHeight: 18 }}>
                {getMotivation(weeklyScore)}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#22C55E' }}>
                {stats.reduce((s, d) => s + d.prayedCount, 0)}
              </Text>
              <Text style={{ fontSize: 11, color: c.textSecondary }}>vakit kılındı</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#F59E0B' }}>
                {stats.reduce((s, d) => s + d.qadaCount, 0)}
              </Text>
              <Text style={{ fontSize: 11, color: c.textSecondary }}>kaza</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: palette.gold500 }}>
                {totalZikr}
              </Text>
              <Text style={{ fontSize: 11, color: c.textSecondary }}>zikir</Text>
            </View>
          </View>
        </View>

        {/* Weekly bar chart */}
        <View style={[styles.chartCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>Günlük Namaz</Text>
          <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: spacing.md }}>Her gün kılınan vakit (maks. 5)</Text>

          <View style={styles.barChart}>
            {stats.map((s) => {
              const barPct = s.prayedCount / maxBar;
              const isToday = s.dateKey === new Date().toISOString().slice(0, 10);
              return (
                <View key={s.dateKey} style={styles.barCol}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isToday ? palette.gold500 : c.text, marginBottom: 4 }}>
                    {s.prayedCount > 0 ? s.prayedCount : ''}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: c.primarySoft }]}>
                    <View style={[styles.barFill, {
                      height: `${Math.max(barPct * 100, s.prayedCount > 0 ? 10 : 0)}%`,
                      backgroundColor: s.prayedCount === 5 ? '#22C55E' : s.prayedCount >= 3 ? palette.gold500 : s.prayedCount > 0 ? '#F97316' : c.border,
                    }]} />
                    {s.qadaCount > 0 && (
                      <View style={[styles.barQada, { height: `${(s.qadaCount / maxBar) * 100}%`, backgroundColor: '#F59E0B40' }]} />
                    )}
                  </View>
                  <Text style={{ fontSize: 10, color: isToday ? palette.gold500 : c.textSecondary, marginTop: 4, fontWeight: isToday ? '700' : '400' }}>
                    {s.shortLabel}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} /><Text style={{ fontSize: 11, color: c.textSecondary }}>5 vakit</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: palette.gold500 }]} /><Text style={{ fontSize: 11, color: c.textSecondary }}>3-4 vakit</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F97316' }]} /><Text style={{ fontSize: 11, color: c.textSecondary }}>1-2 vakit</Text></View>
          </View>
        </View>

        {/* Per-prayer stats */}
        <View style={[styles.chartCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>Vakit Bazında Tüm Zamanlar</Text>
          {perPrayerStats.map((p) => (
            <View key={p.id} style={styles.prayerStatRow}>
              <Text style={{ fontSize: 18, width: 28 }}>{p.emoji}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, width: 55 }}>{p.label}</Text>
              <View style={[styles.statBarTrack, { backgroundColor: c.primarySoft, flex: 1 }]}>
                <View style={[styles.statBarFill, { width: `${p.pct}%`, backgroundColor: palette.green500 }]} />
              </View>
              <Text style={{ fontSize: 12, color: c.textSecondary, width: 36, textAlign: 'right' }}>{p.pct}%</Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={[styles.insightCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>Öne Çıkanlar</Text>
          {mostMissed && mostMissed.qada > 0 && (
            <View style={styles.insightRow}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text style={{ fontSize: 13, color: c.textSecondary, flex: 1, marginLeft: spacing.sm, lineHeight: 18 }}>
                En çok kaza edilen vakit:{' '}
                <Text style={{ color: '#F59E0B', fontWeight: '600' }}>{mostMissed.label} ({mostMissed.qada} gün)</Text>
              </Text>
            </View>
          )}
          {bestDay && bestDay.prayedCount > 0 && (
            <View style={[styles.insightRow, { marginTop: spacing.xs }]}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={{ fontSize: 13, color: c.textSecondary, flex: 1, marginLeft: spacing.sm, lineHeight: 18 }}>
                En aktif gün:{' '}
                <Text style={{ color: '#22C55E', fontWeight: '600' }}>
                  {bestDay.label} ({bestDay.prayedCount} vakit{bestDay.zikrCount > 0 ? `, ${bestDay.zikrCount} zikir` : ''})
                </Text>
              </Text>
            </View>
          )}
          {mostMissed && mostMissed.qada === 0 && (
            <View style={styles.insightRow}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text style={{ fontSize: 13, color: '#22C55E', flex: 1, marginLeft: spacing.sm }}>
                Kaza kaydı bulunmuyor. Böyle devam inşallah!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:           { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:      { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:      { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs, lineHeight: 18 },
  scoreCard:      { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  scoreRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  scoreRing:      { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  statRow:        { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: spacing.sm },
  statItem:       { flex: 1, alignItems: 'center' },
  statDivider:    { width: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
  chartCard:      { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  barChart:       { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: spacing.xs },
  barCol:         { flex: 1, alignItems: 'center' },
  barTrack:       { flex: 1, width: '80%', borderRadius: 4, overflow: 'hidden', position: 'relative', justifyContent: 'flex-end' },
  barFill:        { width: '100%', borderRadius: 4 },
  barQada:        { position: 'absolute', bottom: 0, width: '100%' },
  chartLegend:    { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, justifyContent: 'center' },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  prayerStatRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  statBarTrack:   { height: 8, borderRadius: 4, overflow: 'hidden' },
  statBarFill:    { height: '100%', borderRadius: 4 },
  insightCard:    { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  insightRow:     { flexDirection: 'row', alignItems: 'flex-start' },
});
