import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../core/theme/ThemeContext';
import { spacing } from '../../../core/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PrayerStatus = 'none' | 'prayed' | 'qada';

type DayLog = Record<PrayerId, PrayerStatus>;
type PrayerLogState = Record<string, DayLog>;

type ZikrHistoryEntry = {
  id: string;
  timestamp: string;
  count: number;
};

type ZikrPresetState = {
  count: number;
  target: number;
  history: ZikrHistoryEntry[];
};

type ZikrState = {
  activePhrase: string;
  presets: string[];
  data: Record<string, ZikrPresetState>;
};

const PRAYERS: { id: PrayerId; label: string }[] = [
  { id: 'fajr', label: 'Sabah' },
  { id: 'dhuhr', label: 'Öğle' },
  { id: 'asr', label: 'İkindi' },
  { id: 'maghrib', label: 'Akşam' },
  { id: 'isha', label: 'Yatsı' },
];

const PRAYER_LOG_KEY = 'prayer-log-v1';
const ZIKR_KEY = 'zikr-counter-presets-v2';

type DailyStats = {
  dateKey: string;
  label: string;
  prayedCount: number;
  qadaCount: number;
  zikrCount: number;
};

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [prayerLog, setPrayerLog] = useState<PrayerLogState>({});
  const [zikrState, setZikrState] = useState<ZikrState | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prayerRaw, zikrRaw] = await Promise.all([
          AsyncStorage.getItem(PRAYER_LOG_KEY),
          AsyncStorage.getItem(ZIKR_KEY),
        ]);

        if (prayerRaw) {
          setPrayerLog(JSON.parse(prayerRaw) as PrayerLogState);
        }
        if (zikrRaw) {
          setZikrState(JSON.parse(zikrRaw) as ZikrState);
        }
      } catch {
        // ignore
      }
    };

    load();
  }, []);

  const stats = useMemo<DailyStats[]>(() => {
    const today = new Date();
    const days: DailyStats[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });

      const dayLog: DayLog =
        prayerLog[dateKey] ?? {
          fajr: 'none',
          dhuhr: 'none',
          asr: 'none',
          maghrib: 'none',
          isha: 'none',
        };

      const prayedCount = PRAYERS.filter(
        (p) => dayLog[p.id] === 'prayed',
      ).length;
      const qadaCount = PRAYERS.filter((p) => dayLog[p.id] === 'qada').length;

      let zikrCount = 0;
      if (zikrState) {
        Object.values(zikrState.data ?? {}).forEach((preset) => {
          (preset.history ?? []).forEach((entry) => {
            if (entry.timestamp.startsWith(dateKey)) {
              zikrCount += entry.count;
            }
          });
        });
      }

      days.push({ dateKey, label, prayedCount, qadaCount, zikrCount });
    }

    return days;
  }, [prayerLog, zikrState]);

  const totalQadaByPrayer = useMemo(() => {
    const counts: Record<PrayerId, number> = {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };

    Object.values(prayerLog).forEach((day) => {
      PRAYERS.forEach((p) => {
        if (day[p.id] === 'qada') {
          counts[p.id] += 1;
        }
      });
    });

    return counts;
  }, [prayerLog]);

  const mostMissedPrayer = useMemo(() => {
    let topId: PrayerId | null = null;
    let topVal = 0;
    PRAYERS.forEach((p) => {
      const val = totalQadaByPrayer[p.id];
      if (val > topVal) {
        topVal = val;
        topId = p.id;
      }
    });
    if (!topId || topVal === 0) return null;
    return {
      id: topId,
      label: PRAYERS.find((p) => p.id === topId)?.label ?? topId,
      count: topVal,
    };
  }, [totalQadaByPrayer]);

  const mostActiveDay = useMemo(() => {
    if (stats.length === 0) return null;
    let best = stats[0];
    let bestScore = best.prayedCount * 2 + best.zikrCount / 10;
    stats.forEach((s) => {
      const score = s.prayedCount * 2 + s.zikrCount / 10;
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    });
    return best;
  }, [stats]);

  const maxPrayed = Math.max(...stats.map((s) => s.prayedCount), 1);

  return (
    <IslamicBackground>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={[t.heading1, { color: c.text }]}>Manevî Analiz</Text>
          <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
            Son 7 gün için namaz ve zikir alışkanlıklarına dair özet. Hangi günler
            daha güçlü, hangi vakitler zayıf görmek için buraya göz atabilirsin.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Haftalık Namaz Grafiği</Text>
          <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
            Her gün kılınan vakit sayısı (maksimum 5 üzerinden).
          </Text>
          <View style={styles.chart}>
            {stats.map((s) => (
              <View key={s.dateKey} style={styles.chartRow}>
                <Text style={{ width: 40, fontSize: 12, color: c.textSecondary }}>{s.label}</Text>
                <View
                  style={[
                    styles.chartBarBackground,
                    { backgroundColor: c.surface, borderColor: c.primarySoft },
                  ]}
                >
                  <View
                    style={[
                      styles.chartBarFill,
                      { flex: s.prayedCount || 0.1, backgroundColor: c.primary },
                    ]}
                  />
                  <View style={{ flex: Math.max(maxPrayed - s.prayedCount, 0) }} />
                </View>
                <Text style={{ width: 24, fontSize: 12, color: c.textSecondary, textAlign: 'right' }}>{s.prayedCount}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Özet</Text>
          {mostMissedPrayer ? (
            <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
              En çok kaza edilen vakit:{' '}
              <Text style={{ color: c.primary, fontWeight: '600' }}>
                {mostMissedPrayer.label} ({mostMissedPrayer.count} gün)
              </Text>
            </Text>
          ) : (
            <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
              Kaza kaydı bulunmuyor. Böyle devam inşallah.
            </Text>
          )}

          {mostActiveDay ? (
            <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
              En aktif gün:{' '}
              <Text style={{ color: c.primary, fontWeight: '600' }}>
                {mostActiveDay.label} ({mostActiveDay.prayedCount} vakit,{' '}
                {mostActiveDay.zikrCount} zikir)
              </Text>
            </Text>
          ) : null}
        </Card>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  chart: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chartBarBackground: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  chartBarFill: {
    // backgroundColor set inline via theme
  },
});
