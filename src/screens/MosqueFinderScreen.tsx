import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';

type Mosque = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lon: number;
  distanceKm: number;
};

type AladhanResponse = {
  data?: {
    timings?: {
      Dhuhr?: string;
    };
  };
};

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getNextFriday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 pazar, 5 cuma
  const diff = (5 - day + 7) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function fetchFridayDhuhr(lat: number, lon: number): Promise<string> {
  try {
    const friday = getNextFriday(new Date());
    const timestamp = Math.floor(friday.getTime() / 1000);
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=13&school=1`;
    const res = await fetch(url);
    const json = (await res.json()) as AladhanResponse;
    const dhuhr = json.data?.timings?.Dhuhr;
    return dhuhr ?? '';
  } catch {
    return '';
  }
}

async function fetchNearbyMosques(
  lat: number,
  lon: number,
  radiusMeters = 3000,
): Promise<Mosque[]> {
  try {
    const overpassQuery = `
    [out:json];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery,
      )}`,
    );

    const json = await res.json();

    const elements = (json.elements ?? []) as Array<{
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;

    const list: Mosque[] = elements
      .map((el) => {
        const centerLat = el.lat ?? el.center?.lat;
        const centerLon = el.lon ?? el.center?.lon;
        if (centerLat == null || centerLon == null) return null;

        const tags = el.tags ?? {};
        const name =
          tags['name:tr'] ??
          tags.name ??
          tags['name:en'] ??
          'İsimsiz Cami / Mescit';

        const addressParts = [
          tags['addr:street'],
          tags['addr:housenumber'],
          tags['addr:city'],
        ].filter(Boolean);

        const address =
          addressParts.length > 0 ? addressParts.join(' ') : undefined;

        const distanceKm = haversineDistanceKm(
          lat,
          lon,
          centerLat,
          centerLon,
        );

        return {
          id: String(el.id),
          name,
          address,
          lat: centerLat,
          lon: centerLon,
          distanceKm,
        } as Mosque;
      })
      .filter((m): m is Mosque => m !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return list;
  } catch {
    return [];
  }
}

export default function MosqueFinderScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [fridayDhuhr, setFridayDhuhr] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError(
            'Konum izni verilmedi. Yakındaki camileri ve Cuma saatini gösterebilmek için konum iznine ihtiyaç var.',
          );
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        if (cancelled) return;
        setCoords({ lat, lon });

        const [mosquesResult, dhuhr] = await Promise.all([
          fetchNearbyMosques(lat, lon),
          fetchFridayDhuhr(lat, lon),
        ]);

        if (cancelled) return;

        setMosques(mosquesResult);
        setFridayDhuhr(dhuhr);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(
            'Veriler yüklenirken bir sorun oluştu. İnternet bağlantını kontrol edip tekrar deneyebilirsin.',
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const fridayLabel = useMemo(() => {
    if (!fridayDhuhr) return '';
    const isTodayFriday = new Date().getDay() === 5;
    if (isTodayFriday) {
      return `Bugünkü Cuma (öğle) vakti: ${fridayDhuhr}`;
    }
    return `Bu haftaki Cuma (öğle) vakti: ${fridayDhuhr}`;
  }, [fridayDhuhr]);

  const handleOpenInMaps = (mosque: Mosque) => {
    const { lat, lon, name } = mosque;
    const label = encodeURIComponent(name);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const url =
        Platform.OS === 'ios'
          ? `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`
          : `geo:${lat},${lon}?q=${label}`;
      Linking.openURL(url);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${label}`;
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <Text style={styles.title}>Cami Bulucu</Text>
        <Text style={styles.subtitle}>
          Konumuna en yakın camileri ve bu haftaki Cuma vakit bilgisini gör.
          Yol tarifi için harita uygulamasını açabilirsin.
        </Text>

        {coords && (
          <Text style={styles.coordsText}>
            Konum: {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
          </Text>
        )}

        {fridayLabel ? (
          <View style={styles.fridayBox}>
            <Text style={styles.fridayLabel}>Cuma Saati</Text>
            <Text style={styles.fridayValue}>{fridayLabel}</Text>
            <Text style={styles.fridayHint}>
              Cuma namazı vakti, öğle (Zuhr) vaktine göre gösterilmektedir.
            </Text>
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Yakındaki Camiler</Text>
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.infoText}>Konum ve camiler yükleniyor...</Text>
          </View>
        )}
        {error && !loading && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        {!loading && !error && mosques.length === 0 && (
          <Text style={styles.infoText}>
            Yakınında kayıtlı cami veya mescit bulunamadı. Yarıçapı artırmak
            veya daha sonra tekrar denemek isteyebilirsin.
          </Text>
        )}

        {!loading &&
          !error &&
          mosques.map((m) => (
            <View key={m.id} style={styles.mosqueCard}>
              <View style={styles.mosqueHeader}>
                <Text style={styles.mosqueName}>{m.name}</Text>
                <Text style={styles.mosqueDistance}>
                  {m.distanceKm.toFixed(1)} km
                </Text>
              </View>
              {m.address ? (
                <Text style={styles.mosqueAddress}>{m.address}</Text>
              ) : null}
              <Pressable
                onPress={() => handleOpenInMaps(m)}
                style={({ pressed }) => [
                  styles.mapButton,
                  pressed && styles.mapButtonPressed,
                ]}
              >
                <Text style={styles.mapButtonText}>Haritada Aç</Text>
              </Pressable>
            </View>
          ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  coordsText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSoft,
  },
  sectionTitle: {
    ...textStyles.heading2,
  },
  centerBox: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...textStyles.caption,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: '#FCA5A5',
  },
  fridayBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  fridayLabel: {
    fontSize: 12,
    color: colors.textSoft,
  },
  fridayValue: {
    marginTop: spacing.xs,
    ...textStyles.body,
    fontWeight: '600',
  },
  fridayHint: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSoft,
  },
  mosqueCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  mosqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mosqueName: {
    ...textStyles.body,
    fontWeight: '600',
  },
  mosqueDistance: {
    fontSize: 12,
    color: colors.textSoft,
  },
  mosqueAddress: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSoft,
  },
  mapButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  mapButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryDark,
  },
});

