import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

// Ramadan 2025 (approximate)
const RAMADAN_2025 = {
  start: new Date('2025-03-01'),
  end: new Date('2025-03-30'),
  imsakTime: '05:12',
  iftarTime: '18:45',
};

type DayStatus = { fasted: boolean; tarawih: boolean; quranPages: number };
type RamadanLog = Record<string, DayStatus>;

const STORAGE_KEY = 'ramadan-log-v1';

function getDayKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function getRamadanDay(today: Date): number {
  const diff = Math.floor((today.getTime() - RAMADAN_2025.start.getTime()) / 86400000);
  return Math.max(0, Math.min(diff + 1, 30));
}

export default function RamadanTrackerScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const today = new Date();
  const todayKey = getDayKey(today);
  const ramadanDay = getRamadanDay(today);
  const isRamadan = ramadanDay >= 1 && ramadanDay <= 30;

  const [log, setLog] = useState<RamadanLog>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setLog(JSON.parse(raw) as RamadanLog);
    });
  }, []);

  const persist = (next: RamadanLog) => {
    setLog(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const todayStatus: DayStatus = log[todayKey] ?? { fasted: false, tarawih: false, quranPages: 0 };

  const toggleFasted = () => persist({ ...log, [todayKey]: { ...todayStatus, fasted: !todayStatus.fasted } });
  const toggleTarawih = () => persist({ ...log, [todayKey]: { ...todayStatus, tarawih: !todayStatus.tarawih } });
  const addPage = () => persist({ ...log, [todayKey]: { ...todayStatus, quranPages: todayStatus.quranPages + 1 } });

  const totalFasted = Object.values(log).filter((d) => d.fasted).length;
  const totalTarawih = Object.values(log).filter((d) => d.tarawih).length;
  const totalPages = Object.values(log).reduce((s, d) => s + d.quranPages, 0);
  const progressPct = Math.round((ramadanDay / 30) * 100);

  // Countdown to iftar
  const now = today;
  const [iftarH, iftarM] = RAMADAN_2025.iftarTime.split(':').map(Number);
  const iftar = new Date(now.getFullYear(), now.getMonth(), now.getDate(), iftarH, iftarM);
  const msToIftar = iftar.getTime() - now.getTime();
  const iftarCountdown = msToIftar > 0
    ? `${Math.floor(msToIftar / 3600000)}s ${Math.floor((msToIftar % 3600000) / 60000)}dk`
    : 'İftar vakti!';

  return (
    <LinearGradient colors={['#0A1A0E', '#0D2616', '#0A1F15']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <LinearGradient
          colors={[`${palette.gold500}22`, `${palette.green800}80`]}
          style={styles.heroBanner}
        >
          <Text style={[{ fontSize: 36 }]}>🌙</Text>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }]}>
              Ramazan {isRamadan ? ramadanDay + '. Gün' : '2025'}
            </Text>
            <Text style={[t.caption, { color: palette.gold400, marginTop: 2 }]}>
              {isRamadan ? `${30 - ramadanDay} gün kaldı` : 'Ramazan Takip Sistemi'}
            </Text>
          </View>
        </LinearGradient>

        {/* Iftar countdown */}
        <View style={[styles.iftarCard, { borderColor: `${palette.gold500}35` }]}>
          <LinearGradient colors={[`${palette.gold500}15`, `${palette.gold500}05`]} style={styles.iftarGrad}>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 1 }]}>İMSAK</Text>
              <Text style={[{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1 }]}>{RAMADAN_2025.imsakTime}</Text>
            </View>
            <View style={styles.iftarCenter}>
              <Text style={[{ fontSize: 11, color: 'rgba(255,255,255,.4)', textAlign: 'center' }]}>İftara</Text>
              <Text style={[{ fontSize: 20, fontWeight: '800', color: palette.gold400, letterSpacing: -0.5 }]}>{iftarCountdown}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[{ fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 1 }]}>İFTAR</Text>
              <Text style={[{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1 }]}>{RAMADAN_2025.iftarTime}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Progress bar */}
        <View style={[styles.card]}>
          <View style={styles.progressHeader}>
            <Text style={[t.heading2, { color: '#fff' }]}>Ramazan İlerlemesi</Text>
            <Text style={[{ fontSize: 22, fontWeight: '800', color: palette.gold400 }]}>{progressPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient colors={[palette.green500, palette.gold500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={[t.caption, { color: 'rgba(255,255,255,.35)', marginTop: spacing.xs }]}>{ramadanDay} / 30 gün tamamlandı</Text>
        </View>

        {/* Today's actions */}
        <View style={[styles.card]}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>Bugün ({todayKey})</Text>
          <View style={styles.actionGrid}>
            {/* Oruç */}
            <Pressable onPress={toggleFasted} style={({ pressed }) => [styles.actionTile, todayStatus.fasted && styles.actionTileActive, pressed && { opacity: 0.8 }]}>
              <Text style={{ fontSize: 32 }}>🌙</Text>
              <Text style={[{ fontSize: 13, fontWeight: '700', color: todayStatus.fasted ? palette.gold400 : 'rgba(255,255,255,.6)', marginTop: 8 }]}>Oruç</Text>
              <View style={[styles.actionCheck, todayStatus.fasted && { backgroundColor: palette.gold500 }]}>
                <Text style={{ fontSize: 12, color: todayStatus.fasted ? '#000' : 'rgba(255,255,255,.3)' }}>{todayStatus.fasted ? '✓' : '○'}</Text>
              </View>
            </Pressable>

            {/* Teravih */}
            <Pressable onPress={toggleTarawih} style={({ pressed }) => [styles.actionTile, todayStatus.tarawih && styles.actionTileActive, pressed && { opacity: 0.8 }]}>
              <Text style={{ fontSize: 32 }}>🕌</Text>
              <Text style={[{ fontSize: 13, fontWeight: '700', color: todayStatus.tarawih ? palette.gold400 : 'rgba(255,255,255,.6)', marginTop: 8 }]}>Teravih</Text>
              <View style={[styles.actionCheck, todayStatus.tarawih && { backgroundColor: palette.gold500 }]}>
                <Text style={{ fontSize: 12, color: todayStatus.tarawih ? '#000' : 'rgba(255,255,255,.3)' }}>{todayStatus.tarawih ? '✓' : '○'}</Text>
              </View>
            </Pressable>

            {/* Quran pages */}
            <Pressable onPress={addPage} style={({ pressed }) => [styles.actionTile, todayStatus.quranPages > 0 && styles.actionTileActive, pressed && { opacity: 0.8 }]}>
              <Text style={{ fontSize: 32 }}>📖</Text>
              <Text style={[{ fontSize: 13, fontWeight: '700', color: todayStatus.quranPages > 0 ? palette.gold400 : 'rgba(255,255,255,.6)', marginTop: 8 }]}>Kur'an</Text>
              <View style={[styles.actionCheck, todayStatus.quranPages > 0 && { backgroundColor: palette.green400 }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: todayStatus.quranPages > 0 ? '#000' : 'rgba(255,255,255,.3)' }}>{todayStatus.quranPages}s</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Summary stats */}
        <View style={[styles.card]}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>Ramazan Özeti</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Tutulan Oruç', value: totalFasted, icon: '🌙', max: 30 },
              { label: 'Teravih', value: totalTarawih, icon: '🕌', max: 30 },
              { label: 'Kur\'an Sayfa', value: totalPages, icon: '📖', max: 604 },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                <Text style={[{ fontSize: 28, fontWeight: '800', color: palette.gold400, lineHeight: 34 }]}>{s.value}</Text>
                <Text style={[{ fontSize: 10, color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: 2 }]}>{s.label}</Text>
                <View style={[styles.miniProgress, { marginTop: 6 }]}>
                  <LinearGradient colors={[palette.green500, palette.gold500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.miniProgressFill, { width: `${Math.min(100, (s.value / s.max) * 100)}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Calendar dots */}
        <View style={[styles.card]}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>30 Günlük Harita</Text>
          <View style={styles.calGrid}>
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1;
              const dayDate = new Date(RAMADAN_2025.start);
              dayDate.setDate(dayDate.getDate() + i);
              const key = getDayKey(dayDate);
              const status = log[key];
              const isPast = dayDate <= today;
              const isToday = getDayKey(dayDate) === todayKey;
              return (
                <View key={day} style={[styles.calDot,
                  isToday && { borderColor: palette.gold500, borderWidth: 2 },
                  status?.fasted && { backgroundColor: `${palette.green500}40` },
                  !isPast && { opacity: 0.25 },
                ]}>
                  <Text style={[{ fontSize: 9, fontWeight: '700', color: status?.fasted ? palette.green300 : 'rgba(255,255,255,.4)' }]}>{day}</Text>
                </View>
              );
            })}
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
  heroBanner:      { flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: `${palette.gold500}25` },
  iftarCard:       { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  iftarGrad:       { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  iftarCenter:     { alignItems: 'center', paddingHorizontal: spacing.md },
  card:            { backgroundColor: 'rgba(255,255,255,.05)', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTrack:   { height: 8, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,.1)', overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: radii.full },
  actionGrid:      { flexDirection: 'row', gap: spacing.md },
  actionTile:      { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', gap: 4 },
  actionTileActive:{ borderColor: `${palette.gold500}40`, backgroundColor: `${palette.gold500}08` },
  actionCheck:     { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:        { alignItems: 'center', flex: 1 },
  miniProgress:    { width: '80%', height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', overflow: 'hidden' },
  miniProgressFill:{ height: '100%', borderRadius: 99 },
  calGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calDot:          { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
});
