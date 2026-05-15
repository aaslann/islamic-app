import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

const STORAGE_KEY = 'prayer-log-v1';

type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PrayerStatus = 'none' | 'prayed' | 'qada';
type DayLog = Record<PrayerId, PrayerStatus>;
type LogState = Record<string, DayLog>;

const PRAYERS: { id: PrayerId; label: string; arabic: string; emoji: string }[] = [
  { id: 'fajr',    label: 'Sabah',  arabic: 'الفجر',   emoji: '🌅' },
  { id: 'dhuhr',   label: 'Öğle',   arabic: 'الظهر',   emoji: '☀️' },
  { id: 'asr',     label: 'İkindi', arabic: 'العصر',   emoji: '🌤️' },
  { id: 'maghrib', label: 'Akşam',  arabic: 'المغرب',  emoji: '🌇' },
  { id: 'isha',    label: 'Yatsı',  arabic: 'العشاء',  emoji: '🌙' },
];

const STATUS_CONFIG = {
  prayed: { color: '#22C55E', label: 'Kılındı',      icon: '✓' },
  qada:   { color: '#F59E0B', label: 'Kaza',         icon: '↻' },
  none:   { color: 'transparent', label: 'Belirtilmedi', icon: '○' },
} as const;

function formatDateKey(d: Date) { return d.toISOString().slice(0, 10); }
function formatDateHuman(d: Date) {
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function isToday(d: Date) { return formatDateKey(d) === formatDateKey(new Date()); }

export default function PrayerLogScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [log, setLog] = useState<LogState>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setLog(JSON.parse(raw) as LogState); })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = (next: LogState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const dateKey = formatDateKey(selectedDate);
  const dayLog: DayLog = log[dateKey] ?? { fajr: 'none', dhuhr: 'none', asr: 'none', maghrib: 'none', isha: 'none' };

  const changeDay = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const toggleStatus = (id: PrayerId) => {
    const cur = dayLog[id] ?? 'none';
    const next: PrayerStatus = cur === 'none' ? 'prayed' : cur === 'prayed' ? 'qada' : 'none';
    const nextLog = { ...log, [dateKey]: { ...dayLog, [id]: next } };
    setLog(nextLog);
    persist(nextLog);
  };

  const prayedCount = PRAYERS.filter((p) => dayLog[p.id] === 'prayed').length;
  const qadaCount   = PRAYERS.filter((p) => dayLog[p.id] === 'qada').length;
  const pct = Math.round((prayedCount / PRAYERS.length) * 100);

  return (
    <IslamicBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>NAMAZ HATIRA DEFTERİ</Text>
          <Text style={styles.heroTitle}>Kılınan Vakitler</Text>
          <Text style={styles.heroSub}>Bir vakite dokun: Kılındı → Kaza → Boş sırasıyla değişir.</Text>
        </LinearGradient>

        {/* Date navigator */}
        <View style={[styles.dateCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable
            onPress={() => changeDay(-1)}
            style={({ pressed }) => [styles.arrowBtn, { borderColor: c.border }, pressed && { backgroundColor: c.primarySoft }]}
          >
            <Text style={{ fontSize: 20, color: c.text }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[t.bodyBold, { color: c.text, textAlign: 'center' }]}>{formatDateHuman(selectedDate)}</Text>
            {isToday(selectedDate) && (
              <View style={[styles.todayBadge, { backgroundColor: `${palette.gold500}20` }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold500 }}>Bugün</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => changeDay(1)}
            style={({ pressed }) => [styles.arrowBtn, { borderColor: c.border }, pressed && { backgroundColor: c.primarySoft }]}
          >
            <Text style={{ fontSize: 20, color: c.text }}>›</Text>
          </Pressable>
        </View>

        {/* Summary ring */}
        <View style={[styles.summaryCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.summaryLeft}>
            <View style={[styles.ring, { borderColor: prayedCount > 0 ? '#22C55E' : c.border }]}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: prayedCount > 0 ? '#22C55E' : c.textSecondary }}>
                {prayedCount}
              </Text>
              <Text style={{ fontSize: 10, color: c.textSecondary }}>/ 5</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.bodyBold, { color: c.text }]}>Günlük Özet</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: '#22C55E' }]} />
            </View>
            <View style={styles.summaryStats}>
              <Text style={{ fontSize: 12, color: '#22C55E', fontWeight: '600' }}>✓ {prayedCount} Kılındı</Text>
              {qadaCount > 0 && (
                <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '600', marginLeft: spacing.md }}>↻ {qadaCount} Kaza</Text>
              )}
            </View>
          </View>
        </View>

        {/* Prayer rows */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {!isLoaded ? (
            <Text style={[t.caption, { color: c.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
              Kayıtlar yükleniyor…
            </Text>
          ) : (
            PRAYERS.map((p) => {
              const status = dayLog[p.id];
              const cfg = STATUS_CONFIG[status];
              const isFilled = status !== 'none';
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleStatus(p.id)}
                  style={({ pressed }) => [
                    styles.prayerRow,
                    { backgroundColor: c.surface, borderColor: c.border },
                    isFilled && { borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}08` },
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  {/* Left accent */}
                  <View style={[styles.rowAccent, { backgroundColor: isFilled ? cfg.color : c.border }]} />

                  {/* Emoji + labels */}
                  <Text style={{ fontSize: 24, marginHorizontal: spacing.md }}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.bodyBold, { color: c.text, fontSize: 16 }]}>{p.label}</Text>
                    <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{p.arabic}</Text>
                  </View>

                  {/* Status indicator */}
                  <View style={[
                    styles.statusCircle,
                    {
                      backgroundColor: isFilled ? cfg.color : 'transparent',
                      borderColor: isFilled ? cfg.color : c.border,
                    },
                  ]}>
                    <Text style={{ fontSize: 16, color: isFilled ? '#fff' : c.textSecondary, fontWeight: '700' }}>
                      {cfg.icon}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: isFilled ? cfg.color : c.textSecondary, fontWeight: '600', marginLeft: spacing.xs, marginRight: spacing.sm, minWidth: 68 }}>
                    {cfg.label}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: c.surface, borderColor: c.border }]}>
          {Object.entries(STATUS_CONFIG).map(([key, v]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: key === 'none' ? 'transparent' : v.color, borderColor: v.color }]} />
              <Text style={{ fontSize: 12, color: c.textSecondary }}>{v.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:          { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:     { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:     { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: spacing.xs },
  dateCard:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  arrowBtn:      { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  todayBadge:    { marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  summaryCard:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  summaryLeft:   { marginRight: spacing.md },
  ring:          { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(34,197,94,0.15)', marginTop: spacing.sm, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  summaryStats:  { flexDirection: 'row', marginTop: spacing.xs },
  prayerRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', minHeight: 68, ...shadows.card },
  rowAccent:     { width: 4, alignSelf: 'stretch' },
  statusCircle:  { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  legend:        { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot:     { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
});
