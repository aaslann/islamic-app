import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';
import { IslamicBackground } from '../components/IslamicBackground';

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
          <Text style={styles.title}>Hedeflerim</Text>
          <Text style={styles.subtitle}>
            Günlük ibadet hedeflerini takip et; sabah namazı, zikir ve Kur&apos;an ile
            istikrarlı bir rutin oluştur.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.goalTitle}>30 Gün Sabah Namazı</Text>
          <Text style={styles.goalSubtitle}>
            Sabah namazını her gün vaktinde kılmaya yönelik hedef.
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((sabahStreak / 30) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Seri: {sabahStreak} / 30 gün (en iyi: {sabahBestStreak})
            </Text>
          </View>
          <Text style={styles.tipText}>
            Sabah hedefi, Namaz Hatıra Defteri&apos;nde sabah vakti &quot;Kılındı&quot;
            olarak işaretlendiğinde ilerler.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.goalTitle}>Günlük 100 Zikir</Text>
          <Text style={styles.goalSubtitle}>
            Bugün çektiğin toplam zikir sayısı. Hedef: 100.
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFillZikr,
                  { width: `${Math.min((zikrToday / zikrTarget) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {zikrToday} / {zikrTarget}
            </Text>
          </View>
          <Text style={styles.tipText}>
            Zikir hedefi, Zikir Sayacı ekranında &quot;Kaydet&quot; ile
            oluşturduğun günlük kayıtlarla artar.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.goalTitle}>Günlük 1 Sayfa Kur&apos;an</Text>
          <Text style={styles.goalSubtitle}>
            Her gün en az bir sayfa Kur&apos;an okumayı hedefle.
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={toggleQuranToday}
              style={({ pressed }) => [
                styles.quranToggle,
                quranTodayCompleted && styles.quranToggleActive,
                pressed && styles.quranTogglePressed,
              ]}
            >
              <Text
                style={[
                  styles.quranToggleText,
                  quranTodayCompleted && styles.quranToggleTextActive,
                ]}
              >
                {quranTodayCompleted
                  ? 'Bugün hedef tamamlandı'
                  : 'Bugün hedefi tamamla'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.tipText}>
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
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  goalTitle: {
    ...textStyles.heading2,
  },
  goalSubtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSoft,
  },
  progressRow: {
    marginTop: spacing.sm,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  progressBarFillZikr: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSoft,
  },
  tipText: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.textSoft,
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
    borderColor: colors.primarySoft,
  },
  quranToggleActive: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  quranTogglePressed: {
    backgroundColor: '#E5F2ED',
  },
  quranToggleText: {
    fontSize: 12,
    color: colors.textSoft,
  },
  quranToggleTextActive: {
    color: '#22C55E',
    fontWeight: '600',
  },
});

