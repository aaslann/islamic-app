import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'QuranSurahDetail'>;
type Ayah = { numberInSurah: number; arabic: string; translation: string };
type AyahNote = { note?: string; isFavorite?: boolean };
type SurahNotes = Record<number, AyahNote>;
type NotesState = Record<string, SurahNotes>;

const STORAGE_KEY = 'quran-notes-v1';

export default function QuranSurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState<SurahNotes>({});
  const [allNotes, setAllNotes] = useState<NotesState>({});
  const [activeNoteAyah, setActiveNoteAyah] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [fontScale, setFontScale] = useState<'small' | 'medium' | 'large'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);

  const surahKey = String(surahId);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadState('loading'); setErrorMsg(null);
        const [arabicRes, turkishRes] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${surahId}`),
          fetch(`https://api.alquran.cloud/v1/surah/${surahId}/tr.diyanet`),
        ]);
        if (!arabicRes.ok || !turkishRes.ok) throw new Error('api-error');
        const [aJ, tJ] = await Promise.all([arabicRes.json(), turkishRes.json()]);
        if (!Array.isArray(aJ?.data?.ayahs) || !Array.isArray(tJ?.data?.ayahs)) throw new Error('invalid-response');
        setAyahs(aJ.data.ayahs.map((a: any, i: number) => ({
          numberInSurah: a.numberInSurah,
          arabic: a.text,
          translation: tJ.data.ayahs[i]?.text ?? '',
        })));
        setLoadState('success');
      } catch {
        setLoadState('error');
        setErrorMsg('Ayetler yüklenirken hata oluştu. İnternet bağlantını kontrol et.');
      }
    };
    load();
  }, [surahId]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) { const p = JSON.parse(raw) as NotesState; setAllNotes(p); setNotes(p[surahKey] ?? {}); }
    });
    AsyncStorage.getItem('app-settings-v2').then((raw) => {
      if (raw) { const p = JSON.parse(raw); if (['small','medium','large'].includes(p.fontScale)) setFontScale(p.fontScale); }
    });
  }, [surahKey]);

  const fontMult = fontScale === 'small' ? 0.9 : fontScale === 'large' ? 1.15 : 1;

  const persist = async (nextAll: NotesState) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextAll)); } catch {}
  };

  const toggleFavorite = (num: number) => {
    const cur = notes[num] ?? {};
    const updated = { ...notes, [num]: { ...cur, isFavorite: !cur.isFavorite } };
    const nextAll = { ...allNotes, [surahKey]: updated };
    setNotes(updated); setAllNotes(nextAll); persist(nextAll);
  };

  const saveNote = () => {
    if (activeNoteAyah == null) return;
    const trimmed = noteDraft.trim();
    const updated = { ...notes, [activeNoteAyah]: { ...notes[activeNoteAyah], note: trimmed || undefined } };
    const nextAll = { ...allNotes, [surahKey]: updated };
    setNotes(updated); setAllNotes(nextAll); persist(nextAll);
    setActiveNoteAyah(null); setNoteDraft('');
  };

  const filteredAyahs = useMemo(() => {
    if (!searchQuery.trim()) return ayahs;
    const q = searchQuery.toLowerCase();
    return ayahs.filter((a) => a.translation.toLowerCase().includes(q) || String(a.numberInSurah).includes(q));
  }, [ayahs, searchQuery]);

  const favoriteCount = Object.values(notes).filter((n) => n.isFavorite).length;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: 11, color: palette.gold400, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 }]}>SÛRE</Text>
            <Text style={[{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }]}>{surahName}</Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.5)', marginTop: 2 }]}>
              Sure No: {surahId} · {ayahs.length > 0 ? `${ayahs.length} ayet` : '...'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setShowSearch((p) => !p)}
              style={[styles.headerBtn, showSearch && { backgroundColor: `${palette.gold500}25`, borderColor: `${palette.gold500}50` }]}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
            </Pressable>
            {favoriteCount > 0 && (
              <View style={styles.favCountBadge}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: palette.gold500 }}>★{favoriteCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bismillah */}
        {surahId !== 1 && surahId !== 9 && (
          <View style={[styles.bismillah, { borderColor: `${palette.gold500}25` }]}>
            <Text style={{ fontFamily: 'serif', fontSize: 18, color: palette.gold400, textAlign: 'center' }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          </View>
        )}

        {/* Search bar */}
        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.15)' }]}>
            <Text style={{ fontSize: 14, marginRight: spacing.sm }}>🔍</Text>
            <TextInput
              value={searchQuery} onChangeText={setSearchQuery}
              placeholder="Ayette ara..." placeholderTextColor="rgba(255,255,255,.4)"
              style={[t.caption, { flex: 1, color: '#fff' }]}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>✕</Text>
              </Pressable>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Ayah list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: playingAyah ? 140 : 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {loadState === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={palette.gold500} />
            <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.md }]}>Ayetler yükleniyor...</Text>
          </View>
        )}
        {loadState === 'error' && (
          <View style={styles.center}>
            <Text style={{ fontSize: 40, marginBottom: spacing.md }}>⚠️</Text>
            <Text style={[t.body, { color: '#FCA5A5', textAlign: 'center' }]}>{errorMsg}</Text>
          </View>
        )}
        {loadState === 'success' && filteredAyahs.map((ayah) => {
          const meta = notes[ayah.numberInSurah];
          const isFav = !!meta?.isFavorite;
          const hasNote = !!meta?.note;
          const isEditing = activeNoteAyah === ayah.numberInSurah;
          const isPlaying = playingAyah === ayah.numberInSurah;

          return (
            <View key={ayah.numberInSurah} style={[
              styles.ayahCard,
              { backgroundColor: c.surface, borderColor: isFav ? `${palette.gold500}40` : c.border },
              isPlaying && { borderColor: `${palette.green400}50`, backgroundColor: c.surfaceElevated },
            ]}>
              {/* Ayah header */}
              <View style={styles.ayahHeader}>
                <View style={[styles.ayahNumBadge, { backgroundColor: `${palette.gold500}18`, borderColor: `${palette.gold500}35` }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold500 }}>{ayah.numberInSurah}</Text>
                </View>
                <View style={styles.ayahActions}>
                  {hasNote && (
                    <View style={[styles.noteBadge, { backgroundColor: `${palette.green500}15`, borderColor: `${palette.green500}30` }]}>
                      <Text style={{ fontSize: 10, color: palette.green300, fontWeight: '700' }}>📝 Not</Text>
                    </View>
                  )}
                  <Pressable onPress={() => setPlayingAyah(isPlaying ? null : ayah.numberInSurah)}
                    style={[styles.actionBtn, { borderColor: isPlaying ? `${palette.green400}50` : c.border }, isPlaying && { backgroundColor: `${palette.green500}15` }]}>
                    <Text style={{ fontSize: 12 }}>{isPlaying ? '⏸' : '▶'}</Text>
                  </Pressable>
                  <Pressable onPress={() => toggleFavorite(ayah.numberInSurah)}
                    style={[styles.actionBtn, { borderColor: isFav ? `${palette.gold500}50` : c.border }, isFav && { backgroundColor: `${palette.gold500}12` }]}>
                    <Text style={{ fontSize: 14, color: isFav ? palette.gold500 : c.textSecondary }}>{isFav ? '★' : '☆'}</Text>
                  </Pressable>
                </View>
              </View>

              {/* Arabic text */}
              <Text style={[{
                fontSize: 22 * fontMult, lineHeight: 44 * fontMult, textAlign: 'right',
                color: theme.dark ? palette.gold300 : palette.green800,
                fontFamily: 'serif', marginVertical: spacing.sm,
              }]}>
                {ayah.arabic}
              </Text>

              <View style={[styles.divider, { backgroundColor: c.border }]} />

              {/* Translation */}
              <Text style={[t.body, { fontSize: 14 * fontMult, color: c.textSecondary, lineHeight: 22, marginTop: spacing.xs }]}>
                {ayah.translation}
              </Text>

              {/* Existing note display */}
              {hasNote && !isEditing && (
                <View style={[styles.noteDisplay, { backgroundColor: `${palette.green500}08`, borderColor: `${palette.green500}20` }]}>
                  <Text style={{ fontSize: 10, color: palette.green400, fontWeight: '700', marginBottom: 4 }}>📝 NOTUN</Text>
                  <Text style={[t.caption, { color: c.textSecondary }]}>{meta.note}</Text>
                </View>
              )}

              {/* Note editor */}
              {isEditing ? (
                <View style={[styles.noteEditor, { borderTopColor: c.border }]}>
                  <TextInput
                    value={noteDraft} onChangeText={setNoteDraft}
                    placeholder="Bu ayet sana ne hatırlatıyor?" placeholderTextColor={c.textSecondary}
                    style={[styles.noteInput, { color: c.text, backgroundColor: c.background, borderColor: c.border }]}
                    multiline autoFocus
                  />
                  <View style={styles.noteEditorBtns}>
                    <Pressable onPress={() => { setActiveNoteAyah(null); setNoteDraft(''); }}
                      style={[styles.noteBtn, { borderColor: c.border }]}>
                      <Text style={[t.caption, { color: c.textSecondary }]}>Vazgeç</Text>
                    </Pressable>
                    <Pressable onPress={saveNote} style={[styles.noteBtn, { backgroundColor: c.primary, borderColor: 'transparent' }]}>
                      <Text style={[t.captionBold, { color: '#fff' }]}>Kaydet</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => { setActiveNoteAyah(ayah.numberInSurah); setNoteDraft(meta?.note ?? ''); }}
                  style={({ pressed }) => [styles.addNoteBtn, { borderColor: c.border }, pressed && { backgroundColor: c.primarySoft }]}
                >
                  <Text style={[t.caption, { color: c.textSecondary }]}>{hasNote ? '✏️ Notu düzenle' : '+ Not ekle'}</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {loadState === 'success' && searchQuery && filteredAyahs.length === 0 && (
          <View style={styles.center}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={[t.body, { color: c.textSecondary, marginTop: spacing.sm }]}>"{searchQuery}" için sonuç bulunamadı</Text>
          </View>
        )}
      </ScrollView>

      {/* Audio player bar */}
      {playingAyah && (
        <BlurView intensity={theme.dark ? 60 : 80} tint={theme.dark ? 'dark' : 'light'} style={styles.playerBar}>
          <LinearGradient
            colors={theme.dark ? ['rgba(15,61,46,.95)', 'rgba(8,26,18,.98)'] : ['rgba(255,255,255,.98)', 'rgba(240,255,250,.98)']}
            style={styles.playerInner}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: palette.gold500, fontWeight: '700', marginBottom: 2 }}>🎧 OYNATILIYOR — Ayet {playingAyah}</Text>
              <Text style={[t.caption, { color: c.textSecondary }]}>{surahName}</Text>
              <View style={[styles.playerProgress, { backgroundColor: c.border }]}>
                <LinearGradient colors={[palette.green500, palette.gold500]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.playerProgressFill, { width: '35%' }]} />
              </View>
            </View>
            <View style={styles.playerControls}>
              <Pressable style={styles.playerBtn}><Text style={{ fontSize: 20 }}>⏮</Text></Pressable>
              <Pressable onPress={() => setPlayingAyah(null)} style={[styles.playerBtn, styles.playerPlayBtn, { backgroundColor: c.primary }]}>
                <Text style={{ fontSize: 18 }}>⏸</Text>
              </Pressable>
              <Pressable style={styles.playerBtn}><Text style={{ fontSize: 20 }}>⏭</Text></Pressable>
            </View>
          </LinearGradient>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1 },
  header:             { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerTop:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  headerActions:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  headerBtn:          { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' },
  favCountBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, backgroundColor: `${palette.gold500}20`, borderWidth: 1, borderColor: `${palette.gold500}40` },
  bismillah:          { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.xs },
  searchBar:          { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm },
  scroll:             { flex: 1 },
  content:            { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  center:             { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  ayahCard:           { borderRadius: radii.xl, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md, ...shadows.card },
  ayahHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  ayahNumBadge:       { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ayahActions:        { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  actionBtn:          { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  noteBadge:          { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full, borderWidth: 1 },
  divider:            { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  noteDisplay:        { borderRadius: radii.md, borderWidth: 1, padding: spacing.sm, marginTop: spacing.sm },
  noteEditor:         { marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  noteInput:          { borderRadius: radii.md, borderWidth: 1, padding: spacing.sm, minHeight: 72, textAlignVertical: 'top', fontSize: 14 },
  noteEditorBtns:     { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  noteBtn:            { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full, borderWidth: 1 },
  addNoteBtn:         { marginTop: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  playerBar:          { position: 'absolute', left: 0, right: 0, bottom: 0 },
  playerInner:        { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.lg },
  playerProgress:     { height: 3, borderRadius: 99, marginTop: spacing.sm, overflow: 'hidden' },
  playerProgressFill: { height: '100%', borderRadius: 99 },
  playerControls:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  playerBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playerPlayBtn:      { width: 44, height: 44, borderRadius: 22 },
});
