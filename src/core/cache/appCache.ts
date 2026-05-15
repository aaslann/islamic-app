import AsyncStorage from '@react-native-async-storage/async-storage';

type Entry<T> = { data: T; ts: number };

export async function getCache<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.ts > ttlMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: Entry<T> = { data, ts: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export async function clearCache(key: string): Promise<void> {
  try { await AsyncStorage.removeItem(key); } catch {}
}

// TTL constants
export const TTL = {
  ONE_HOUR:    60 * 60 * 1000,
  SIX_HOURS:   6  * 60 * 60 * 1000,
  ONE_DAY:     24 * 60 * 60 * 1000,
  SEVEN_DAYS:  7  * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
};
