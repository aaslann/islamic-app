import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import {
  PRAYER_SCHEDULE_KEY,
  scheduleDailyPrayerNotifications,
  scheduleFromCache,
} from '../../../core/notifications/prayerNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

type PrayerTime = { id: string; label: string; time: string; isNext?: boolean };
type FetchState = 'idle' | 'loading' | 'success' | 'error' | 'permission-denied' | 'location-disabled' | 'location-timeout';
type LocationInfo = { city?: string; country?: string };
type DateInfo = { readable?: string; hijri?: string };
type ActivePrayer = { currentLabel: string; currentTime: string; nextLabel: string; nextTime: string; untilNextText?: string; untilCurrentEndsText?: string; progress?: number };
type Coords = { lat: number; lon: number };
type CachedLocation = { coords: Coords; locationInfo: LocationInfo; timestamp: string };
type CachedTimes = {
  times: PrayerTime[];
  locationInfo: LocationInfo;
  dateInfo: DateInfo | null;
  coords: Coords | null;
  dateKey: string;   // YYYY-MM-DD — bu vakitlerin hangi güne ait olduğu
  timestamp: string; // ISO — en son ne zaman güncellendiği
};

const LAST_LOCATION_KEY = 'last-location-v1';
const PRAYER_TIMES_CACHE_KEY = 'prayer-times-cache-v1';

/** Yerel tarihi YYYY-MM-DD biçiminde döndürür. */
function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Çevrimdışı banner için "bugün 14:32" / "21 Haz 09:10" gibi okunaklı metin. */
function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (localDateKey(d) === localDateKey(new Date())) return `bugün ${time}`;
    const date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `${date} ${time}`;
  } catch {
    return '';
  }
}

async function saveTimesCache(r: { times: PrayerTime[]; locationInfo: LocationInfo; dateInfo: DateInfo | null; coords: Coords | null }) {
  try {
    const payload: CachedTimes = {
      times: r.times,
      locationInfo: r.locationInfo,
      dateInfo: r.dateInfo,
      coords: r.coords,
      dateKey: localDateKey(new Date()),
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

async function loadTimesCache(): Promise<CachedTimes | null> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_TIMES_CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CachedTimes;
    if (!c?.times?.length) return null;
    return c;
  } catch {
    return null;
  }
}

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
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function withTimeout<T>(p: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => { setTimeout(() => reject(new Error(code)), ms); })]);
}

