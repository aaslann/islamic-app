import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/Card';
import { IslamicBackground } from '../components/IslamicBackground';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, textStyles } from '../theme/designSystem';

type PrayerTime = {
  id: string;
  label: string;
  time: string;
  isNext?: boolean;
};

type FetchState = 'idle' | 'loading' | 'success' | 'error' | 'permission-denied';

type LocationInfo = {
  city?: string;
  country?: string;
};

type DateInfo = {
  readable?: string;
  hijri?: string;
};

type ActivePrayer = {
  label: string;
  time: string;
  remainingText?: string;
};

async function getPrayerTimesFromApi() {
  // 1) Konum izni ve koordinatlar
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('permission-denied');
  }

  const position = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = position.coords;

  // 2) Ters geocode ile şehir/ülke bulma (mümkünse)
  let locationInfo: LocationInfo = {};
  try {
    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geo[0]) {
      locationInfo = {
        city: geo[0].city ?? geo[0].subregion ?? undefined,
        country: geo[0].country ?? undefined,
      };
    }
  } catch {
    // sessiz geç, sadece koordinatla devam
  }

  // 3) AlAdhan API ile vakitleri çekme
  // Doküman: https://aladhan.com/prayer-times-api
  const url = `https://api.aladhan.com/v1/timings/${Math.floor(
    Date.now() / 1000,
  )}?latitude=${latitude}&longitude=${longitude}&method=13`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('api-error');
  }

  const json = await response.json();
  if (!json || !json.data || !json.data.timings) {
    throw new Error('invalid-response');
  }

  const t = json.data.timings as Record<string, string>;

  const apiDate = json.data.date ?? {};
  const hijri = apiDate.hijri ?? {};
  const dateInfo: DateInfo = {
    readable: apiDate.readable,
    hijri: hijri.date ?? hijri.readable ?? undefined,
  };

  const times: PrayerTime[] = [
    { id: 'Fajr', label: 'İmsak', time: t.Fajr },
    { id: 'Sunrise', label: 'Güneş', time: t.Sunrise },
    { id: 'Dhuhr', label: 'Öğle', time: t.Dhuhr },
    { id: 'Asr', label: 'İkindi', time: t.Asr },
    { id: 'Maghrib', label: 'Akşam', time: t.Maghrib },
    { id: 'Isha', label: 'Yatsı', time: t.Isha },
  ];

  return { times, locationInfo, dateInfo };
}

