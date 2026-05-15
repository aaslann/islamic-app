import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type QuranDailyState = Record<string, boolean>; // YYYY-MM-DD -> completed?

const PRAYER_LOG_KEY = 'prayer-log-v1';
const ZIKR_KEY = 'zikr-counter-presets-v2';
const QURAN_DAILY_KEY = 'quran-daily-v1';

function getDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function GoalsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [prayerLog, setPrayerLog] = useState<PrayerLogState>({});
  const [zikrState, setZikrState] = useState<ZikrState | null>(null);
  const [quranDaily, setQuranDaily] = useState<QuranDailyState>({});

  const today = new Date();
  const todayKey = getDateKey(today);

  useEffect(() => {
    const load = async () => {
      try {
        const [prayerRaw, zikrRaw, quranRaw] = await Promise.all([
          AsyncStorage.getItem(PRAYER_LOG_KEY),
          AsyncStorage.getItem(ZIKR_KEY),
          AsyncStorage.getItem(QURAN_DAILY_KEY),
        ]);

        if (prayerRaw) setPrayerLog(JSON.parse(prayerRaw) as PrayerLogState);
        if (zikrRaw) setZikrState(JSON.parse(zikrRaw) as ZikrState);
        if (quranRaw) setQuranDaily(JSON.parse(quranRaw) as QuranDailyState);
      } catch {
        // ignore
      }
    };

    load();
  }, []);

  const sabahStreak = useMemo(() => {
    // bugünden geriye doğru kesintisiz sabah namazı kılınan gün sayısı
    let streak = 0;
    const d = new Date(today);
    // güvenli sınır: son 365 gün
    for (let i = 0; i < 365; i += 1) {
      const key = getDateKey(d);
      const day = prayerLog[key];
      if (day && day.fajr === 'prayed') {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [prayerLog, today]);

  const sabahBestStreak = useMemo(() => {
    // tüm kayıtlar içinde en uzun sabah kılınan seri (yaklaşık)
    const keys = Object.keys(prayerLog).sort();
    let best = 0;
    let current = 0;
    keys.forEach((key) => {
      const day = prayerLog[key];
      if (day && day.fajr === 'prayed') {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    });
    return best;
  }, [prayerLog]);

  const zikrToday = useMemo(() => {
    if (!zikrState) return 0;
    let total = 0;
    Object.values(zikrState.data ?? {}).forEach((preset) => {
      (preset.history ?? []).forEach((entry) => {
        if (entry.timestamp.startsWith(todayKey)) {
          total += entry.count;
        }
      });
    });
    return total;
  }, [zikrState, todayKey]);

  const quranTodayCompleted = !!quranDaily[todayKey];

  const toggleQuranToday = async () => {
    const next = {
      ...quranDaily,
      [todayKey]: !quranTodayCompleted,
    };
    setQuranDaily(next);
    try {
      await AsyncStorage.setItem(QURAN_DAILY_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const zikrTarget = 100;

  return (
    <IslamicBackground>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[styles.card, styles.headerCard]}>
          <Text style={[t.heading1, { color: c.text }]}>Hedeflerim</Text>
          <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
            Günlük ibadet hedeflerini takip et; sabah namazı, zikir ve Kur&apos;an ile
            istikrarlı bir rutin oluştur.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>30 Gün Sabah Namazı</Text>
          <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
            Sabah namazını her gün vaktinde kılmaya yönelik hedef.
          </Text>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressBarBackground,
                { backgroundColor: c.surface, borderColor: c.primarySoft },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((sabahStreak / 30) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
              Seri: {sabahStreak} / 30 gün (en iyi: {sabahBestStreak})
            </Text>
          </View>
          <Text style={{ marginTop: spacing.sm, fontSize: 11, color: c.textSecondary }}>
            Sabah hedefi, Namaz Hatıra Defteri&apos;nde sabah vakti &quot;Kılındı&quot;
            olarak işaretlendiğinde ilerler.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Günlük 100 Zikir</Text>
          <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
            Bugün çektiğin toplam zikir sayısı. Hedef: 100.
          </Text>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressBarBackground,
                { backgroundColor: c.surface, borderColor: c.primarySoft },
              ]}
            >
              <View
                style={[
                  styles.progressBarFillZikr,
                  {
                    backgroundColor: c.primary,
                    width: `${Math.min((zikrToday / zikrTarget) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
              {zikrToday} / {zikrTarget}
            </Text>
          </View>
          <Text style={{ marginTop: spacing.sm, fontSize: 11, color: c.textSecondary }}>
            Zikir hedefi, Zikir Sayacı ekranında &quot;Kaydet&quot; ile
            oluşturduğun günlük kayıtlarla artar.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Günlük 1 Sayfa Kur&apos;an</Text>
          <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
            Her gün en az bir sayfa Kur&apos;an okumayı hedefle.
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={toggleQuranToday}
              style={({ pressed }) => [
                styles.quranToggle,
                { borderColor: c.primarySoft },
                quranTodayCompleted && styles.quranToggleActive,
                pressed && { backgroundColor: '#E5F2ED' },
              ]}
            >
              <Text
                style={[
                  { fontSize: 12, color: c.textSecondary },
                  quranTodayCompleted && styles.quranToggleTextActive,
                ]}
              >
                {quranTodayCompleted
                  ? 'Bugün hedef tamamlandı'
                  : 'Bugün hedefi tamamla'}
              </Text>
            </Pressable>
          </View>
          <Text style={{ marginTop: spacing.sm, fontSize: 11, color: c.textSecondary }}>
            Okuduğun sayfa sayısını Kur&apos;an ekranından değil, şimdilik bu
            ekrandan işaretliyorsun. İleride doğrudan okuma ekranına bağlanabilir.
          </Text>
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
  headerCard: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  progressRow: {
    marginTop: spacing.sm,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  progressBarFillZikr: {
    height: '100%',
    // backgroundColor set inline via theme
  },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quranToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quranToggleActive: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  quranToggleTextActive: {
    color: '#22C55E',
    fontWeight: '600',
  },
});
