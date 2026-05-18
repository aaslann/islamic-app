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

// Verified MP3 sources (Wikimedia Commons + archive.org)
// Wikimedia: direct HTTP 200, audio/mpeg. archive.org: 302→CDN, audio/mpeg — AVPlayer/ExoPlayer follow redirects.
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
    id: 'zahrani',
    label: 'Mansour Zahrani',
    region: 'Mekke · Sabah ezan tarzı',
    url: 'https://archive.org/download/adhan_fajr_mansour_zahrani/adhan_fajr_mansour_zahrani.mp3',
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
  } catch {
    // non-fatal — continue with default audio mode
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
    // Load with shouldPlay:false so we can check status before starting
    const { sound, status } = await Audio.Sound.createAsync(
      { uri: target.url },
      { shouldPlay: false, volume: 1.0 },
    );

    // Surface load errors that createAsync doesn't throw for
    if (!status.isLoaded) {
      const err = (status as any).error as string | undefined;
      sound.unloadAsync().catch(() => {});
      return { ok: false, error: err ?? 'Ses dosyası yüklenemedi. İnternet bağlantını kontrol et.' };
    }

    soundInstance = sound;
    sound.setOnPlaybackStatusUpdate((s) => {
      if (!s.isLoaded) {
        if (soundInstance === sound) soundInstance = null;
        return;
      }
      if (s.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (soundInstance === sound) soundInstance = null;
      }
    });

    // Explicit playAsync — more reliable than shouldPlay:true in createAsync options
    await sound.playAsync();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Ses oynatılamadı. İnternet bağlantını kontrol et.' };
  }
}

export async function stopAdhan(): Promise<void> {
  const s = soundInstance;
  soundInstance = null;
  if (s) {
    try { await s.stopAsync(); } catch {}
    try { await s.unloadAsync(); } catch {}
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
