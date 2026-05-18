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

// LICENSE-VERIFIED sources only:
//   Sabah Fakhry  — Wikimedia Commons, Public Domain (PD)
//   Aaqib Azeez   — Wikimedia Commons, CC BY-SA 4.0 (attribution required; we stream from
//                   Wikimedia servers so no redistribution; in-app credit in SettingsScreen)
//
// REMOVED (no explicit license on archive.org = all rights reserved by default):
//   Mansour Zahrani, Sawt-ı Ezan / Nasser Al-Qattami
export const MUEZZIN_OPTIONS: Muezzin[] = [
  {
    id: 'sabah',
    label: 'Sabah Fakhry',
    region: 'Suriye · Şam tarzı · Kamu malı',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Call_to_prayer_by_Sabah_Fakhry.mp3',
  },
  {
    id: 'aaqib',
    label: 'Aaqib Azeez',
    region: 'Klasik · CC BY-SA 4.0',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3',
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

async function _playAdhanInner(target: Muezzin): Promise<PlayResult> {
  try {
    console.warn('[adhan] createAsync start:', target.id, target.url.slice(0, 60));
    const { sound, status } = await Audio!.Sound.createAsync(
      { uri: target.url },
      { shouldPlay: false, volume: 1.0 },
    );
    console.warn('[adhan] createAsync done, isLoaded:', status.isLoaded);

    if (!status.isLoaded) {
      const err = (status as any).error as string | undefined;
      sound.unloadAsync().catch(() => {});
      return { ok: false, error: `Yükleme hatası: ${err ?? 'bilinmiyor'}` };
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

    await sound.playAsync();
    console.warn('[adhan] playAsync ok');
    return { ok: true };
  } catch (e: any) {
    console.warn('[adhan] error:', e?.message ?? e);
    return { ok: false, error: e?.message ?? 'Ses oynatılamadı. İnternet bağlantını kontrol et.' };
  }
}

export async function playAdhan(muezzin?: Muezzin): Promise<PlayResult> {
  console.warn('[adhan] playAdhan called, Audio loaded:', Audio !== null, 'platform:', Platform.OS);
  if (!Audio) return { ok: false, error: 'expo-av modülü yüklenemedi (Audio=null). Dev build gerekebilir.' };

  await stopAdhan();
  await ensureAudioMode();

  const target = muezzin ?? (await getSelectedMuezzin());

  // Race the actual load against a 20-second timeout
  const timeout: Promise<PlayResult> = new Promise((resolve) =>
    setTimeout(
      () => resolve({ ok: false, error: 'Zaman aşımı (20s) — ses yüklenemedi. Bağlantını kontrol et.' }),
      20_000,
    ),
  );

  return Promise.race([_playAdhanInner(target), timeout]);
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
