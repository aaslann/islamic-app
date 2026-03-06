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

type FetchState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'permission-denied'
  | 'location-disabled'
  | 'location-timeout';

type LocationInfo = {
  city?: string;
  country?: string;
};

type DateInfo = {
  readable?: string;
  hijri?: string;
};

type ActivePrayer = {
  currentLabel: string;
  currentTime: string;
  nextLabel: string;
  nextTime: string;
  untilNextText?: string; // next enters
  untilCurrentEndsText?: string; // current exits
  progress?: number; // 0..1 for current window
};

type Coords = { lat: number; lon: number };
type CachedLocation = {
  coords: Coords;
  locationInfo: LocationInfo;
  timestamp: string; // ISO
};

const LAST_LOCATION_KEY = 'last-location-v1';

function parseTimeToDate(timeStr: string, base: Date): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute, 0);
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function withTimeout<T>(p: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(code)), ms);
    }),
  ]);
}

async function getPrayerTimesFromApi(opts?: {
  coords?: Coords;
  locationInfo?: LocationInfo;
}) {
  let latitude: number;
  let longitude: number;
  let locationInfo: LocationInfo = opts?.locationInfo ?? {};

  // 1) Konum izni ve koordinatlar (override yoksa)
  if (opts?.coords) {
    latitude = opts.coords.lat;
    longitude = opts.coords.lon;
  } else {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error('location-disabled');
      }
    } catch {
      // bazı platformlarda desteklenmeyebilir; yok say
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('permission-denied');
    }

    const lastKnown = await Location.getLastKnownPositionAsync();
    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        12_000,
        'location-timeout',
      );
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    } catch (e) {
      if (lastKnown) {
        latitude = lastKnown.coords.latitude;
        longitude = lastKnown.coords.longitude;
      } else {
        throw e;
      }
    }

    // 2) Ters geocode ile şehir/ülke (mümkünse) + timeout
    try {
      const geo = await withTimeout(
        Location.reverseGeocodeAsync({ latitude, longitude }),
        5_000,
        'geocode-timeout',
      );
      if (geo[0]) {
        locationInfo = {
          city: geo[0].city ?? geo[0].subregion ?? undefined,
          country: geo[0].country ?? undefined,
        };
      }
    } catch {
      // sessiz geç, sadece koordinatla devam
    }
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

  return {
    times,
    locationInfo,
    dateInfo,
    coords: { lat: latitude, lon: longitude } as Coords,
  };
}

