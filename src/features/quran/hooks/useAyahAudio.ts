import { useCallback, useEffect, useRef, useState } from 'react';

const CDN = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy';

export type AudioState = {
  currentNum: number | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  error: boolean;
};

export type AyahAudioControls = AudioState & {
  play: (globalNum: number) => Promise<void>;
  togglePause: () => Promise<void>;
  stop: () => Promise<void>;
};

// Lazy-load expo-av so the app doesn't crash if the native module is missing
let Audio: typeof import('expo-av').Audio | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-av').Audio;
} catch {
  Audio = null;
}

export function useAyahAudio(onEnded?: (globalNum: number) => void): AyahAudioControls {
  const soundRef = useRef<any | null>(null);
  const endedNumRef = useRef<number | null>(null);
  const [state, setState] = useState<AudioState>({
    currentNum: null, isPlaying: false, isLoading: false, position: 0, error: false,
  });

  useEffect(() => {
    if (!Audio) return;
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      allowsRecordingIOS: false,
    }).catch(() => {});
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  const unload = useCallback(async () => {
    const s = soundRef.current;
    soundRef.current = null;
    if (s) await s.unloadAsync().catch(() => {});
  }, []);

  const play = useCallback(async (globalNum: number) => {
    if (!Audio) { setState((p) => ({ ...p, error: true })); return; }
    await unload();
    setState({ currentNum: globalNum, isPlaying: false, isLoading: true, position: 0, error: false });
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${CDN}/${globalNum}.mp3` },
        { shouldPlay: true, progressUpdateIntervalMillis: 250 },
        (status) => {
          if (!status.isLoaded) return;
          const pos = status.durationMillis && status.durationMillis > 0
            ? status.positionMillis / status.durationMillis : 0;
          setState((prev) => ({ ...prev, isLoading: false, isPlaying: status.isPlaying, position: pos }));
          if (status.didJustFinish) endedNumRef.current = globalNum;
        },
      );
      soundRef.current = sound;
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch {
      setState({ currentNum: globalNum, isPlaying: false, isLoading: false, position: 0, error: true });
    }
  }, [unload]);

  useEffect(() => {
    if (endedNumRef.current == null) return;
    const num = endedNumRef.current;
    endedNumRef.current = null;
    setState((prev) => ({ ...prev, isPlaying: false }));
    onEnded?.(num);
  });

  const togglePause = useCallback(async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  }, []);

  const stop = useCallback(async () => {
    await unload();
    setState({ currentNum: null, isPlaying: false, isLoading: false, position: 0, error: false });
  }, [unload]);

  return { ...state, play, togglePause, stop };
}
