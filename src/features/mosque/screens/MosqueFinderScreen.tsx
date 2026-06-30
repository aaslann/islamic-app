import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { AdBanner } from '../../../shared/components/AdBanner';

type Mosque = { id: string; name: string; address?: string; lat: number; lon: number; distanceKm: number };
type LoadState = 'idle' | 'loading' | 'success' | 'error' | 'permission-denied';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNextFriday(): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  d.setHours(12, 0, 0, 0);
  return d;
}

// overpass-api.de tek başına sık sık rate-limit/timeout verir; aynalar arasında sırayla dener.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapMosques(json: any, lat: number, lon: number): Mosque[] {
  return ((json?.elements ?? []) as any[])
    .map((el: any) => {
      const eLat = el.lat ?? el.center?.lat;
      const eLon = el.lon ?? el.center?.lon;
      if (eLat == null || eLon == null) return null;
      const tags = el.tags ?? {};
      return {
        id: String(el.id),
        name: tags['name:tr'] ?? tags.name ?? tags['name:en'] ?? 'İsimsiz Cami',
        address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(' ') || undefined,
        lat: eLat, lon: eLon,
        distanceKm: haversine(lat, lon, eLat, eLon),
      } as Mosque;
    })
    .filter((m): m is Mosque => m !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 25);
}

async function fetchNearbyMosques(lat: number, lon: number): Promise<Mosque[]> {
  const q = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon}););out center;`;
  let lastErr: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(q)}`,
        },
        25000,
      );
      if (!res.ok) { lastErr = new Error(`Overpass HTTP ${res.status}`); continue; }
      const json = await res.json();
      return mapMosques(json, lat, lon);
    } catch (e) {
      lastErr = e; // bu sunucu olmadı, sıradakini dene
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Overpass: tüm sunucular yanıt vermedi');
}

async function fetchFridayDhuhr(lat: number, lon: number): Promise<string> {
  try {
    const ts = Math.floor(getNextFriday().getTime() / 1000);
    const res = await fetch(`https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lon}&method=13&school=1`);
    const json = await res.json();
    return json.data?.timings?.Dhuhr ?? '';
  } catch { return ''; }
}

