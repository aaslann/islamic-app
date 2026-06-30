import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

const STORAGE_KEY = 'zikr-counter-presets-v2';

type ZikrHistoryEntry = { id: string; timestamp: string; count: number };
type ZikrPresetState = { count: number; target: number; history: ZikrHistoryEntry[] };
type ZikrState = { activePhrase: string; presets: string[]; data: Record<string, ZikrPresetState> };

const DEFAULT_PRESETS = [
  { label: 'Sübhanallah', arabic: 'سُبْحَانَ اللَّهِ' },
  { label: 'Elhamdülillah', arabic: 'اَلْحَمْدُ لِلَّهِ' },
  { label: 'Allahu Ekber', arabic: 'اَللَّهُ أَكْبَرُ' },
];
const DEFAULT_LABELS = DEFAULT_PRESETS.map((p) => p.label);

export default function ZikrCounterScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [activePhrase, setActivePhrase] = useState(DEFAULT_LABELS[0]);
  const [presets, setPresets] = useState(DEFAULT_LABELS);
  const [presetData, setPresetData] = useState<Record<string, ZikrPresetState>>({});
  const [newPhrase, setNewPhrase] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const parsed = JSON.parse(raw) as ZikrState;
        setActivePhrase(parsed.activePhrase);
        setPresets(parsed.presets?.length ? parsed.presets : DEFAULT_LABELS);
        const normalized: Record<string, ZikrPresetState> = {};
        Object.entries(parsed.data ?? {}).forEach(([k, v]) => {
          normalized[k] = { count: v.count ?? 0, target: v.target ?? 33, history: v.history ?? [] };
        });
        setPresetData(normalized);
      } else {
        const init: Record<string, ZikrPresetState> = {};
        DEFAULT_LABELS.forEach((p) => { init[p] = { count: 0, target: 33, history: [] }; });
        setPresetData(init);
      }
    }).finally(() => setIsLoaded(true));
  }, []);

  const getState = (): ZikrState => ({ activePhrase, presets, data: presetData });
  const persist = (next: ZikrState) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

  const current = presetData[activePhrase] ?? { count: 0, target: 33, history: [] };
  const { count, target } = current;
  const progress = Math.min(target > 0 ? count / target : 0, 1);

  const updateData = (patch: Partial<ZikrPresetState>) => {
    const next = { ...presetData, [activePhrase]: { ...current, ...patch } };
    setPresetData(next);
    persist({ ...getState(), data: next });
  };

  const handleIncrement = () => {
    const nextCount = count + 1;
    updateData({ count: nextCount });
    if (nextCount >= target && target > 0) {
      const entry: ZikrHistoryEntry = { id: `${Date.now()}`, timestamp: new Date().toISOString(), count: nextCount };
      updateData({ count: 0, history: [entry, ...current.history] });
    }
  };

  const handleReset = () => updateData({ count: 0 });
  const handleSave = () => {
    if (count <= 0) return;
    const entry: ZikrHistoryEntry = { id: `${Date.now()}`, timestamp: new Date().toISOString(), count };
    updateData({ count: 0, history: [entry, ...current.history] });
  };

  const handleAddPreset = () => {
    const trimmed = newPhrase.trim();
    if (!trimmed) return;
    if (presets.includes(trimmed)) { setActivePhrase(trimmed); setNewPhrase(''); return; }
    const nextPresets = [...presets, trimmed];
    const nextData = { ...presetData, [trimmed]: { count: 0, target: 33, history: [] } };
    setPresets(nextPresets); setPresetData(nextData); setActivePhrase(trimmed); setNewPhrase('');
    persist({ activePhrase: trimmed, presets: nextPresets, data: nextData });
  };

  const selectPhrase = (phrase: string) => {
    setActivePhrase(phrase);
    if (!presetData[phrase]) {
      const next = { ...presetData, [phrase]: { count: 0, target: 33, history: [] } };
      setPresetData(next);
      persist({ ...getState(), activePhrase: phrase, data: next });
    } else {
      persist({ ...getState(), activePhrase: phrase });
    }
  };

  const activeArabic = DEFAULT_PRESETS.find((p) => p.label === activePhrase)?.arabic ?? '';
  const circumference = 2 * Math.PI * 60; // r=60
  const strokeDashoffset = circumference * (1 - progress);
  const totalZikr = current.history.reduce((s, h) => s + h.count, 0) + count;

  return (
    <LinearGradient
      colors={['#0A1F15', '#081A12', '#0D1F18']}
      style={styles.root}
    >
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >

        {/* Phrase selector */}
        <View style={styles.phraseRow}>
          {presets.map((p) => (
            <Pressable key={p} onPress={() => selectPhrase(p)} disabled={!isLoaded}
              style={({ pressed }) => [styles.phrasePill, activePhrase === p && styles.phrasePillActive, pressed && { opacity: 0.7 }]}>
              <Text style={[{ fontSize: 12, fontWeight: '600', color: activePhrase === p ? palette.gold400 : 'rgba(255,255,255,.4)' }]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Arabic text */}
        {activeArabic ? (
          <Text style={styles.arabicText}>{activeArabic}</Text>
        ) : (
          <Text style={[{ fontSize: 18, color: 'rgba(255,255,255,.7)', textAlign: 'center', marginVertical: spacing.md }]}>{activePhrase}</Text>
        )}

        {/* Circular counter */}
        <View style={styles.counterWrap}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.countNum}>{count}</Text>
              <Text style={styles.countTarget}>/ {target}</Text>
              <Text style={styles.countPercent}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
          {/* Progress arc simulation with a border */}
          <View style={[StyleSheet.absoluteFill, styles.progressArc, { borderColor: `${palette.gold500}30` }]} />
          {progress > 0 && (
            <View style={[StyleSheet.absoluteFill, styles.progressArc, {
              borderColor: palette.gold500,
              borderTopColor: progress >= 0.25 ? palette.gold500 : 'transparent',
              borderRightColor: progress >= 0.5 ? palette.gold500 : 'transparent',
              borderBottomColor: progress >= 0.75 ? palette.gold500 : 'transparent',
              borderLeftColor: progress >= 1 ? palette.gold500 : 'transparent',
              transform: [{ rotate: '-90deg' }],
            }]} />
          )}
        </View>

        {/* Big tap button */}
        <Pressable onPress={handleIncrement} disabled={!isLoaded}
          style={({ pressed }) => [styles.tapBtn, pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 }]}>
          <LinearGradient colors={[palette.green600, palette.green800]} style={styles.tapBtnGrad}>
            <Text style={{ fontSize: 36 }}>📿</Text>
            <Text style={[{ fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 4 }]}>Zikret</Text>
          </LinearGradient>
        </Pressable>

        {/* Target selector */}
        <View style={styles.targetRow}>
          <Text style={[{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginRight: spacing.sm }]}>Hedef:</Text>
          {[33, 99, 100, 1000].map((v) => (
            <Pressable key={v} onPress={() => updateData({ target: v, count: 0 })}
              style={[styles.targetPill, target === v && { backgroundColor: `${palette.gold500}20`, borderColor: `${palette.gold500}50` }]}>
              <Text style={[{ fontSize: 11, fontWeight: '600', color: target === v ? palette.gold400 : 'rgba(255,255,255,.4)' }]}>{v}</Text>
            </Pressable>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable onPress={handleSave} style={[styles.actionBtn, { borderColor: palette.green400 }]}>
            <Text style={[{ fontSize: 12, fontWeight: '700', color: palette.green300 }]}>💾 Kaydet</Text>
          </Pressable>
          <Pressable onPress={handleReset} style={[styles.actionBtn, { borderColor: 'rgba(255,255,255,.15)' }]}>
            <Text style={[{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,.4)' }]}>↺ Sıfırla</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={[{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,.4)', marginBottom: spacing.md, letterSpacing: 1 }]}>TOPLAM İSTATİSTİK</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalZikr}</Text>
              <Text style={styles.statLabel}>Toplam Zikir</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{current.history.length}</Text>
              <Text style={styles.statLabel}>Oturum</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{presets.length}</Text>
              <Text style={styles.statLabel}>Zikir</Text>
            </View>
          </View>
        </View>

        {/* History */}
        {current.history.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={[{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,.4)', marginBottom: spacing.sm, letterSpacing: 1 }]}>SON OTURUMLAR</Text>
            {current.history.slice(0, 5).map((h) => (
              <View key={h.id} style={styles.historyRow}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: palette.gold400 }]}>{h.count}</Text>
                <Text style={[{ fontSize: 11, color: 'rgba(255,255,255,.35)' }]}>{new Date(h.timestamp).toLocaleString('tr-TR')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add new zikir */}
        <View style={styles.addCard}>
          <Text style={[{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: spacing.sm }]}>Yeni zikir ekle</Text>
          <View style={styles.addRow}>
            <TextInput
              value={newPhrase} onChangeText={setNewPhrase}
              placeholder="Zikir adı..." placeholderTextColor="rgba(255,255,255,.25)"
              style={[styles.addInput]}
              editable={isLoaded}
              returnKeyType="done"
              onSubmitEditing={handleAddPreset}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
            />
            <Pressable onPress={handleAddPreset} style={styles.addBtn}>
              <Text style={[{ fontSize: 12, fontWeight: '700', color: '#fff' }]}>Ekle</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  content:       { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, alignItems: 'center' },
  phraseRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.md },
  phrasePill:    { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  phrasePillActive: { borderColor: `${palette.gold500}50`, backgroundColor: `${palette.gold500}12` },
  arabicText:    { fontFamily: 'serif', fontSize: 28, color: palette.gold400, textAlign: 'center', direction: 'rtl' as any, marginBottom: spacing.lg, lineHeight: 48 },
  counterWrap:   { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl, position: 'relative' },
  ringOuter:     { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 3, borderColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  ringInner:     { alignItems: 'center' },
  countNum:      { fontSize: 52, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 56 },
  countTarget:   { fontSize: 14, color: 'rgba(255,255,255,.35)', marginTop: 2 },
  countPercent:  { fontSize: 12, color: palette.gold400, fontWeight: '700', marginTop: 4 },
  progressArc:   { borderRadius: 90, borderWidth: 3, margin: 5 },
  tapBtn:        { marginBottom: spacing.lg },
  tapBtnGrad:    { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${palette.gold500}40` },
  targetRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  targetPill:    { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  actionRow:     { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  actionBtn:     { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full, borderWidth: 1 },
  statsCard:     { width: '100%', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', marginBottom: spacing.md },
  statsRow:      { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem:      { alignItems: 'center' },
  statNum:       { fontSize: 26, fontWeight: '800', color: palette.gold400 },
  statLabel:     { fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4 },
  statDivider:   { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,.08)' },
  historyCard:   { width: '100%', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', marginBottom: spacing.md },
  historyRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,.06)' },
  addCard:       { width: '100%', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
  addRow:        { flexDirection: 'row', gap: spacing.sm },
  addInput:      { flex: 1, backgroundColor: 'rgba(255,255,255,.06)', borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  addBtn:        { backgroundColor: palette.green600, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full },
});
