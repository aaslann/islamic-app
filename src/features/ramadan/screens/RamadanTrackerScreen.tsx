import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import { PRAYER_SCHEDULE_KEY } from '../../../core/notifications/prayerNotifications';

// Approximate Ramadan start dates (Hijri 1446 → 1455).
// Actual dates depend on local moon sighting; we list official Turkish
// (Diyanet) calendar dates where possible, otherwise astronomical.
// Format: [year, month (0-indexed), day]
const RAMADAN_DATES: Array<[number, number, number]> = [
  [2025, 2, 1],   // 1446 — Mar 1, 2025
  [2026, 1, 17],  // 1447 — Feb 17, 2026
  [2027, 1, 6],   // 1448 — Feb 6, 2027
  [2028, 0, 26],  // 1449 — Jan 26, 2028
  [2029, 0, 14],  // 1450 — Jan 14, 2029
  [2030, 0, 4],   // 1451 — Jan 4, 2030
  [2030, 11, 25], // 1452 — Dec 25, 2030
  [2031, 11, 14], // 1453 — Dec 14, 2031
  [2032, 11, 3],  // 1454 — Dec 3, 2032
  [2033, 10, 22], // 1455 — Nov 22, 2033
];

const RAMADAN_LENGTH = 30; // worst-case; some are 29
const STORAGE_KEY = 'ramadan-log-v2';

type DayStatus = { fasted: boolean; tarawih: boolean; quranPages: number };
type RamadanLog = Record<string, DayStatus>;

type RamadanWindow = {
  start: Date;
  end: Date;          // inclusive last day
  hijriYear: number;  // approximate
};

type Phase =
  | { kind: 'before'; daysLeft: number; window: RamadanWindow }
  | { kind: 'during'; dayNumber: number; window: RamadanWindow }
  | { kind: 'after'; window: RamadanWindow; next: RamadanWindow; daysToNext: number };

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

function buildWindow(entry: [number, number, number]): RamadanWindow {
  const [y, m, d] = entry;
  const start = new Date(y, m, d);
  const end = new Date(y, m, d + RAMADAN_LENGTH - 1);
  // Hijri year ≈ Gregorian year - 579 (rough); good enough for label only
  const hijriYear = y - 579 + (m < 8 ? 1 : 0); // crude offset
  return { start, end, hijriYear };
}

function getPhase(today: Date): Phase {
  const todayStart = startOfDay(today);
  const windows = RAMADAN_DATES.map(buildWindow);

  // Find current or next upcoming Ramadan
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    if (todayStart <= w.end) {
      if (todayStart < w.start) {
        // Before this Ramadan
        return { kind: 'before', daysLeft: daysBetween(today, w.start), window: w };
      }
      // During this Ramadan
      const dayNumber = daysBetween(w.start, today) + 1;
      return { kind: 'during', dayNumber, window: w };
    }
  }
  // Past all known Ramadans → fall back to last entry
  const last = windows[windows.length - 1];
  return { kind: 'after', window: last, next: last, daysToNext: 0 };
}

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDateTR(d: Date): string {
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

type CachedPrayer = { id: string; label: string; time: string };

function parseTimeStr(time: string, ref: Date): Date | null {
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), parseInt(m[1], 10), parseInt(m[2], 10));
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Vakit girdi!';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
}

