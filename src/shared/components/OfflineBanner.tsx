import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

// Lightweight reachability probe. We hit aladhan.com (which the app already
// uses for prayer times) so a successful response also confirms the API is up.
// Using GET to a tiny known endpoint is more reliable than HEAD — some CDNs
// reject HEAD or return non-200 for it.
const PROBE_URLS = [
  'https://api.aladhan.com/v1/methods',
  'https://www.google.com/generate_204',
];

const POLL_INTERVAL_MS = 30_000;
const PROBE_TIMEOUT_MS = 6_000;
// Only flip to "offline" after this many consecutive failures, so a single
// flaky request doesn't show a false alarm on a perfectly good connection.
const FAILURES_BEFORE_OFFLINE = 2;

async function probeOnce(url: string): Promise<boolean> {
  // Avoid AbortSignal.timeout (not available in older Hermes runtimes).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    // Any HTTP response (even 4xx) means the network is up.
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function probeAny(): Promise<boolean> {
  for (const url of PROBE_URLS) {
    if (await probeOnce(url)) return true;
  }
  return false;
}

function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);
  const failuresRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const ok = await probeAny();
      if (cancelled) return;
      if (ok) {
        failuresRef.current = 0;
        setOnline(true);
      } else {
        failuresRef.current += 1;
        if (failuresRef.current >= FAILURES_BEFORE_OFFLINE) {
          setOnline(false);
        }
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    // Defer the first probe a bit so the app has a moment to settle.
    timer = setTimeout(tick, 3_000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return online;
}

export function OfflineBanner() {
  const online = useIsOnline();
  const slideY = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.timing(slideY, {
      toValue: online ? -40 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [online, slideY]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideY }] }]} pointerEvents="none">
      <Text style={styles.text}>📵  İnternet bağlantısı yok — bazı özellikler çalışmayabilir</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  text: { fontSize: 12, fontWeight: '600', color: '#FEE2E2' },
});
