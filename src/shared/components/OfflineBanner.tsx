import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      try {
        const res = await fetch('https://api.aladhan.com/v1/status', {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        });
        if (!cancelled) setOnline(res.ok || res.status < 500);
      } catch {
        if (!cancelled) setOnline(false);
      }
      if (!cancelled) timer = setTimeout(check, 30_000);
    };

    check();
    return () => { cancelled = true; clearTimeout(timer); };
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
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideY }] }]}>
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