export default function RamadanTrackerScreen() {
  const { theme } = useTheme();
  const t = theme.text;
  const c = theme.colors;

  const [now, setNow] = useState(new Date());
  const [log, setLog] = useState<RamadanLog>({});
  const [imsakTime, setImsakTime] = useState<string | null>(null);
  const [iftarTime, setIftarTime] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setLog(JSON.parse(raw) as RamadanLog); } catch {}
      }
    });
    AsyncStorage.getItem(PRAYER_SCHEDULE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const items = JSON.parse(raw) as CachedPrayer[];
        const fajr = items.find((p) => p.id === 'Fajr');
        const maghrib = items.find((p) => p.id === 'Maghrib');
        if (fajr) setImsakTime(fajr.time);
        if (maghrib) setIftarTime(maghrib.time);
      } catch {}
    });
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const phase = useMemo(() => getPhase(now), [now]);
  const todayKey = dayKey(now);

  const persist = (next: RamadanLog) => {
    setLog(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const todayStatus: DayStatus = log[todayKey] ?? { fasted: false, tarawih: false, quranPages: 0 };
  const toggleFasted = () => persist({ ...log, [todayKey]: { ...todayStatus, fasted: !todayStatus.fasted } });
  const toggleTarawih = () => persist({ ...log, [todayKey]: { ...todayStatus, tarawih: !todayStatus.tarawih } });
  const addPage = () => persist({ ...log, [todayKey]: { ...todayStatus, quranPages: todayStatus.quranPages + 1 } });
  const removePage = () => persist({ ...log, [todayKey]: { ...todayStatus, quranPages: Math.max(0, todayStatus.quranPages - 1) } });

  // Restrict log stats to the current Ramadan window so old entries don't pollute totals
  const windowKeys = useMemo(() => {
    const w = phase.window;
    const keys: string[] = [];
    for (let i = 0; i < RAMADAN_LENGTH; i++) {
      const d = new Date(w.start.getFullYear(), w.start.getMonth(), w.start.getDate() + i);
      keys.push(dayKey(d));
    }
    return keys;
  }, [phase.window]);

  const totalFasted = windowKeys.filter((k) => log[k]?.fasted).length;
  const totalTarawih = windowKeys.filter((k) => log[k]?.tarawih).length;
  const totalPages = windowKeys.reduce((sum, k) => sum + (log[k]?.quranPages ?? 0), 0);

  // Iftar / İmsak countdown (only meaningful during Ramadan)
  const iftarCountdown = useMemo(() => {
    if (!iftarTime) return null;
    const iftar = parseTimeStr(iftarTime, now);
    if (!iftar) return null;
    return iftar.getTime() - now.getTime();
  }, [iftarTime, now]);

  const imsakCountdown = useMemo(() => {
    if (!imsakTime) return null;
    const imsak = parseTimeStr(imsakTime, now);
    if (!imsak) return null;
    // If imsak already passed today, show tomorrow's imsak
    if (imsak.getTime() < now.getTime()) {
      imsak.setDate(imsak.getDate() + 1);
    }
    return imsak.getTime() - now.getTime();
  }, [imsakTime, now]);

  // -------------------- RENDER --------------------

  const heroIcon = '🌙';
  let heroTitle = '';
  let heroSubtitle = '';
  let heroAccent: string = palette.gold400;

  if (phase.kind === 'before') {
    heroTitle = `Ramazan'a ${phase.daysLeft} gün`;
    heroSubtitle = `${formatDateTR(phase.window.start)} başlıyor`;
  } else if (phase.kind === 'during') {
    heroTitle = `Ramazan ${phase.dayNumber}. Gün`;
    heroSubtitle = `${RAMADAN_LENGTH - phase.dayNumber} gün kaldı · ${phase.window.hijriYear} H.`;
    heroAccent = palette.green400;
  } else {
    heroTitle = 'Ramazan tamamlandı';
    heroSubtitle = `Bu yılki Ramazan sona erdi`;
  }

  const progressPct = phase.kind === 'during'
    ? Math.round((phase.dayNumber / RAMADAN_LENGTH) * 100)
    : phase.kind === 'before' ? 0 : 100;

  return (
    <LinearGradient colors={['#0A1A0E', '#0D2616', '#0A1F15']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[`${palette.gold500}22`, `${palette.green800}80`]} style={styles.heroBanner}>
          <Text style={{ fontSize: 40 }}>{heroIcon}</Text>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
              {heroTitle}
            </Text>
            <Text style={[t.caption, { color: heroAccent, marginTop: 2 }]}>
              {heroSubtitle}
            </Text>
          </View>
        </LinearGradient>

        {/* Big countdown card — only when BEFORE Ramadan */}
        {phase.kind === 'before' && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.xl }]}>
            <Text style={{ fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 2 }}>RAMAZAN'A KALAN</Text>
            <Text style={{ fontSize: 64, fontWeight: '900', color: '#fff', letterSpacing: -3, marginTop: 4 }}>
              {phase.daysLeft}
            </Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.5)' }]}>gün</Text>
            <View style={styles.divider} />
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Başlangıç</Text>
                <Text style={styles.dateValue}>{formatDateTR(phase.window.start)}</Text>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Bitiş</Text>
                <Text style={styles.dateValue}>{formatDateTR(phase.window.end)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Iftar / Imsak card — only meaningful DURING Ramadan */}
        {phase.kind === 'during' && (
          <View style={[styles.iftarCard, { borderColor: `${palette.gold500}35` }]}>
            <LinearGradient colors={[`${palette.gold500}15`, `${palette.gold500}05`]} style={styles.iftarGrad}>
              <View style={{ flex: 1 }}>
                <Text style={styles.iftarLabel}>İMSAK</Text>
                <Text style={styles.iftarTime}>{imsakTime ?? '—'}</Text>
              </View>
              <View style={styles.iftarCenter}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textAlign: 'center' }}>
                  {iftarCountdown !== null && iftarCountdown > 0 ? 'İftara' : 'İmsak\'a'}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: palette.gold400, letterSpacing: -0.5 }}>
                  {iftarCountdown !== null && iftarCountdown > 0
                    ? formatCountdown(iftarCountdown)
                    : imsakCountdown !== null ? formatCountdown(imsakCountdown) : '—'}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.iftarLabel}>İFTAR</Text>
                <Text style={styles.iftarTime}>{iftarTime ?? '—'}</Text>
              </View>
            </LinearGradient>
            {!imsakTime && (
              <Text style={[t.caption, { color: 'rgba(255,255,255,.4)', textAlign: 'center', paddingBottom: spacing.sm }]}>
                Saatler için Namaz sekmesini bir kez aç
              </Text>
            )}
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={[t.heading2, { color: '#fff' }]}>İlerleme</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: palette.gold400 }}>%{progressPct}</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[palette.green500, palette.gold500]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
          <Text style={[t.caption, { color: 'rgba(255,255,255,.35)', marginTop: spacing.xs }]}>
            {phase.kind === 'during'
              ? `${phase.dayNumber} / ${RAMADAN_LENGTH} gün tamamlandı`
              : phase.kind === 'before'
                ? `Henüz başlamadı · ${phase.daysLeft} gün kaldı`
                : 'Tamamlandı'}
          </Text>
        </View>

        {/* Today's actions — show during Ramadan, hide otherwise */}
        {phase.kind === 'during' && (
          <View style={styles.card}>
            <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>Bugün</Text>
            <View style={styles.actionGrid}>
              <Pressable onPress={toggleFasted} style={({ pressed }) => [styles.actionTile, todayStatus.fasted && styles.actionTileActive, pressed && { opacity: 0.8 }]}>
                <Text style={{ fontSize: 32 }}>🌙</Text>
                <Text style={[styles.actionLabel, { color: todayStatus.fasted ? palette.gold400 : 'rgba(255,255,255,.6)' }]}>Oruç</Text>
                <View style={[styles.actionCheck, todayStatus.fasted && { backgroundColor: palette.gold500 }]}>
                  <Text style={{ fontSize: 12, color: todayStatus.fasted ? '#000' : 'rgba(255,255,255,.3)' }}>{todayStatus.fasted ? '✓' : '○'}</Text>
                </View>
              </Pressable>

              <Pressable onPress={toggleTarawih} style={({ pressed }) => [styles.actionTile, todayStatus.tarawih && styles.actionTileActive, pressed && { opacity: 0.8 }]}>
                <Text style={{ fontSize: 32 }}>🕌</Text>
                <Text style={[styles.actionLabel, { color: todayStatus.tarawih ? palette.gold400 : 'rgba(255,255,255,.6)' }]}>Teravih</Text>
                <View style={[styles.actionCheck, todayStatus.tarawih && { backgroundColor: palette.gold500 }]}>
                  <Text style={{ fontSize: 12, color: todayStatus.tarawih ? '#000' : 'rgba(255,255,255,.3)' }}>{todayStatus.tarawih ? '✓' : '○'}</Text>
                </View>
              </Pressable>

              <Pressable onPress={addPage} onLongPress={removePage} style={({ pressed }) => [styles.actionTile, todayStatus.quranPages > 0 && styles.actionTileActive, pressed && { opacity: 0.8 }]}>
                <Text style={{ fontSize: 32 }}>📖</Text>
                <Text style={[styles.actionLabel, { color: todayStatus.quranPages > 0 ? palette.gold400 : 'rgba(255,255,255,.6)' }]}>Kur'an</Text>
                <View style={[styles.actionCheck, todayStatus.quranPages > 0 && { backgroundColor: palette.green400 }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: todayStatus.quranPages > 0 ? '#000' : 'rgba(255,255,255,.3)' }}>{todayStatus.quranPages}s</Text>
                </View>
              </Pressable>
            </View>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.3)', textAlign: 'center', marginTop: spacing.sm }]}>
              📖 sayfa eklemek için dokun · azaltmak için basılı tut
            </Text>
          </View>
        )}

        {/* Stats summary — show always except 'after' */}
        {phase.kind !== 'after' && (
          <View style={styles.card}>
            <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>
              {phase.kind === 'during' ? 'Bu Ramazan' : `${phase.window.start.getFullYear()} Hazırlığı`}
            </Text>
            <View style={styles.statsRow}>
              {[
                { label: 'Tutulan Oruç', value: totalFasted, icon: '🌙', max: RAMADAN_LENGTH },
                { label: 'Teravih', value: totalTarawih, icon: '🕌', max: RAMADAN_LENGTH },
                { label: 'Sayfa', value: totalPages, icon: '📖', max: 604 },
              ].map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: palette.gold400, lineHeight: 32 }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textAlign: 'center' }}>{s.label}</Text>
                  <View style={[styles.miniProgress, { marginTop: 6 }]}>
                    <LinearGradient colors={[palette.green500, palette.gold500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.miniProgressFill, { width: `${Math.min(100, (s.value / s.max) * 100)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 30-day calendar map */}
        <View style={styles.card}>
          <Text style={[t.heading2, { color: '#fff', marginBottom: spacing.md }]}>30 Günlük Harita</Text>
          <View style={styles.calGrid}>
            {Array.from({ length: RAMADAN_LENGTH }, (_, i) => {
              const dayDate = new Date(phase.window.start.getFullYear(), phase.window.start.getMonth(), phase.window.start.getDate() + i);
              const key = dayKey(dayDate);
              const status = log[key];
              const isPast = dayDate <= now;
              const isToday = key === todayKey && phase.kind === 'during';
              return (
                <View key={i} style={[
                  styles.calDot,
                  isToday && { borderColor: palette.gold500, borderWidth: 2 },
                  status?.fasted && { backgroundColor: `${palette.green500}40` },
                  !isPast && { opacity: 0.25 },
                ]}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: status?.fasted ? palette.green300 : 'rgba(255,255,255,.4)' }}>
                    {i + 1}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: `${palette.green500}40` }]} />
              <Text style={styles.legendText}>Oruç tutuldu</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderColor: palette.gold500, borderWidth: 2 }]} />
              <Text style={styles.legendText}>Bugün</Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  heroBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: `${palette.gold500}25` },
  card: { backgroundColor: 'rgba(255,255,255,.05)', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
  divider: { height: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,.1)', marginVertical: spacing.lg },
  dateRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between' },
  dateCol: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 1 },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 4 },
  iftarCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  iftarGrad: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  iftarCenter: { alignItems: 'center', paddingHorizontal: spacing.md },
  iftarLabel: { fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 1 },
  iftarTime: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTrack: { height: 8, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radii.full },
  actionGrid: { flexDirection: 'row', gap: spacing.md },
  actionTile: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', gap: 4 },
  actionTileActive: { borderColor: `${palette.gold500}40`, backgroundColor: `${palette.gold500}08` },
  actionLabel: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  actionCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  miniProgress: { width: '80%', height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.1)', overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 99 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calDot: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.05)' },
  legendText: { fontSize: 11, color: 'rgba(255,255,255,.5)' },
});