export default function PrayerTimesScreen() {
  const [state, setState] = useState<FetchState>('idle');
  const [times, setTimes] = useState<PrayerTime[]>([]);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [now, setNow] = useState(new Date());
   const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);

  const loadTimes = async () => {
    setState('loading');
    setErrorMessage(null);
    try {
      const {
        times: fetchedTimes,
        locationInfo: info,
        dateInfo: fetchedDateInfo,
      } =
        await getPrayerTimesFromApi();
      setTimes(fetchedTimes);
      setLocationInfo(info);
      setDateInfo(fetchedDateInfo ?? null);
      setState('success');
    } catch (err) {
      if (err instanceof Error && err.message === 'permission-denied') {
        setState('permission-denied');
        setErrorMessage(
          'Konum izni verilmedi. Lütfen ayarlardan konum iznini aç ve tekrar dene.',
        );
      } else {
        setState('error');
        setErrorMessage(
          'Namaz vakitleri alınırken bir hata oluştu. Lütfen tekrar dene.',
        );
      }
    }
  };

  useEffect(() => {
    loadTimes();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem('app-settings-v1');
        if (raw) {
          const parsed = JSON.parse(raw) as { enablePrayerNotifications?: boolean };
          setNotificationsEnabled(!!parsed.enablePrayerNotifications);
        }
      } catch {
        setNotificationsEnabled(false);
      }
    };

    loadSettings();
  }, []);

  const scheduleNotificationsForToday = async () => {
    if (!notificationsEnabled) {
      setErrorMessage(
        'Bildirimler Ayarlar ekranında kapalı. Lütfen Ayarlar > Namaz Bildirimleri bölümünden aç.',
      );
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage(
          'Bildirim izni verilmedi. Lütfen cihaz ayarlarından bildirim iznini aç.',
        );
        return;
      }

      const now = new Date();
      const today = new Date();

      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const item of times) {
        const [hourStr, minuteStr] = item.time.split(':');
        const hour = Number(hourStr);
        const minute = Number(minuteStr);
        if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

        const triggerDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          hour,
          minute - 15 > 0 ? minute - 15 : minute,
          0,
        );

        if (triggerDate <= now) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Namaz Vakti Hatırlatıcı',
            body: `${item.label} vakti yaklaşıyor (${item.time}).`,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      }
    } catch {
      setErrorMessage(
        'Bildirimler planlanırken bir hata oluştu. Lütfen daha sonra tekrar dene.',
      );
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const showLoading = state === 'loading';
  const showError = state === 'error' || state === 'permission-denied';

  const { activePrayer, timesWithNext } = useMemo(() => {
    if (!times.length) {
      return { activePrayer: null as ActivePrayer | null, timesWithNext: [] as PrayerTime[] };
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const enriched = times.map((t) => {
      const [hourStr, minuteStr] = t.time.split(':');
      const hour = Number(hourStr);
      const minute = Number(minuteStr);

      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return { ...t, dateObj: null as Date | null };
      }

      const dateObj = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hour,
        minute,
        0,
      );

      return { ...t, dateObj };
    }) as Array<PrayerTime & { dateObj: Date | null }>;

    const upcomingForToday = enriched
      .filter((t) => t.dateObj && t.dateObj.getTime() >= now.getTime())
      .sort((a, b) => (a.dateObj!.getTime() - b.dateObj!.getTime()))[0];

    const next = upcomingForToday ?? enriched[0];

    const nextId = next.id;

    const timesWithNext: PrayerTime[] = enriched.map((t) => ({
      id: t.id,
      label: t.label,
      time: t.time,
      isNext: t.id === nextId,
    }));

    const remainingText =
      next.dateObj && next.dateObj.getTime() > now.getTime()
        ? formatRemaining(next.dateObj, now)
        : undefined;

    const activePrayer: ActivePrayer = {
      label: next.label,
      time: next.time,
      remainingText,
    };

    return { activePrayer, timesWithNext };
  }, [times, now]);

  function formatRemaining(target: Date, current: Date): string {
    const diffMs = target.getTime() - current.getTime();
    if (diffMs <= 0) {
      return 'vakit girdi';
    }
    const totalMinutes = Math.round(diffMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) {
      return `${minutes} dk`;
    }
    if (minutes === 0) {
      return `${hours} sa`;
    }
    return `${hours} sa ${minutes} dk`;
  }

  return (
    <IslamicBackground>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <ActivePrayerCard
            activePrayer={activePrayer}
            locationInfo={locationInfo}
            loading={showLoading}
            fetchState={state}
            dateInfo={dateInfo}
            onRefresh={loadTimes}
          />

          <Card style={styles.prayerListCard}>
            {showError && (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <PrimaryButton
                  label="Tekrar dene"
                  onPress={loadTimes}
                />
              </View>
            )}

            {state === 'success' && (
              <>
                <Text style={styles.listTitle}>Bugünkü vakitler</Text>
                <View style={styles.list}>
                  {timesWithNext.map((item) => (
                    <PrayerListItem key={item.id} item={item} />
                  ))}
                </View>
              </>
            )}
          </Card>

          {state === 'success' && (
            <View style={styles.actionsRow}>
              <PrimaryButton
                label="Bildirimleri Bugün İçin Planla"
                onPress={scheduleNotificationsForToday}
                disabled={!notificationsEnabled}
              />
              {!notificationsEnabled && (
                <Text style={styles.notifyHint}>
                  Namaz bildirimlerini Ayarlar ekranından açman gerekiyor.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

type ActivePrayerCardProps = {
  activePrayer: ActivePrayer | null;
  locationInfo: LocationInfo;
  loading: boolean;
  fetchState: FetchState;
  dateInfo: DateInfo | null;
  onRefresh: () => void;
};

function ActivePrayerCard({
  activePrayer,
  locationInfo,
  loading,
  fetchState,
  dateInfo,
  onRefresh,
}: ActivePrayerCardProps) {
  const locationText = (() => {
    if (fetchState === 'loading') {
      return 'Konum alınıyor...';
    }
    if (fetchState === 'permission-denied') {
      return 'Konum izni kapalı. Ayarlar ekranından açabilirsin.';
    }
    if (fetchState === 'error') {
      return 'Konum alınamadı, son bilinen vakitler gösteriliyor.';
    }
    if (locationInfo.city || locationInfo.country) {
      return `Konum: ${locationInfo.city ?? ''}${
        locationInfo.country ? `, ${locationInfo.country}` : ''
      }`;
    }
    return 'Konum bilgisi yok';
  })();

  const dateLine = (() => {
    if (!dateInfo) return null;
    if (dateInfo.hijri && dateInfo.readable) {
      return `${dateInfo.hijri} • ${dateInfo.readable}`;
    }
    return dateInfo.readable ?? dateInfo.hijri ?? null;
  })();

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.activeCard}
    >
      <Text style={styles.activeLocation}>
        {locationText}
      </Text>
      {dateLine && (
        <Text style={styles.activeDate}>
          {dateLine}
        </Text>
      )}
      <Text style={styles.activeLabel}>Sıradaki vakit</Text>
      {loading || !activePrayer ? (
        <ActivityIndicator size="small" color={colors.primarySoft} />
      ) : (
        <>
          <Text style={styles.activeTime}>{activePrayer.time}</Text>
          <Text style={styles.activeName}>{activePrayer.label}</Text>
          {activePrayer.remainingText && (
            <Text style={styles.activeRemaining}>
              Kalan: {activePrayer.remainingText}
            </Text>
          )}
        </>
      )}
      <Text style={styles.refreshLink} onPress={onRefresh}>
        Vakitleri yenile
      </Text>
    </LinearGradient>
  );
}

type PrayerListItemProps = {
  item: PrayerTime;
};

function PrayerListItem({ item }: PrayerListItemProps) {
  return (
    <View
      style={[
        styles.row,
        item.isNext && styles.rowActive,
      ]}
    >
      <Text style={styles.label}>{item.label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.time}>{item.time}</Text>
        {item.isNext && <Text style={styles.badge}>Sıradaki</Text>}
      </View>
    </View>
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
  },
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  activeCard: {
    borderRadius: 24,
    padding: spacing.xl,
  },
  activeLocation: {
    ...textStyles.caption,
    color: colors.primarySoft,
  },
  activeDate: {
    marginTop: spacing.xs,
    ...textStyles.caption,
    color: colors.primarySoft,
  },
  activeLabel: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  activeTime: {
    marginTop: spacing.sm,
    ...textStyles.hero,
    color: colors.white,
  },
  activeName: {
    marginTop: spacing.xs,
    ...textStyles.body,
    color: colors.primarySoft,
  },
  activeRemaining: {
    marginTop: spacing.sm,
    ...textStyles.caption,
    color: colors.primarySoft,
  },
  refreshLink: {
    marginTop: spacing.md,
    ...textStyles.caption,
    color: colors.primarySoft,
    textDecorationLine: 'underline',
  },
  centerBox: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...textStyles.caption,
    color: colors.textSoft,
  },
  errorText: {
    ...textStyles.caption,
    color: '#DC2626',
    textAlign: 'center',
  },
  prayerListCard: {
    padding: spacing.lg,
  },
  listTitle: {
    ...textStyles.heading2,
    fontSize: 16,
  },
  list: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowActive: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...textStyles.body,
    fontSize: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  time: {
    ...textStyles.body,
    fontWeight: '500',
  },
  badge: {
    fontSize: 13,
    color: colors.primaryDark,
  },
  actionsRow: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  notifyHint: {
    ...textStyles.caption,
    color: colors.textSoft,
  },
});

