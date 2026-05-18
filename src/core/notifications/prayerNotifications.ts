import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PrayerScheduleItem = { id: string; label: string; time: string };

// Shared key so PrayerTimesScreen can save and SettingsScreen can load cached times
export const PRAYER_SCHEDULE_KEY = '@prayer-schedule-v1';

const PRAYER_EMOJIS: Record<string, string> = {
  fajr: '🌅', sunrise: '🌄', dhuhr: '☀️', asr: '🌤', maghrib: '🌇', isha: '🌙',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyPrayerNotifications(prayers: PrayerScheduleItem[]): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const p of prayers) {
    const match = p.time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) continue;
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (isNaN(hour) || isNaN(minute)) continue;
    const emoji = PRAYER_EMOJIS[p.id.toLowerCase()] ?? '🕌';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${p.label} Namazı`,
        body: `${p.label} namazı vakti girdi.`,
        sound: true,
        data: { prayerId: p.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats: true,
      } as any,
    });
  }
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Call this when the notification toggle is turned ON in Settings.
// Reads the last-fetched prayer times from AsyncStorage and schedules them.
// Returns true if scheduling succeeded.
export async function scheduleFromCache(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_SCHEDULE_KEY);
    if (!raw) return false;
    const items = JSON.parse(raw) as PrayerScheduleItem[];
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await scheduleDailyPrayerNotifications(items);
    return true;
  } catch {
    return false;
  }
}