export default function PrayerTimesScreen() {
  const [state, setState] = useState<FetchState>('idle');
  const [times, setTimes] = useState<PrayerTime[]>([]);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const [coords, setCoords] = useState<Coords | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [now, setNow] = useState(new Date());
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [usedCachedLocation, setUsedCachedLocation] = useState(false);

  const loadTimes = async () => {
    let cached: CachedLocation | null = null;
    setState('loading');
    setErrorMessage(null);
    setUsedCachedLocation(false);
    try {
      try {
        const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
        if (raw) cached = JSON.parse(raw) as CachedLocation;
      } catch {
        cached = null;
      }

      const {
        times: fetchedTimes,
        locationInfo: info,
        dateInfo: fetchedDateInfo,
        coords: fetchedCoords,
      } =
        await getPrayerTimesFromApi();
      setTimes(fetchedTimes);
      setLocationInfo(info);
      setDateInfo(fetchedDateInfo ?? null);
      setCoords(fetchedCoords ?? null);
      setState('success');

      // cache son başarılı konum
      try {
        await AsyncStorage.setItem(
          LAST_LOCATION_KEY,
          JSON.stringify({
            coords: fetchedCoords,
            locationInfo: info,
            timestamp: new Date().toISOString(),
          } satisfies CachedLocation),
        );
      } catch {
        // ignore
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : 'error';

      // canlı konum alınamazsa: cache ile vakit çekmeyi dene
      if (
        (code === 'location-timeout' || code === 'location-disabled') &&
        cached
      ) {
        try {
          const r = await getPrayerTimesFromApi({
            coords: cached.coords,
            locationInfo: cached.locationInfo,
          });
          setTimes(r.times);
          setLocationInfo(cached.locationInfo);
          setDateInfo(r.dateInfo ?? null);
          setCoords(cached.coords);
          setUsedCachedLocation(true);
          setState('success');
          return;
        } catch {
          // fall through
        }
      }

      if (err instanceof Error && err.message === 'permission-denied') {
        setState('permission-denied');
        setErrorMessage(
          'Konum izni verilmedi. Lütfen ayarlardan konum iznini aç ve tekrar dene.',
        );
      } else if (err instanceof Error && err.message === 'location-disabled') {
        setState('location-disabled');
        setErrorMessage(
          'Konum servisleri kapalı görünüyor. Konumu açıp tekrar deneyebilirsin.',
        );
      } else if (err instanceof Error && err.message === 'location-timeout') {
        setState('location-timeout');
        setErrorMessage(
          'Konum alınması çok uzun sürdü. İnternet/GPS durumunu kontrol edip tekrar dene.',
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
        const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const prayerDate = parseTimeToDate(item.time, base);
        if (!prayerDate) continue;

        const triggerDate = new Date(prayerDate.getTime());
        triggerDate.setMinutes(triggerDate.getMinutes() - 15);

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
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const showLoading = state === 'loading';
  const showError =
    state === 'error' ||
    state === 'permission-denied' ||
    state === 'location-disabled' ||
    state === 'location-timeout';

  const { activePrayer, timesWithNext } = useMemo(() => {
    if (!times.length) {
      return { activePrayer: null as ActivePrayer | null, timesWithNext: [] as PrayerTime[] };
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const enriched = times
      .map((t) => ({ ...t, dateObj: parseTimeToDate(t.time, today) }))
      .filter((t): t is PrayerTime & { dateObj: Date } => !!t.dateObj)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (enriched.length === 0) {
      return { activePrayer: null as ActivePrayer | null, timesWithNext: [] as PrayerTime[] };
    }

    // next = first prayer time after now (or first of day if all passed)
    const upcoming = enriched.find((t) => t.dateObj.getTime() > now.getTime());
    const next = upcoming ?? enriched[0];
    const nextIndex = enriched.findIndex((t) => t.id === next.id);

    // current = last prayer time at or before now (or last of day if before first)
    const beforeOrEqual = [...enriched].reverse().find((t) => t.dateObj.getTime() <= now.getTime());
    const current = beforeOrEqual ?? enriched[enriched.length - 1];
    const currentIndex = enriched.findIndex((t) => t.id === current.id);

    // current end = next start; if next wraps to next day, add 1 day
    const currentStart = current.dateObj;
    const nextStartBase = next.dateObj;
    const nextStart =
      nextIndex <= currentIndex && upcoming == null
        ? new Date(nextStartBase.getTime() + 24 * 60 * 60 * 1000)
        : nextStartBase;

    const msToNext = nextStart.getTime() - now.getTime();
    const untilNextText = formatCountdown(msToNext);
    const untilCurrentEndsText = formatCountdown(msToNext);

    const durationMs = Math.max(nextStart.getTime() - currentStart.getTime(), 1);
    const elapsedMs = Math.min(Math.max(now.getTime() - currentStart.getTime(), 0), durationMs);
    const progress = elapsedMs / durationMs;

    const timesWithNext: PrayerTime[] = times.map((t) => ({
      ...t,
      isNext: t.id === next.id,
    }));

    const activePrayer: ActivePrayer = {
      currentLabel: current.label,
      currentTime: current.time,
      nextLabel: next.label,
      nextTime: next.time,
      untilNextText,
      untilCurrentEndsText,
      progress,
    };

    return { activePrayer, timesWithNext };
  }, [times, now]);

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
            coords={coords}
            loading={showLoading}
            fetchState={state}
            dateInfo={dateInfo}
            onRefresh={loadTimes}
            usedCachedLocation={usedCachedLocation}
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
  coords: Coords | null;
  loading: boolean;
  fetchState: FetchState;
  dateInfo: DateInfo | null;
  onRefresh: () => void;
  usedCachedLocation: boolean;
};

function ActivePrayerCard({
  activePrayer,
  locationInfo,
  coords,
  loading,
  fetchState,
  dateInfo,
  onRefresh,
  usedCachedLocation,
}: ActivePrayerCardProps) {
  const locationText = (() => {
    if (fetchState === 'loading') {
      return 'Konum alınıyor...';
    }
    if (fetchState === 'permission-denied') {
      return 'Konum izni kapalı. Ayarlar ekranından açabilirsin.';
    }
    if (fetchState === 'location-disabled') {
      return 'Konum servisleri kapalı görünüyor.';
    }
    if (fetchState === 'location-timeout') {
      return 'Konum alınamadı (zaman aşımı).';
    }
    if (fetchState === 'error') {
      return 'Konum alınamadı, son bilinen vakitler gösteriliyor.';
    }
    if (locationInfo.city || locationInfo.country) {
      return `Konum: ${locationInfo.city ?? ''}${
        locationInfo.country ? `, ${locationInfo.country}` : ''
      }`;
    }
    if (coords) {
      return `Konum: ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`;
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
      {usedCachedLocation && (
        <Text style={styles.cacheNote}>
          Son bilinen konum kullanıldı
        </Text>
      )}
      {dateLine && (
        <Text style={styles.activeDate}>
          {dateLine}
        </Text>
      )}
      <Text style={styles.activeLabel}>Vakit Durumu</Text>
      {loading || !activePrayer ? (
        <ActivityIndicator size="small" color={colors.primarySoft} />
      ) : (
        <>
          <View style={styles.heroBox}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroKicker}>Şu anki vakit</Text>
                <Text style={styles.heroPrayerName}>{activePrayer.currentLabel}</Text>
              </View>
              <View style={styles.heroRight}>
                <Text style={styles.heroMetaLabel}>Başlangıç</Text>
                <Text style={styles.heroMetaValue}>{activePrayer.currentTime}</Text>
              </View>
            </View>

            <Text style={styles.heroCountdownLabel}>Vaktin çıkmasına</Text>
            <Text style={styles.heroCountdownValue}>
              {activePrayer.untilCurrentEndsText ?? '—'}
            </Text>

            <View style={styles.progressTrack} pointerEvents="none">
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round((activePrayer.progress ?? 0) * 100)}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.nextBox}>
            <View style={styles.nextRow}>
              <View style={styles.nextLeft}>
                <Text style={styles.countdownKicker}>Sıradaki</Text>
                <Text style={styles.countdownTitle}>{activePrayer.nextLabel}</Text>
                <Text style={styles.countdownMeta}>{activePrayer.nextTime}</Text>
              </View>
              <View style={styles.nextRight}>
                <Text style={styles.nextCountdownLabel}>Girmesine</Text>
                <Text style={styles.nextCountdownValue}>
                  {activePrayer.untilNextText ?? '—'}
                </Text>
              </View>
            </View>
          </View>
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
  cacheNote: {
    marginTop: spacing.xs,
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
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
  countdownGrid: {
    // legacy (kept for compatibility; not used in current layout)
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroBox: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroLeft: {
    flex: 1,
  },
  heroRight: {
    alignItems: 'flex-end',
  },
  heroKicker: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.82)',
  },
  heroPrayerName: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.4,
  },
  heroMetaLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.72)',
  },
  heroMetaValue: {
    marginTop: 2,
    ...textStyles.body,
    fontWeight: '700',
    color: colors.primarySoft,
  },
  heroCountdownLabel: {
    marginTop: spacing.md,
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.78)',
  },
  heroCountdownValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '900',
    color: colors.primarySoft,
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  countdownBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  countdownBoxAlt: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  countdownKicker: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.82)',
  },
  countdownTitle: {
    marginTop: 2,
    ...textStyles.body,
    fontWeight: '700',
    color: colors.white,
  },
  countdownMeta: {
    marginTop: 2,
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  countdownValue: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primarySoft,
    letterSpacing: 0.2,
  },
  progressTrack: {
    marginTop: spacing.md,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentGold,
    opacity: 0.9,
  },
  nextBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nextLeft: {
    flex: 1,
  },
  nextRight: {
    alignItems: 'flex-end',
  },
  nextCountdownLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.72)',
  },
  nextCountdownValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
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