export default function MosqueFinderScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [fridayDhuhr, setFridayDhuhr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading'); setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoadState('permission-denied'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude, lon = loc.coords.longitude;
      setCoords({ lat, lon });
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geo[0]) setCityName(geo[0].city ?? geo[0].subregion ?? null);
      } catch {}
      const [mosqueList, dhuhr] = await Promise.all([fetchNearbyMosques(lat, lon), fetchFridayDhuhr(lat, lon)]);
      setMosques(mosqueList); setFridayDhuhr(dhuhr);
      setLoadState('success');
    } catch (e) {
      console.warn('[MosqueFinder] yükleme başarısız:', e);
      setErrorMsg('Cami verisi sunucusuna şu an ulaşılamadı. Lütfen tekrar deneyin.');
      setLoadState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fridayLabel = useMemo(() => {
    if (!fridayDhuhr) return null;
    return new Date().getDay() === 5 ? `Bugünkü Cuma öğle: ${fridayDhuhr}` : `Bu haftaki Cuma öğle: ${fridayDhuhr}`;
  }, [fridayDhuhr]);

  const openInMaps = (m: Mosque) => {
    // maps.google.com/maps?daddr= is universally understood by Google Maps app on Android
    // and falls back gracefully to browser on any platform
    const googleUrl = `https://maps.google.com/maps?daddr=${m.lat},${m.lon}`;
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://app?daddr=${m.lat},${m.lon}`)
        .catch(() => Linking.openURL(googleUrl));
    } else {
      Linking.openURL(googleUrl);
    }
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]} style={styles.hero}>
        <View style={styles.heroRow}>
          <Text style={{ fontSize: 36 }}>🕌</Text>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold400, letterSpacing: 1.2, marginBottom: 4 }}>CAMİ BULUCU</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>Yakındaki Camiler</Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.5)', marginTop: 2 }]}>
              {cityName ? `📍 ${cityName}` : '5 km yarıçapında Overpass API'}
            </Text>
          </View>
        </View>

        {/* Friday prayer banner */}
        {fridayLabel && (
          <View style={[styles.fridayBanner, { backgroundColor: `${palette.gold500}15`, borderColor: `${palette.gold500}30` }]}>
            <Text style={{ fontSize: 16 }}>🕋</Text>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: palette.gold400, letterSpacing: 0.8 }}>CUMA NAMAZI</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 2 }}>{fridayLabel}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Loading */}
      {loadState === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.gold500} />
          <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.md }]}>Konum ve camiler yükleniyor...</Text>
        </View>
      )}

      {/* Permission denied */}
      {loadState === 'permission-denied' && (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📍</Text>
          <Text style={[t.bodyBold, { color: '#fff', textAlign: 'center', marginBottom: spacing.sm }]}>Konum İzni Gerekli</Text>
          <Text style={[t.caption, { color: c.textSecondary, textAlign: 'center', marginBottom: spacing.lg }]}>
            Yakındaki camileri gösterebilmek için konum iznine ihtiyaç var.
          </Text>
          <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
            <Text style={[t.bodyBold, { color: '#fff' }]}>İzin Ver</Text>
          </Pressable>
        </View>
      )}

      {/* Error */}
      {loadState === 'error' && (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>⚠️</Text>
          <Text style={[t.body, { color: '#FCA5A5', textAlign: 'center', marginBottom: spacing.lg }]}>{errorMsg}</Text>
          <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
            <Text style={[t.bodyBold, { color: '#fff' }]}>Tekrar Dene</Text>
          </Pressable>
        </View>
      )}

      {/* Success */}
      {loadState === 'success' && (
        <>
          <View style={styles.listHeader}>
            <Text style={[t.heading2, { color: c.text }]}>
              {mosques.length > 0 ? `${mosques.length} cami bulundu` : 'Cami bulunamadı'}
            </Text>
            <Pressable onPress={load}>
              <Text style={{ fontSize: 12, color: palette.gold400, fontWeight: '700' }}>Yenile</Text>
            </Pressable>
          </View>

          {mosques.length === 0 && (
            <View style={styles.center}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={[t.body, { color: c.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                5 km içinde kayıtlı cami bulunamadı.
              </Text>
            </View>
          )}

          {mosques.map((m) => (
            <View key={m.id} style={[styles.mosqueCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.mosqueRow}>
                <View style={[styles.mosqueIcon, { backgroundColor: `${palette.green500}15` }]}>
                  <Text style={{ fontSize: 20 }}>🕌</Text>
                </View>
                <View style={styles.mosqueInfo}>
                  <Text style={[t.bodyBold, { color: c.text }]} numberOfLines={2}>{m.name}</Text>
                  {m.address && (
                    <Text style={[t.caption, { color: c.textSecondary, marginTop: 2 }]} numberOfLines={1}>{m.address}</Text>
                  )}
                </View>
                <View style={[styles.distBadge, { backgroundColor: `${palette.gold500}15` }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold400 }}>{m.distanceKm.toFixed(1)}</Text>
                  <Text style={{ fontSize: 9, color: palette.gold400 }}>km</Text>
                </View>
              </View>
              <Pressable
                onPress={() => openInMaps(m)}
                style={({ pressed }) => [styles.mapBtn, { borderColor: c.border }, pressed && { backgroundColor: c.primarySoft }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary }}>🗺 Haritada Aç</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <AdBanner />
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  content:     { paddingBottom: spacing.xxl },
  hero:        { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  heroRow:     { flexDirection: 'row', alignItems: 'center' },
  fridayBanner:{ flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, padding: spacing.md, marginTop: spacing.md },
  center:      { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, minHeight: 200 },
  retryBtn:    { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full },
  listHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  mosqueCard:  { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, ...shadows.card },
  mosqueRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  mosqueIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mosqueInfo:  { flex: 1 },
  distBadge:   { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.lg, alignItems: 'center' },
  mapBtn:      { marginTop: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
});
