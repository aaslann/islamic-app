import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../core/theme/ThemeContext';
import { spacing } from '../../../core/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

const STORAGE_KEY = 'prayer-log-v1';

type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PrayerStatus = 'none' | 'prayed' | 'qada';

type DayLog = Record<PrayerId, PrayerStatus>;
type LogState = Record<string, DayLog>; // key: YYYY-MM-DD

const PRAYERS: { id: PrayerId; label: string }[] = [
  { id: 'fajr', label: 'Sabah' },
  { id: 'dhuhr', label: 'Öğle' },
  { id: 'asr', label: 'İkindi' },
  { id: 'maghrib', label: 'Akşam' },
  { id: 'isha', label: 'Yatsı' },
];

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatDateHuman(date: Date) {
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function PrayerLogScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [log, setLog] = useState<LogState>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LogState;
          setLog(parsed);
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };

    load();
  }, []);

  const persist = async (next: LogState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const dateKey = formatDateKey(selectedDate);
  const dayLog: DayLog =
    log[dateKey] ?? {
      fajr: 'none',
      dhuhr: 'none',
      asr: 'none',
      maghrib: 'none',
      isha: 'none',
    };

  const handleChangeDay = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + delta);
    setSelectedDate(next);
  };

  const handleToggleStatus = (id: PrayerId) => {
    const currentStatus = dayLog[id] ?? 'none';
    const nextStatus: PrayerStatus =
      currentStatus === 'none'
        ? 'prayed'
        : currentStatus === 'prayed'
        ? 'qada'
        : 'none';

    const nextDay: DayLog = {
      ...dayLog,
      [id]: nextStatus,
    };

    const nextLog: LogState = {
      ...log,
      [dateKey]: nextDay,
    };

    setLog(nextLog);
    persist(nextLog);
  };

  const prayedCount = PRAYERS.filter((p) => dayLog[p.id] === 'prayed').length;
  const qadaCount = PRAYERS.filter((p) => dayLog[p.id] === 'qada').length;

  return (
    <IslamicBackground>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[styles.card, styles.headerCard]}>
          <Text style={[t.heading1, { color: c.text }]}>Namaz Hatıra Defteri</Text>
          <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
            Hangi gün hangi vakitleri kıldığını veya kaza ettiğini işaretle;
            düzenini zaman içinde takip et.
          </Text>

          <View style={styles.dateRow}>
            <Pressable
              onPress={() => handleChangeDay(-1)}
              style={({ pressed }) => [
                styles.dateButton,
                { borderColor: c.primarySoft },
                pressed && { backgroundColor: '#E5F2ED' },
              ]}
            >
              <Text style={{ fontSize: 16, color: c.textSecondary }}>{'‹'}</Text>
            </Pressable>
            <View style={styles.dateCenter}>
              <Text style={[t.body, { fontWeight: '600', color: c.text }]}>{formatDateHuman(selectedDate)}</Text>
              <Text style={{ marginTop: spacing.xs, fontSize: 11, color: c.textSecondary }}>{dateKey}</Text>
            </View>
            <Pressable
              onPress={() => handleChangeDay(1)}
              style={({ pressed }) => [
                styles.dateButton,
                { borderColor: c.primarySoft },
                pressed && { backgroundColor: '#E5F2ED' },
              ]}
            >
              <Text style={{ fontSize: 16, color: c.textSecondary }}>{'›'}</Text>
            </Pressable>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[t.caption, { color: c.textSecondary }]}>
              Kılınan: {prayedCount} / {PRAYERS.length}
            </Text>
            <Text style={[t.caption, { color: c.textSecondary }]}>Kaza: {qadaCount}</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(34, 197, 94, 0.9)', borderColor: c.primarySoft }]} />
              <Text style={[t.caption, { color: c.textSecondary }]}>Kılındı</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(234, 179, 8, 0.9)', borderColor: c.primarySoft }]} />
              <Text style={[t.caption, { color: c.textSecondary }]}>Kaza</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'transparent', borderColor: c.primarySoft }]} />
              <Text style={[t.caption, { color: c.textSecondary }]}>Belirtilmedi</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={[styles.list, { borderColor: c.primarySoft }]}>
            {PRAYERS.map((p) => {
              const status = dayLog[p.id];
              return (
                <Pressable
                  key={p.id}
                  onPress={() => handleToggleStatus(p.id)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: c.surface, borderBottomColor: c.primarySoft },
                    status === 'prayed' && { backgroundColor: 'rgba(34, 197, 94, 0.08)' },
                    status === 'qada' && { backgroundColor: 'rgba(234, 179, 8, 0.08)' },
                    pressed && { backgroundColor: '#F1F5F3' },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[t.body, { color: c.text }]}>{p.label}</Text>
                    <Text style={[t.caption, { marginTop: 2, color: c.textSecondary }]}>
                      Sırayla: Kılındı → Kaza → Boş
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.statusPill, { borderColor: c.primarySoft }]}>
                      <Text style={[t.caption, { color: c.textSecondary }]}>
                        {status === 'none'
                          ? 'Belirtilmedi'
                          : status === 'prayed'
                          ? 'Kılındı'
                          : 'Kaza'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {!isLoaded && (
            <Text style={[t.caption, { marginTop: spacing.sm, color: c.textSecondary }]}>
              Kayıtlar yükleniyor, lütfen bekle...
            </Text>
          )}
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
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dateRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  summaryRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  list: {
    marginTop: spacing.lg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