async function getPrayerTimesFromApi(opts?: { coords?: Coords; locationInfo?: LocationInfo }) {
  let latitude: number;
  let longitude: number;
  let locationInfo: LocationInfo = opts?.locationInfo ?? {};

  if (opts?.coords) {
    latitude = opts.coords.lat;
    longitude = opts.coords.lon;
  } else {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) throw new Error('location-disabled');
    } catch {}
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('permission-denied');
    const lastKnown = await Location.getLastKnownPositionAsync();
    try {
      const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 12_000, 'location-timeout');
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    } catch (e) {
      if (lastKnown) { latitude = lastKnown.coords.latitude; longitude = lastKnown.coords.longitude; }
      else throw e;
    }
    try {
      const geo = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), 5_000, 'geocode-timeout');
      if (geo[0]) locationInfo = { city: geo[0].city ?? geo[0].subregion ?? undefined, country: geo[0].country ?? undefined };
    } catch {}
  }

  const url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${latitude}&longitude=${longitude}&method=13`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('api-error');
  const json = await response.json();
  if (!json?.data?.timings) throw new Error('invalid-response');
  const t = json.data.timings as Record<string, string>;
  const apiDate = json.data.date ?? {};
  const hijri = apiDate.hijri ?? {};
  const dateInfo: DateInfo = { readable: apiDate.readable, hijri: hijri.date ?? hijri.readable ?? undefined };
  const times: PrayerTime[] = [
    { id: 'Fajr', label: 'İmsak', time: t.Fajr },
    { id: 'Sunrise', label: 'Güneş', time: t.Sunrise },
    { id: 'Dhuhr', label: 'Öğle', time: t.Dhuhr },
    { id: 'Asr', label: 'İkindi', time: t.Asr },
    { id: 'Maghrib', label: 'Akşam', time: t.Maghrib },
    { id: 'Isha', label: 'Yatsı', time: t.Isha },
  ];
  return { times, locationInfo, dateInfo, coords: { lat: latitude, lon: longitude } as Coords };
}

export default function PrayerTimesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [state, setState] = useState<FetchState>('idle');
  const [times, setTimes] = useState<PrayerTime[]>([]);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const [coords, setCoords] = useState<Coords | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [now, setNow] = useState(new Date());
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [usedCachedLocation, setUsedCachedLocation] = useState(false);
  const [offlineInfo, setOfflineInfo] = useState<{ timestamp: string; stale: boolean } | null>(null);

  const loadTimes = async () => {
    let cached: CachedLocation | null = null;
    setState('loading'); setErrorMessage(null); setUsedCachedLocation(false); setOfflineInfo(null);
    try {
      try {
        const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
        if (raw) cached = JSON.parse(raw) as CachedLocation;
      } catch { cached = null; }

      const { times: fetchedTimes, locationInfo: info, dateInfo: fd, coords: fc } = await getPrayerTimesFromApi();
      setTimes(fetchedTimes); setLocationInfo(info); setDateInfo(fd ?? null); setCoords(fc ?? null);
      setState('success');
      try { await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ coords: fc, locationInfo: info, timestamp: new Date().toISOString() } satisfies CachedLocation)); } catch {}
      // Çevrimdışı kullanım için vakitlerin kendisini de önbelleğe al.
      await saveTimesCache({ times: fetchedTimes, locationInfo: info, dateInfo: fd ?? null, coords: fc ?? null });

      // Persist prayer schedule (excluding Sunrise) so Settings toggle can use it
      const scheduleItems = fetchedTimes
        .filter((p) => p.id !== 'Sunrise')
        .map((p) => ({ id: p.id, label: p.label, time: p.time }));
      try { await AsyncStorage.setItem(PRAYER_SCHEDULE_KEY, JSON.stringify(scheduleItems)); } catch {}

      // Auto-schedule if the user already has notifications enabled in settings
      try {
        const settingsRaw = await AsyncStorage.getItem('app-settings-v2');
        if (settingsRaw) {
          const s = JSON.parse(settingsRaw);
          if (s.enablePrayerNotifications) await scheduleFromCache();
        }
      } catch {}
    } catch (err) {
      const code = err instanceof Error ? err.message : 'error';
      if ((code === 'location-timeout' || code === 'location-disabled') && cached) {
        try {
          const r = await getPrayerTimesFromApi({ coords: cached.coords, locationInfo: cached.locationInfo });
          setTimes(r.times); setLocationInfo(cached.locationInfo); setDateInfo(r.dateInfo ?? null); setCoords(cached.coords);
          setUsedCachedLocation(true); setState('success');
          await saveTimesCache({ times: r.times, locationInfo: cached.locationInfo, dateInfo: r.dateInfo ?? null, coords: cached.coords });
          return;
        } catch {}
      }

      // ── ÇEVRİMDIŞI FALLBACK ──
      // İnternet yoksa veya API'ye ulaşılamıyorsa, en son kaydedilen vakitleri göster.
      // Eski bir güne ait olsa bile "hiç göstermemekten" iyidir; banner ile uyarılır.
      // İzin reddinde bunu yapmayız: kullanıcının izni açması gereken eylemli mesaj gösterilir.
      const offline = code === 'permission-denied' ? null : await loadTimesCache();
      if (offline) {
        setTimes(offline.times);
        setLocationInfo(offline.locationInfo);
        setDateInfo(offline.dateInfo);
        setCoords(offline.coords);
        setOfflineInfo({ timestamp: offline.timestamp, stale: offline.dateKey !== localDateKey(new Date()) });
        setState('success');
        return;
      }

      if (code === 'permission-denied') { setState('permission-denied'); setErrorMessage('Konum izni verilmedi. Lütfen ayarlardan konum iznini aç.'); }
      else if (code === 'location-disabled') { setState('location-disabled'); setErrorMessage('Konum servisleri kapalı görünüyor.'); }
      else if (code === 'location-timeout') { setState('location-timeout'); setErrorMessage('Konum alınması çok uzun sürdü.'); }
      else { setState('error'); setErrorMessage('Namaz vakitleri alınırken bir hata oluştu.'); }
    }
  };

  useEffect(() => { loadTimes(); }, []);
  useEffect(() => {
    AsyncStorage.getItem('app-settings-v2').then((raw) => {
      if (raw) { const p = JSON.parse(raw); setNotificationsEnabled(!!p.enablePrayerNotifications); }
    });
  }, []);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);


  const { activePrayer, timesWithNext } = useMemo(() => {
    if (!times.length) return { activePrayer: null as ActivePrayer | null, timesWithNext: [] as PrayerTime[] };
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const enriched = times.map((pt) => ({ ...pt, dateObj: parseTimeToDate(pt.time, today) }))
      .filter((pt): pt is PrayerTime & { dateObj: Date } => !!pt.dateObj)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    if (!enriched.length) return { activePrayer: null as ActivePrayer | null, timesWithNext: [] as PrayerTime[] };
    const upcoming = enriched.find((pt) => pt.dateObj.getTime() > now.getTime());
    const next = upcoming ?? enriched[0];
    const nextIndex = enriched.findIndex((pt) => pt.id === next.id);
    const beforeOrEqual = [...enriched].reverse().find((pt) => pt.dateObj.getTime() <= now.getTime());
    const current = beforeOrEqual ?? enriched[enriched.length - 1];
    const currentIndex = enriched.findIndex((pt) => pt.id === current.id);
    const nextStart = (nextIndex <= currentIndex && upcoming == null)
      ? new Date(next.dateObj.getTime() + 86400000) : next.dateObj;
    const msToNext = nextStart.getTime() - now.getTime();
    const durationMs = Math.max(nextStart.getTime() - current.dateObj.getTime(), 1);
    const elapsedMs = Math.min(Math.max(now.getTime() - current.dateObj.getTime(), 0), durationMs);
    return {
      activePrayer: { currentLabel: current.label, currentTime: current.time, nextLabel: next.label, nextTime: next.time, untilNextText: formatCountdown(msToNext), untilCurrentEndsText: formatCountdown(msToNext), progress: elapsedMs / durationMs },
      timesWithNext: times.map((pt) => ({ ...pt, isNext: pt.id === next.id })),
    };
  }, [times, now]);

  const locationText = (() => {
    if (state === 'loading') return 'Konum alınıyor...';
    if (locationInfo.city || locationInfo.country) return `📍 ${locationInfo.city ?? ''}${locationInfo.country ? `, ${locationInfo.country}` : ''}`;
    if (coords) return `📍 ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`;
    return '📍 Konum bilgisi yok';
  })();

  const showError = ['error', 'permission-denied', 'location-disabled', 'location-timeout'].includes(state);

  return (
    <IslamicBackground>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Next prayer hero card */}
        <LinearGradient
          colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={[t.caption, { color: 'rgba(255,255,255,.6)', marginBottom: spacing.xs }]}>{locationText}</Text>
          {dateInfo?.hijri && <Text style={[t.caption, { color: 'rgba(255,255,255,.45)', marginBottom: spacing.sm }]}>{dateInfo.hijri}{dateInfo.readable ? ` · ${dateInfo.readable}` : ''}</Text>}

          {offlineInfo && (
            <View style={styles.offlinePill}>
              <Text style={{ fontSize: 13 }}>📴</Text>
              <Text style={[t.caption, { color: palette.gold300, flex: 1 }]}>
                {offlineInfo.stale
                  ? `Çevrimdışısınız — bu vakitler güncel olmayabilir (son güncelleme ${formatUpdatedAt(offlineInfo.timestamp)})`
                  : `Çevrimdışı gösterim — son güncelleme ${formatUpdatedAt(offlineInfo.timestamp)}`}
              </Text>
            </View>
          )}

          {state === 'loading' ? (
            <ActivityIndicator size="large" color={palette.gold500} style={{ marginVertical: spacing.xl }} />
          ) : state === 'success' && activePrayer ? (
            <>
              {/* Next prayer highlight */}
              <View style={[styles.nextCard, { borderColor: `${palette.gold500}40` }]}>
                <View>
                  <Text style={[t.caption, { color: palette.gold400, fontWeight: '700' }]}>Sıradaki Namaz</Text>
                  <Text style={[{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginTop: 4 }]}>{activePrayer.nextLabel}</Text>
                  <Text style={[t.caption, { color: 'rgba(255,255,255,.45)', marginTop: 2 }]}>{activePrayer.untilNextText} kaldı</Text>
                </View>
                <Text style={[{ fontSize: 32, fontWeight: '800', color: palette.gold400, letterSpacing: -1 }]}>{activePrayer.nextTime}</Text>
              </View>

              {/* Current window progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[t.caption, { color: 'rgba(255,255,255,.5)' }]}>Şu anki: {activePrayer.currentLabel} ({activePrayer.currentTime})</Text>
                  <Text style={[t.caption, { color: 'rgba(255,255,255,.5)' }]}>{Math.round((activePrayer.progress ?? 0) * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient colors={[palette.green500, palette.gold500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${Math.round((activePrayer.progress ?? 0) * 100)}%` }]} />
                </View>
              </View>
            </>
          ) : null}

          {showError && <Text style={[t.caption, { color: '#FCA5A5', marginTop: spacing.sm }]}>{errorMessage}</Text>}
          <Pressable onPress={loadTimes} style={styles.refreshBtn}>
            <Text style={[t.captionBold, { color: palette.gold400 }]}>↻ Vakitleri Yenile</Text>
          </Pressable>
        </LinearGradient>

        {/* Prayer list */}
        {state === 'success' && (
          <View style={[styles.listCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[t.heading2, { color: c.text, marginBottom: spacing.md }]}>Bugünkü Vakitler</Text>
            {timesWithNext.map((item, i) => (
              <View key={item.id} style={[styles.prayerRow, item.isNext && { backgroundColor: `${palette.green500}18`, borderColor: `${palette.green500}35` }, i < timesWithNext.length - 1 && !item.isNext && styles.prayerRowDivider]}>
                <View style={[styles.prayerDot, { backgroundColor: item.isNext ? palette.green300 : c.border }]} />
                <Text style={[t.bodyBold, { color: item.isNext ? c.primary : c.text, flex: 1 }]}>{item.label}</Text>
                <Text style={[t.bodyBold, { color: item.isNext ? c.primary : c.textSecondary }]}>{item.time}</Text>
                {item.isNext && <Text style={{ fontSize: 14, marginLeft: spacing.sm }}>🔔</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Progress summary */}
        {state === 'success' && (
          <View style={[styles.summaryCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>Günlük İlerleme</Text>
            <View style={styles.progressTrack}>
              <LinearGradient colors={[palette.green500, palette.gold500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${Math.round((activePrayer?.progress ?? 0) * 100)}%` }]} />
            </View>
            <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.xs }]}>3 / 5 kılındı (tahmini)</Text>
          </View>
        )}

        {/* Notification status */}
        {state === 'success' && (
          <View style={[styles.notifStatus, { backgroundColor: notificationsEnabled ? `${palette.green500}18` : `${palette.gold500}12`, borderColor: notificationsEnabled ? `${palette.green500}35` : `${palette.gold500}30` }]}>
            <Text style={{ fontSize: 14 }}>{notificationsEnabled ? '🔔' : '🔕'}</Text>
            <Text style={[t.caption, { color: notificationsEnabled ? palette.green300 : c.textSecondary, flex: 1, marginLeft: spacing.sm }]}>
              {notificationsEnabled
                ? 'Namaz bildirimleri aktif — her gün otomatik planlanır'
                : 'Bildirimler kapalı · Ayarlar\'dan açabilirsin'}
            </Text>
          </View>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: 'transparent' },
  content:          { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  heroCard:         { borderRadius: radii.xl, padding: spacing.lg, ...shadows.strong },
  nextCard:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, backgroundColor: 'rgba(200,162,74,.08)' },
  progressSection:  { marginTop: spacing.md },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressTrack:    { height: 6, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,.12)', overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: radii.full },
  refreshBtn:       { marginTop: spacing.md, alignSelf: 'flex-start', padding: spacing.xs },
  offlinePill:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: 'rgba(200,162,74,0.12)', borderWidth: 1, borderColor: 'rgba(200,162,74,0.3)' },
  listCard:         { borderRadius: radii.xl, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  prayerRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', marginBottom: 4 },
  prayerRowDivider: { borderBottomWidth: 0 },
  prayerDot:        { width: 8, height: 8, borderRadius: 4, marginRight: spacing.md },
  summaryCard:      { borderRadius: radii.xl, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  notifStatus:      { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md },
});
