import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';
import { IslamicBackground } from '../components/IslamicBackground';

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
          <Text style={styles.title}>Namaz Hatıra Defteri</Text>
          <Text style={styles.subtitle}>
            Hangi gün hangi vakitleri kıldığını veya kaza ettiğini işaretle;
            düzenini zaman içinde takip et.
          </Text>

          <View style={styles.dateRow}>
            <Pressable
              onPress={() => handleChangeDay(-1)}
              style={({ pressed }) => [
                styles.dateButton,
                pressed && styles.dateButtonPressed,
              ]}
            >
              <Text style={styles.dateButtonText}>{'‹'}</Text>
            </Pressable>
            <View style={styles.dateCenter}>
              <Text style={styles.dateText}>{formatDateHuman(selectedDate)}</Text>
              <Text style={styles.dateKeyText}>{dateKey}</Text>
            </View>
            <Pressable
              onPress={() => handleChangeDay(1)}
              style={({ pressed }) => [
                styles.dateButton,
                pressed && styles.dateButtonPressed,
              ]}
            >
              <Text style={styles.dateButtonText}>{'›'}</Text>
            </Pressable>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Kılınan: {prayedCount} / {PRAYERS.length}
            </Text>
            <Text style={styles.summaryText}>Kaza: {qadaCount}</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotPrayed]} />
              <Text style={styles.legendText}>Kılındı</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotQada]} />
              <Text style={styles.legendText}>Kaza</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotNone]} />
              <Text style={styles.legendText}>Belirtilmedi</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.list}>
            {PRAYERS.map((p) => {
              const status = dayLog[p.id];
              return (
                <Pressable
                  key={p.id}
                  onPress={() => handleToggleStatus(p.id)}
                  style={({ pressed }) => [
                    styles.row,
                    status === 'prayed' && styles.rowPrayed,
                    status === 'qada' && styles.rowQada,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowLabel}>{p.label}</Text>
                    <Text style={styles.rowHint}>
                      Sırayla: Kılındı → Kaza → Boş
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>
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
            <Text style={styles.infoText}>
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
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
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
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonPressed: {
    backgroundColor: '#E5F2ED',
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.textSoft,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  dateKeyText: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSoft,
  },
  summaryRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    ...textStyles.caption,
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
    borderColor: colors.primarySoft,
  },
  legendDotPrayed: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  legendDotQada: {
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
  },
  legendDotNone: {
    backgroundColor: 'transparent',
  },
  legendText: {
    ...textStyles.caption,
  },
  list: {
    marginTop: spacing.lg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.primarySoft,
  },
  rowPressed: {
    backgroundColor: '#F1F5F3',
  },
  rowPrayed: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  rowQada: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  rowLabel: {
    ...textStyles.body,
  },
  rowLeft: {
    flex: 1,
  },
  rowHint: {
    marginTop: 2,
    ...textStyles.caption,
    color: colors.textSoft,
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
    borderColor: colors.primarySoft,
  },
  statusText: {
    ...textStyles.caption,
  },
  infoText: {
    marginTop: spacing.sm,
    ...textStyles.caption,
  },
});

