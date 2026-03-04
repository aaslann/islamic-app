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
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>{surahName}</Text>
        <Text style={styles.subtitle}>
          Seçtiğin surenin Arapça metni ve Diyanet meali listelenir. Aşağıdaki
          veriler çevrimiçi Kur&apos;an API&apos;sinden alınır.
        </Text>
        <Text style={styles.metaText}>Sure ID: {surahId}</Text>
      </View>

      {state === 'loading' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#38BDF8" />
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
            <View key={ayah.numberInSurah} style={styles.ayahCard}>
              <View style={styles.ayahHeaderRow}>
                <Text style={styles.ayahNumberBadge}>
                  {ayah.numberInSurah}
                </Text>
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
                  { fontSize: styles.ayahArabic.fontSize * fontMultiplier },
                ]}
              >
                {ayah.arabic}
              </Text>
              <Text
                style={[
                  styles.ayahTranslation,
                  { fontSize: styles.ayahTranslation.fontSize * fontMultiplier },
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
                    placeholderTextColor="#6B7280"
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
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#9CA3AF',
  },
  centerBox: {
    marginTop: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  metaText: {
    marginTop: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  ayahCard: {
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  ayahHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ayahNumberBadge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  ayahHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButtonActive: {
    borderColor: '#FACC15',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  favButtonPressed: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  favButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  favButtonTextActive: {
    color: '#FACC15',
  },
  noteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  noteBadgeText: {
    fontSize: 11,
    color: '#38BDF8',
  },
  ayahArabic: {
    fontSize: 22,
    color: '#F9FAFB',
    textAlign: 'right',
  },
  ayahNumber: {
    marginTop: 6,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  ayahTranslation: {
    marginTop: 10,
    fontSize: 14,
    color: '#E5E7EB',
  },
  ayahActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  noteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#4B5563',
  },
  noteButtonPressed: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  noteButtonText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  noteEditor: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1F2937',
  },
  noteLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  noteInput: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#4B5563',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#F9FAFB',
    backgroundColor: '#020617',
    textAlignVertical: 'top',
  },
  noteEditorActions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  noteCancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#4B5563',
  },
  noteCancelText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noteSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  noteSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B1120',
  },
  ayahCardMuted: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

