import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy-load expo-av to avoid native module crashes when missing
let Audio: typeof import('expo-av').Audio | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-av').Audio;
} catch {
  Audio = null;
}

export const ADHAN_ENABLED_KEY = '@adhan-enabled-v1';
export const ADHAN_MUEZZIN_KEY = '@adhan-muezzin-v2';

export type Muezzin = {
  id: string;
  label: string;
  region: string;
  url: string;
};

// Doğrulanmış MP3 kaynaklar (Wikimedia Commons + archive.org)
export const MUEZZIN_OPTIONS: Muezzin[] = [
  {
    id: 'aaqib',
    label: 'Aaqib Azeez',
    region: 'Klasik · Geleneksel okuyuş',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3',
  },
  {
    id: 'sabah',
    label: 'Sabah Fakhry',
    region: 'Suriye · Şam tarzı',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Call_to_prayer_by_Sabah_Fakhry.mp3',
  },
  {
    id: 'esam',
    label: 'Şeyh Esam Khan',
    region: 'Sade · Mahzun okuyuş',
    url: 'https://archive.org/download/ABeautifulAzanSheikhEsamKhan/mp3',
  },
  {
    id: 'sawt',
    label: 'Sawt-ı Ezan',
    region: 'Klasik Arap tarzı',
    url: 'https://archive.org/download/SawtAzan/new2.mp3',
  },
];

let soundInstance: any | null = null;
let audioModeSet = false;

export async function isAdhanEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ADHAN_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setAdhanEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ADHAN_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export async function getSelectedMuezzin(): Promise<Muezzin> {
  try {
    const id = await AsyncStorage.getItem(ADHAN_MUEZZIN_KEY);
    const found = MUEZZIN_OPTIONS.find((m) => m.id === id);
    return found ?? MUEZZIN_OPTIONS[0];
  } catch {
    return MUEZZIN_OPTIONS[0];
  }
}

export async function setSelectedMuezzin(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ADHAN_MUEZZIN_KEY, id);
  } catch {}
}

async function ensureAudioMode() {
  if (!Audio || audioModeSet) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      allowsRecordingIOS: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeSet = true;
  } catch (e) {
    // Audio mode setup failed, but try playback anyway
    if (__DEV__) console.warn('[adhan] setAudioModeAsync failed:', e);
  }
}

export type PlayResult = { ok: true } | { ok: false; error: string };

export async function playAdhan(muezzin?: Muezzin): Promise<PlayResult> {
  if (!Audio) return { ok: false, error: 'expo-av yüklü değil. Önce npx expo install expo-av çalıştır.' };
  if (Platform.OS === 'web') return { ok: false, error: 'Web platformunda ezan oynatılamaz.' };

  await stopAdhan();
  await ensureAudioMode();

  const target = muezzin ?? (await getSelectedMuezzin());

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: target.url },
      { shouldPlay: true, volume: 1.0 },
    );
    soundInstance = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        const err = (status as any).error;
        if (err && __DEV__) console.warn('[adhan] playback error:', err);
        return;
      }
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (soundInstance === sound) soundInstance = null;
      }
    });
    return { ok: true };
  } catch (e: any) {
    if (__DEV__) console.warn('[adhan] createAsync failed:', e?.message ?? e);
    return { ok: false, error: e?.message ?? 'Bilinmeyen hata. İnternet bağlantını kontrol et.' };
  }
}

export async function stopAdhan(): Promise<void> {
  const s = soundInstance;
  soundInstance = null;
  if (s) {
    try {
      await s.stopAsync();
    } catch {}
    try {
      await s.unloadAsync();
    } catch {}
  }
}

export async function previewAdhan(muezzin: Muezzin, seconds = 15): Promise<PlayResult> {
  const result = await playAdhan(muezzin);
  if (result.ok) {
    setTimeout(() => {
      stopAdhan().catch(() => {});
    }, seconds * 1000);
  }
  return result;
}
