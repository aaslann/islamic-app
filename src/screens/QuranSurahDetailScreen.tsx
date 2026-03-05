import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';

type Props = NativeStackScreenProps<RootStackParamList, 'QuranSurahDetail'>;

type Ayah = {
  numberInSurah: number;
  arabic: string;
  translation: string;
};

type AyahNote = {
  note?: string;
  isFavorite?: boolean;
};

type SurahNotes = {
  [ayahNumber: number]: AyahNote;
};

type NotesState = {
  [surahKey: string]: SurahNotes;
};

const STORAGE_KEY = 'quran-notes-v1';
const SETTINGS_KEY = 'app-settings-v1';

export default function QuranSurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [state, setState] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<SurahNotes>({});
  const [allNotes, setAllNotes] = useState<NotesState>({});
  const [activeNoteAyah, setActiveNoteAyah] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [fontScale, setFontScale] = useState<'small' | 'medium' | 'large'>(
    'medium',
  );

  const surahKey = String(surahId);

  useEffect(() => {
    const loadAyahs = async () => {
      try {
        setState('loading');
        setErrorMessage(null);

        // AlQuran API üzerinden Arapça ve Türkçe meali birlikte çek.
        const [arabicRes, turkishRes] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${surahId}`),
          fetch(`https://api.alquran.cloud/v1/surah/${surahId}/tr.diyanet`),
        ]);

        if (!arabicRes.ok || !turkishRes.ok) {
          throw new Error('api-error');
        }

        const arabicJson = await arabicRes.json();
        const turkishJson = await turkishRes.json();

        if (
          !arabicJson?.data?.ayahs ||
          !turkishJson?.data?.ayahs ||
          !Array.isArray(arabicJson.data.ayahs) ||
          !Array.isArray(turkishJson.data.ayahs)
        ) {
          throw new Error('invalid-response');
        }

        const combined: Ayah[] = arabicJson.data.ayahs.map(
          (a: any, index: number) => {
            const t = turkishJson.data.ayahs[index];
            return {
              numberInSurah: a.numberInSurah,
              arabic: a.text,
              translation: t?.text ?? '',
            };
          },
        );

        setAyahs(combined);
        setState('success');
      } catch {
        setState('error');
        setErrorMessage(
          'Ayetler yüklenirken bir hata oluştu. Lütfen internet bağlantını kontrol edip tekrar dene.',
        );
      }
    };

    loadAyahs();
  }, [surahId]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as NotesState;
          setAllNotes(parsed);
          setNotes(parsed[surahKey] ?? {});
        }
      } catch {
        // ignore
      }
    };

    loadNotes();
  }, [surahKey]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { fontScale?: string };
          if (
            parsed.fontScale === 'small' ||
            parsed.fontScale === 'medium' ||
            parsed.fontScale === 'large'
          ) {
            setFontScale(parsed.fontScale);
          }
        }
      } catch {
        // ignore
      }
    };

    loadSettings();
  }, []);

  const fontMultiplier =
    fontScale === 'small' ? 0.9 : fontScale === 'large' ? 1.15 : 1;

  const persistNotes = async (nextAll: NotesState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextAll));
    } catch {
      // ignore
    }
  };

  const toggleFavorite = (ayahNumber: number) => {
    const current = notes[ayahNumber] ?? {};
    const updated: SurahNotes = {
      ...notes,
      [ayahNumber]: { ...current, isFavorite: !current.isFavorite },
    };
    const nextAll: NotesState = {
      ...allNotes,
      [surahKey]: updated,
    };
    setNotes(updated);
    setAllNotes(nextAll);
    persistNotes(nextAll);
  };

  const openNoteEditor = (ayahNumber: number) => {
    const existing = notes[ayahNumber]?.note ?? '';
    setActiveNoteAyah(ayahNumber);
    setNoteDraft(existing);
  };

  const saveNote = () => {
    if (activeNoteAyah == null) return;
    const trimmed = noteDraft.trim();
    const current = notes[activeNoteAyah] ?? {};
    const updated: SurahNotes = {
      ...notes,
      [activeNoteAyah]: { ...current, note: trimmed || undefined },
    };
    const nextAll: NotesState = {
      ...allNotes,
      [surahKey]: updated,
    };
    setNotes(updated);
    setAllNotes(nextAll);
    persistNotes(nextAll);
    setActiveNoteAyah(null);
    setNoteDraft('');
  };

  const cancelNote = () => {
    setActiveNoteAyah(null);
    setNoteDraft('');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.surahLabel}>Sûre</Text>
          <Text style={styles.title}>{surahName}</Text>
          <Text style={styles.metaText}>ID: {surahId}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {state === 'loading' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.infoText}>Ayetler yükleniyor...</Text>
          </View>
        )}

        {state === 'error' && (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {state === 'success' &&
          ayahs.map((ayah) => {
            const meta = notes[ayah.numberInSurah];
            const isFav = !!meta?.isFavorite;
            const hasNote = !!meta?.note;
            const isEditing = activeNoteAyah === ayah.numberInSurah;

            return (
              <Card key={ayah.numberInSurah} style={styles.ayahCard}>
                <View style={styles.ayahHeaderRow}>
                  <View style={styles.ayahNumberBadge}>
                    <Text style={styles.ayahNumberText}>
                      {ayah.numberInSurah}
                    </Text>
                  </View>
                  <View style={styles.ayahHeaderRight}>
                    {hasNote && (
                      <View style={styles.noteBadge}>
                        <Text style={styles.noteBadgeText}>Not</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => toggleFavorite(ayah.numberInSurah)}
                      style={({ pressed }) => [
                        styles.favButton,
                        isFav && styles.favButtonActive,
                        pressed && styles.favButtonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.favButtonText,
                          isFav && styles.favButtonTextActive,
                        ]}
                      >
                        {isFav ? '★' : '☆'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Text
                  style={[
                    styles.ayahArabic,
                    { fontSize: 22 * fontMultiplier },
                  ]}
                >
                  {ayah.arabic}
                </Text>
                <Text
                  style={[
                    styles.ayahTranslation,
                    { fontSize: 14 * fontMultiplier },
                  ]}
                >
                  {ayah.translation}
                </Text>

                {!isEditing && (
                  <View style={styles.ayahActionsRow}>
                    <Pressable
                      onPress={() => openNoteEditor(ayah.numberInSurah)}
                      style={({ pressed }) => [
                        styles.noteButton,
                        pressed && styles.noteButtonPressed,
                      ]}
                    >
                      <Text style={styles.noteButtonText}>
                        {hasNote ? 'Notu Düzenle' : 'Not Ekle'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {isEditing && (
                  <View style={styles.noteEditor}>
                    <Text style={styles.noteLabel}>Ayet notu</Text>
                    <TextInput
                      value={noteDraft}
                      onChangeText={setNoteDraft}
                      placeholder="Bu ayet sana ne hatırlatıyor? Kısa bir not bırak..."
                      placeholderTextColor={colors.textMuted}
                      style={styles.noteInput}
                      multiline
                    />
                    <View style={styles.noteEditorActions}>
                      <Pressable
                        onPress={cancelNote}
                        style={styles.noteCancelButton}
                      >
                        <Text style={styles.noteCancelText}>Vazgeç</Text>
                      </Pressable>
                      <Pressable
                        onPress={saveNote}
                        style={styles.noteSaveButton}
                      >
                        <Text style={styles.noteSaveText}>Kaydet</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Card>
            );
          })}
      </ScrollView>

      <BlurView intensity={40} tint="dark" style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>
          Uzun basarak metni kopyalayabilir, not ekleyebilirsin.
        </Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    paddingTop: spacing.sm,
  },
  surahLabel: {
    ...textStyles.caption,
    color: 'rgba(248,250,252,0.8)',
  },
  title: {
    ...textStyles.heading1,
    color: colors.white,
    marginTop: spacing.xs,
  },
  metaText: {
    marginTop: spacing.xs,
    ...textStyles.caption,
    color: 'rgba(248,250,252,0.7)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centerBox: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    marginTop: spacing.sm,
    ...textStyles.caption,
    color: colors.textMuted,
  },
  errorText: {
    ...textStyles.caption,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  ayahCard: {
    marginTop: spacing.sm,
  },
  ayahHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  ayahNumberBadge: {
    minWidth: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    ...textStyles.caption,
    fontWeight: '700',
    color: colors.surface,
  },
  ayahHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  favButtonActive: {
    borderColor: colors.accentGold,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  favButtonPressed: {
    backgroundColor: colors.surface,
  },
  favButtonText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  favButtonTextActive: {
    color: colors.accentGold,
  },
  noteBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  noteBadgeText: {
    ...textStyles.caption,
    color: colors.primary,
  },
  ayahArabic: {
    ...textStyles.arabic,
    color: colors.text,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  ayahTranslation: {
    marginTop: spacing.sm,
    ...textStyles.body,
    color: colors.textMuted,
  },
  ayahActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  noteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  noteButtonPressed: {
    backgroundColor: colors.surface,
  },
  noteButtonText: {
    ...textStyles.caption,
    color: colors.text,
  },
  noteEditor: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  noteLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  noteInput: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  noteEditorActions: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  noteCancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    marginRight: spacing.sm,
  },
  noteCancelText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  noteSaveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  noteSaveText: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.white,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bottomBarText: {
    ...textStyles.caption,
    color: colors.primarySoft,
    textAlign: 'center',
  },
});

