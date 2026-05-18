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
export const ADHAN_MUEZZIN_KEY = '@adhan-muezzin-v1';

export type Muezzin = {
  id: string;
  label: string;
  region: string;
  url: string;
};

// Kamu erişimine açık ezan sesleri (CC / public domain kaynaklar)
export const MUEZZIN_OPTIONS: Muezzin[] = [
  {
    id: 'mecca',
    label: 'Mekke (Mescid-i Haram)',
    region: 'Suudi Arabistan',
    url: 'https://server8.mp3quran.net/ahmad_huth/Almasshaf-Al-Mojawwad/072.mp3',
  },
  {
    id: 'madinah',
    label: 'Medine (Mescid-i Nebevî)',
    region: 'Suudi Arabistan',
    url: 'https://server8.mp3quran.net/afs/072.mp3',
  },
  {
    id: 'istanbul',
    label: 'Sultanahmet (İstanbul)',
    region: 'Türkiye',
    url: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
  },
  {
    id: 'egypt',
    label: 'Mısır Tarzı',
    region: 'Kahire',
    url: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
  },
];

let soundInstance: any | null = null;

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

export async function playAdhan(muezzin?: Muezzin): Promise<void> {
  if (!Audio || Platform.OS === 'web') return;

  await stopAdhan();

  const target = muezzin ?? (await getSelectedMuezzin());

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      allowsRecordingIOS: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: target.url },
      { shouldPlay: true, volume: 1.0 },
    );
    soundInstance = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (soundInstance === sound) soundInstance = null;
      }
    });
  } catch {
    // playback failed; ignore — notification still fires
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

export async function previewAdhan(muezzin: Muezzin, seconds = 10): Promise<void> {
  await playAdhan(muezzin);
  setTimeout(() => {
    stopAdhan().catch(() => {});
  }, seconds * 1000);
}
