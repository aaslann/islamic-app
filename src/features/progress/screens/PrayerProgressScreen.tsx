import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PrayerStatus = 'none' | 'prayed' | 'qada';
type DayLog = Record<PrayerId, PrayerStatus>;
type PrayerLogState = Record<string, DayLog>;

const PRAYERS: { id: PrayerId; label: string; emoji: string }[] = [
  { id: 'fajr', label: 'Sabah', emoji: '🌅' },
  { id: 'dhuhr', label: 'Öğle', emoji: '☀️' },
  { id: 'asr', label: 'İkindi', emoji: '🌤' },
  { id: 'maghrib', label: 'Akşam', emoji: '🌇' },
  { id: 'isha', label: 'Yatsı', emoji: '🌙' },
];

const PRAYER_LOG_KEY = 'prayer-log-v1';

function getDayKey(d: Date) { return d.toISOString().split('T')[0]; }

function getLast7Days(): { key: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    return { key: getDayKey(d), label };
  });
}

export default function PrayerProgressScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [log, setLog] = useState<PrayerLogState>({});
  const days = getLast7Days();

  useEffect(() => {
    AsyncStorage.getItem(PRAYER_LOG_KEY).then((raw) => {
      if (raw) setLog(JSON.parse(raw) as PrayerLogState);
    });
  }, []);

  const todayKey = getDayKey(new Date());
  const todayLog = log[todayKey] ?? {} as DayLog;
  const todayCount = PRAYERS.filter((p) => todayLog[p.id] === 'prayed').length;

  const weekStats = days.map(({ key, label }) => {
    const d = log[key] ?? {} as DayLog;
    const prayed = PRAYERS.filter((p) => d[p.id] === 'prayed').length;
    const qada = PRAYERS.filter((p) => d[p.id] === 'qada').length;
    return { key, label, prayed, qada };
  });

  const weekTotal = weekStats.reduce((s, d) => s + d.prayed, 0);
  const weekMax = 7 * 5;
  const weekPct = Math.round((weekTotal / weekMax) * 100);

  const prayerStats = PRAYERS.map((p) => {
    const prayed = days.filter(({ key }) => log[key]?.[p.id] === 'prayed').length;
    return { ...p, prayed, pct: Math.round((prayed / 7) * 100) };
  });

  const streakDays = (() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const d = log[days[i].key] ?? {} as DayLog;
      const count = PRAYERS.filter((p) => d[p.id] === 'prayed').length;
      if (count >= 5) streak++;
      else break;
    }
    return streak;
  })();

  return (
    <LinearGradient colors={['#0A1520', '#0D1F18']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Today summary */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]} style={styles.todayCard}>
          <View style={styles.todayRow}>
            <View>
              <Text style={[{ fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 1 }]}>BUGÜN</Text>
              <Text style={[{ fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 50 }]}>{todayCount}<Text style={{ fontSize: 22, fontWeight: '400', color: 'rgba(255,255,255,.4)' }}>/5</Text></Text>
              <Text style={[t.caption, { color: 'rgba(255,255,255,.5)' }]}>namaz kılındı</Text>
            </View>
            <View style={styles.circleProgress}>
              <View style={[styles.circleInner, { borderColor: `${palette.gold500}30` }]}>
                <Text style={[{ fontSize: 28, fontWeight: '800', color: palette.gold400 }]}>{Math.round((todayCount / 5) * 100)}%</Text>
              </View>
            </View>
          </View>
          <View style={styles.prayerDots}>
            {PRAYERS.map((p) => (
              <View key={p.id} style={[styles.prayerDot, { backgroundColor: todayLog[p.id] === 'prayed' ? palette.gold500 : 'rgba(255,255,255,.15)' }]}>
                <Text style={{ fontSize: 10 }}>{p.emoji}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Streak + week */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }]}>
            <Text style={{ fontSize: 32 }}>🔥</Text>
            <Text style={[{ fontSize: 32, fontWeight: '800', color: palette.gold400, lineHeight: 38 }]}>{streakDays}</Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.4)', textAlign: 'center' }]}>Gün Serisi</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }]}>
            <Text style={{ fontSize: 32 }}>📊</Text>
            <Text style={[{ fontSize: 32, fontWeight: '800', color: palette.green300, lineHeight: 38 }]}>{weekPct}%</Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.4)', textAlign: 'center' }]}>Haftalık Oran</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }]}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={[{ fontSize: 32, fontWeight: '800', color: palette.green300, lineHeight: 38 }]}>{weekTotal}</Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.4)', textAlign: 'center' }]}>Bu Hafta</Text>
          </View>
        </View>

        {/* Weekly bar chart */}
        <View style={[styles.card]}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.lg }]}>Son 7 Gün</Text>
          <View style={styles.barChart}>
            {weekStats.map(({ label, prayed, key }) => {
              const isToday = key === todayKey;
              const h = Math.max(4, (prayed / 5) * 120);
              return (
                <View key={key} style={styles.barCol}>
                  <View style={[styles.barTrack, { height: 120 }]}>
                    <LinearGradient
                      colors={isToday ? [palette.gold500, palette.gold400] : [palette.green500, palette.green400]}
                      style={[styles.barFill, { height: h }]}
                    />
                  </View>
                  <Text style={[{ fontSize: 10, color: isToday ? palette.gold400 : 'rgba(255,255,255,.4)', marginTop: 6, fontWeight: isToday ? '700' : '400' }]}>{label}</Text>
                  <Text style={[{ fontSize: 9, color: 'rgba(255,255,255,.25)', marginTop: 2 }]}>{prayed}/5</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Per-prayer stats */}
        <View style={[styles.card]}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>Namaz Bazlı (7 gün)</Text>
          {prayerStats.map((p) => (
            <View key={p.id} style={styles.prayerRow}>
              <Text style={{ fontSize: 18, width: 28 }}>{p.emoji}</Text>
              <Text style={[t.bodyBold, { color: '#fff', width: 64 }]}>{p.label}</Text>
              <View style={styles.prayerBarTrack}>
                <LinearGradient
                  colors={[palette.green500, palette.gold500]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.prayerBarFill, { width: `${p.pct}%` }]}
                />
              </View>
              <Text style={[{ fontSize: 12, fontWeight: '700', color: palette.gold400, width: 36, textAlign: 'right' }]}>{p.prayed}/7</Text>
            </View>
          ))}
        </View>

        {/* Calendar heatmap */}
        <View style={[styles.card]}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>Bu Ay</Text>
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 30 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              const key = getDayKey(d);
              const dayLog = log[key] ?? {} as DayLog;
              const count = PRAYERS.filter((p) => dayLog[p.id] === 'prayed').length;
              const opacity = count === 0 ? 0.06 : count <= 2 ? 0.2 : count <= 4 ? 0.55 : 1;
              return (
                <View key={i} style={[styles.heatCell, { backgroundColor: palette.green500, opacity }]} />
              );
            })}
          </View>
          <View style={styles.heatLegend}>
            {[0.06, 0.2, 0.55, 1].map((op, i) => (
              <View key={i} style={[styles.heatLegendDot, { backgroundColor: palette.green500, opacity: op }]} />
            ))}
            <Text style={[{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginLeft: 4 }]}>Az → Çok</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  content:         { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  todayCard:       { borderRadius: radii.xl, padding: spacing.lg },
  todayRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  circleProgress:  { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  circleInner:     { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  prayerDots:      { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  prayerDot:       { flex: 1, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  statsRow:        { flexDirection: 'row', gap: spacing.md },
  statCard:        { flex: 1, alignItems: 'center', borderRadius: radii.xl, padding: spacing.md, gap: 4, borderWidth: 1, ...shadows.card },
  card:            { backgroundColor: 'rgba(255,255,255,.05)', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
  barChart:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.xs },
  barCol:          { flex: 1, alignItems: 'center' },
  barTrack:        { width: '100%', backgroundColor: 'rgba(255,255,255,.06)', borderRadius: radii.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:         { width: '100%', borderRadius: radii.sm },
  prayerRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  prayerBarTrack:  { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden' },
  prayerBarFill:   { height: '100%', borderRadius: 99 },
  heatmapGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  heatCell:        { width: 28, height: 28, borderRadius: 6 },
  heatLegend:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  heatLegendDot:   { width: 12, height: 12, borderRadius: 3 },
});
