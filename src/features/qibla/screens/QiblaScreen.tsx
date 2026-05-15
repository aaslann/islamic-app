import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, spacing } from '../../../core/theme/tokens';

type QiblaState = 'loading' | 'success' | 'permission-denied' | 'sensor-unavailable' | 'error';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function toDeg(rad: number) { return (rad * 180) / Math.PI; }

function computeQiblaBearing(lat: number, lon: number) {
  const phi1 = toRad(lat), phi2 = toRad(KAABA_LAT);
  const lambda1 = toRad(lon), lambda2 = toRad(KAABA_LON);
  const y = Math.sin(lambda2 - lambda1);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lambda2 - lambda1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function computeHeading(data: { x: number; y: number } | null) {
  if (!data) return null;
  return (toDeg(Math.atan2(data.y, data.x)) + 360) % 360;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QiblaScreen() {
  const { theme } = useTheme();
  const t = theme.text;

  const [state, setState] = useState<QiblaState>('loading');
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);

  useEffect(() => {
    let magnetoSub: { remove: () => void } | null = null;
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setState('permission-denied');
          setErrorMessage('Konum izni verilmedi. Kıble yönü için lütfen konum iznini aç.');
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        setQiblaBearing(computeQiblaBearing(latitude, longitude));
        setDistanceKm(haversineKm(latitude, longitude, KAABA_LAT, KAABA_LON));
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo[0]) setCityName(geo[0].city ?? geo[0].subregion ?? null);
        } catch {}
        magnetoSub = Magnetometer.addListener((data) => {
          const h = computeHeading(data);
          if (h != null) setHeading(h);
        });
        await Magnetometer.setUpdateInterval(300);
        setState('success');
      } catch {
        setState('error');
        setErrorMessage('Kıble yönü hesaplanırken bir hata oluştu.');
      }
    };
    init();
    return () => { if (magnetoSub) magnetoSub.remove(); };
  }, []);

  const difference = qiblaBearing != null && heading != null ? (qiblaBearing - heading + 360) % 360 : null;
  const pointerRot = difference ?? 0;
  const isAligned = difference != null && (difference < 5 || difference > 355);

  const compassRings = [240, 200, 160];

  return (
    <LinearGradient
      colors={['#081A12', '#0D2C1E', '#0A1F15', '#0D1F18']}
      start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      style={styles.root}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[t.caption, { color: palette.gold400, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.xs }]}>🕋 KİBLE YÖNİ</Text>
        {cityName && <Text style={[t.caption, { color: 'rgba(255,255,255,.4)' }]}>📍 {cityName}</Text>}
      </View>

      {/* Compass */}
      <View style={styles.compassSection}>
        {state === 'loading' && (
          <View style={styles.loadingWrap}>
            <Text style={[t.body, { color: 'rgba(255,255,255,.5)', textAlign: 'center' }]}>Kıble yönü hesaplanıyor...</Text>
          </View>
        )}

        {(state === 'error' || state === 'permission-denied') && (
          <View style={styles.loadingWrap}>
            <Text style={[t.body, { color: '#FCA5A5', textAlign: 'center' }]}>{errorMessage}</Text>
          </View>
        )}

        {state === 'success' && (
          <View style={styles.compassWrap}>
            {/* Outer decorative rings */}
            {compassRings.map((size, i) => (
              <View key={i} style={[styles.compassRing, { width: size, height: size, borderRadius: size / 2, opacity: 0.15 - i * 0.04 }]} />
            ))}

            {/* Main compass */}
            <View style={styles.compassMain}>
              {/* Cardinal directions */}
              {[
                { label: 'K', deg: 0 },
                { label: 'D', deg: 90 },
                { label: 'G', deg: 180 },
                { label: 'B', deg: 270 },
              ].map(({ label, deg }) => (
                <View key={label} style={[styles.cardinal, { transform: [{ rotate: `${deg}deg` }] }]}>
                  <Text style={[styles.cardinalText, label === 'K' && { color: '#FF6B6B' }]}>{label}</Text>
                </View>
              ))}

              {/* Qibla needle */}
              <View style={[styles.needleWrap, { transform: [{ rotate: `${pointerRot}deg` }] }]}>
                <View style={styles.needleTop} />
                <View style={styles.needleBottom} />
              </View>

              {/* Center dot */}
              <View style={[styles.centerDot, isAligned && { backgroundColor: palette.green300 }]} />
            </View>

            {/* Alignment indicator */}
            {isAligned && (
              <View style={styles.alignedBadge}>
                <Text style={[{ fontSize: 12, fontWeight: '800', color: palette.green300 }]}>✓ Kıble İstikameti</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Info panel */}
      {state === 'success' && (
        <View style={styles.infoPanel}>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Kıble Açısı</Text>
              <Text style={styles.infoValue}>{qiblaBearing?.toFixed(0)}°</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cihaz Yönü</Text>
              <Text style={styles.infoValue}>{heading?.toFixed(0) ?? '—'}°</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mekke Mesafesi</Text>
              <Text style={styles.infoValue}>{distanceKm ? `${Math.round(distanceKm).toLocaleString('tr-TR')} km` : '—'}</Text>
            </View>
          </View>
          <Text style={[t.caption, { color: 'rgba(255,255,255,.3)', textAlign: 'center', marginTop: spacing.md }]}>
            Telefonunu düz tut · Kalibre etmek için ∞ hareketi yap
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, alignItems: 'center', paddingTop: spacing.lg },
  header:        { alignItems: 'center', paddingBottom: spacing.lg },
  compassSection: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  loadingWrap:   { padding: spacing.xl },
  compassWrap:   { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  compassRing:   { position: 'absolute', borderWidth: 1, borderColor: palette.gold500 },
  compassMain:   { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(15,61,46,.25)', borderWidth: 2, borderColor: `${palette.gold500}40`, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardinal:      { position: 'absolute', top: 8, left: '50%', marginLeft: -8, width: 16, alignItems: 'center', transformOrigin: '8px 102px' as any },
  cardinalText:  { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,.5)' },
  needleWrap:    { position: 'absolute', alignItems: 'center', height: 160, justifyContent: 'center' },
  needleTop:     { width: 4, height: 80, borderRadius: 2, backgroundColor: palette.gold500 },
  needleBottom:  { width: 4, height: 80, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.2)' },
  centerDot:     { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: palette.gold500, borderWidth: 2, borderColor: '#fff' },
  alignedBadge:  { marginTop: spacing.lg, backgroundColor: `${palette.green500}25`, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1, borderColor: `${palette.green400}50` },
  infoPanel:     { width: '100%', padding: spacing.lg, paddingBottom: spacing.xxl },
  infoCard:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', overflow: 'hidden' },
  infoItem:      { flex: 1, alignItems: 'center', padding: spacing.md },
  infoLabel:     { fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  infoValue:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  infoDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,.08)' },
});
