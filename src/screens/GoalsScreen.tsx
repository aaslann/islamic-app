import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Hedeflerim</Text>
        <Text style={styles.subtitle}>
          Namaz, zikir ve Kur&apos;an hedeflerini takip et. Bazı hedefler günlük,
          bazıları ise seri (streak) şeklindedir.
        </Text>
      </View>

      <View style={styles.card}>
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
      </View>

      <View style={styles.card}>
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
      </View>

      <View style={styles.card}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#9CA3AF',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  goalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressRow: {
    marginTop: 10,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  progressBarFillZikr: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#E5E7EB',
  },
  tipText: {
    marginTop: 8,
    fontSize: 11,
    color: '#9CA3AF',
  },
  row: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quranToggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#4B5563',
  },
  quranToggleActive: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  quranTogglePressed: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  quranToggleText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  quranToggleTextActive: {
    color: '#22C55E',
    fontWeight: '600',
  },
});

