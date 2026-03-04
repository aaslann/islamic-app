import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

type QiblaState = 'loading' | 'success' | 'permission-denied' | 'sensor-unavailable' | 'error';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function computeQiblaBearing(lat: number, lon: number) {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const lambda1 = toRad(lon);
  const lambda2 = toRad(KAABA_LON);

  const y = Math.sin(lambda2 - lambda1);
  const x =
    Math.cos(phi1) * Math.tan(phi2) -
    Math.sin(phi1) * Math.cos(lambda2 - lambda1);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function computeHeadingFromMagnetometer(data: { x: number; y: number; z: number } | null) {
  if (!data) return null;
  let heading = Math.atan2(data.y, data.x);
  heading = toDeg(heading);
  heading = (heading + 360) % 360;
  return heading;
}

export default function QiblaScreen() {
  const [state, setState] = useState<QiblaState>('loading');
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let magnetoSub: { remove: () => void } | null = null;

    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setState('permission-denied');
          setErrorMessage(
            'Konum izni verilmedi. Kıble yönü için lütfen konum iznini aç.',
          );
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        const bearing = computeQiblaBearing(latitude, longitude);
        setQiblaBearing(bearing);

        magnetoSub = Magnetometer.addListener((data) => {
          const h = computeHeadingFromMagnetometer(data);
          if (h != null) {
            setHeading(h);
          }
        });

        await Magnetometer.setUpdateInterval(500);
        setState('success');
      } catch {
        setState('error');
        setErrorMessage(
          'Kıble yönü hesaplanırken bir hata oluştu. Cihaz sensörleri desteklemiyor olabilir.',
        );
      }
    };

    init();

    return () => {
      if (magnetoSub) {
        magnetoSub.remove();
      }
    };
  }, []);

  const difference =
    qiblaBearing != null && heading != null
      ? (qiblaBearing - heading + 360) % 360
      : null;

  const pointerRotationDeg = difference ?? 0;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Kıble Yönü</Text>
        <Text style={styles.subtitle}>
          Telefonunu düz tut, mümkünse pusulayı kalibre et (∞ hareketi yap).
        </Text>

        {state === 'loading' && (
          <Text style={styles.infoText}>Kıble yönü hesaplanıyor...</Text>
        )}

        {(state === 'error' || state === 'permission-denied') && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        {state === 'success' && qiblaBearing != null && (
          <>
            <View style={styles.compassContainer}>
              <View style={styles.compassCircle}>
                <View style={styles.northMark}>
                  <Text style={styles.northText}>N</Text>
                </View>
                <View
                  style={[
                    styles.qiblaPointer,
                    {
                      transform: [
                        { rotate: `${pointerRotationDeg}deg` },
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.details}>
              {heading != null && (
                <Text style={styles.detailText}>
                  Cihaz yönü: {heading.toFixed(0)}°
                </Text>
              )}
              <Text style={styles.detailText}>
                Kıble açısı: {qiblaBearing.toFixed(0)}°
              </Text>
              {difference != null && (
                <Text style={styles.detailText}>
                  Fark: {difference.toFixed(0)}° (oku Ka&apos;be istikametine
                  çevir)
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoText: {
    marginTop: 16,
    fontSize: 13,
    color: '#9CA3AF',
  },
  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: '#FCA5A5',
  },
  compassContainer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  northMark: {
    position: 'absolute',
    top: 8,
  },
  northText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  qiblaPointer: {
    position: 'absolute',
    width: 4,
    height: 80,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    bottom: 110,
  },
  details: {
    marginTop: 16,
  },
  detailText: {
    fontSize: 13,
    color: '#E5E7EB',
    marginTop: 2,
  },
});

