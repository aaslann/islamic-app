import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

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

  const times: PrayerTime[] = [
    { id: 'Fajr', label: 'İmsak', time: t.Fajr },
    { id: 'Sunrise', label: 'Güneş', time: t.Sunrise },
    { id: 'Dhuhr', label: 'Öğle', time: t.Dhuhr },
    { id: 'Asr', label: 'İkindi', time: t.Asr },
    { id: 'Maghrib', label: 'Akşam', time: t.Maghrib },
    { id: 'Isha', label: 'Yatsı', time: t.Isha },
  ];

  return { times, locationInfo };
}

export default function PrayerTimesScreen() {
  const [state, setState] = useState<FetchState>('idle');
  const [times, setTimes] = useState<PrayerTime[]>([]);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadTimes = async () => {
    setState('loading');
    setErrorMessage(null);
    try {
      const { times: fetchedTimes, locationInfo: info } =
        await getPrayerTimesFromApi();

      // Basitçe "Öğle"yi sıradaki olarak işaretleyelim (ileride gerçek hesap eklenebilir)
      const marked = fetchedTimes.map((t) =>
        t.id === 'Dhuhr' ? { ...t, isNext: true } : t,
      );

      setTimes(marked);
      setLocationInfo(info);
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

  const showLoading = state === 'loading';
  const showError = state === 'error' || state === 'permission-denied';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Bugünkü Namaz Vakitleri</Text>
        {locationInfo.city && (
          <Text style={styles.locationText}>
            Konum: {locationInfo.city}
            {locationInfo.country ? `, ${locationInfo.country}` : ''}
          </Text>
        )}

        {showLoading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.infoText}>Namaz vakitleri yükleniyor...</Text>
          </View>
        )}

        {showError && (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable
              onPress={loadTimes}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {state === 'success' && (
          <View style={styles.list}>
            {times.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  item.isNext && styles.rowNext,
                ]}
              >
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.time}>{item.time}</Text>
                  {item.isNext && (
                    <Text style={styles.badge}>Sıradaki</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {state === 'success' && (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={scheduleNotificationsForToday}
              style={({ pressed }) => [
                styles.notifyButton,
                !notificationsEnabled && styles.notifyButtonDisabled,
                pressed && styles.notifyButtonPressed,
              ]}
              disabled={!notificationsEnabled}
            >
              <Text style={styles.notifyButtonText}>
                Bildirimleri Bugün İçin Planla
              </Text>
            </Pressable>
          </View>
        )}
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
  },
  card: {
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
  locationText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  centerBox: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  retryButtonPressed: {
    backgroundColor: '#0EA5E9',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1120',
  },
  list: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#111827',
  },
  rowNext: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  label: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 14,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  badge: {
    fontSize: 11,
    color: '#38BDF8',
  },
  actionsRow: {
    marginTop: 16,
  },
  notifyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  notifyButtonDisabled: {
    opacity: 0.5,
  },
  notifyButtonPressed: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  notifyButtonText: {
    fontSize: 13,
    color: '#38BDF8',
  },
});

