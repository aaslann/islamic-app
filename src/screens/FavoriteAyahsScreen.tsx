import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'FavoriteAyahs'>;

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

type FavoriteItem = {
  surahId: number;
  ayahNumber: number;
  note?: string;
};

const STORAGE_KEY = 'quran-notes-v1';

const TURKISH_SURA_NAMES: Record<number, string> = {
  1: 'Fâtiha',
  2: 'Bakara',
  3: 'Âl-i İmrân',
  4: 'Nisâ',
  5: 'Mâide',
  6: 'En‘âm',
  7: 'A‘râf',
  8: 'Enfâl',
  9: 'Tevbe',
  10: 'Yûnus',
  11: 'Hûd',
  12: 'Yûsuf',
  13: 'Ra‘d',
  14: 'İbrâhîm',
  15: 'Hicr',
  16: 'Nahl',
  17: 'İsrâ',
  18: 'Kehf',
  19: 'Meryem',
  20: 'Tâhâ',
  21: 'Enbiyâ',
  22: 'Hacc',
  23: 'Mü’minûn',
  24: 'Nûr',
  25: 'Furkân',
  26: 'Şuarâ',
  27: 'Neml',
  28: 'Kasas',
  29: 'Ankebût',
  30: 'Rûm',
  31: 'Lokmân',
  32: 'Secde',
  33: 'Ahzâb',
  34: 'Sebe’',
  35: 'Fâtır',
  36: 'Yâsîn',
  37: 'Sâffât',
  38: 'Sâd',
  39: 'Zümer',
  40: 'Mü’min',
  41: 'Fussilet',
  42: 'Şûrâ',
  43: 'Zuhruf',
  44: 'Duhân',
  45: 'Câsiye',
  46: 'Ahkâf',
  47: 'Muhammed',
  48: 'Fetih',
  49: 'Hucurât',
  50: 'Kaf',
  51: 'Zâriyât',
  52: 'Tûr',
  53: 'Necm',
  54: 'Kamer',
  55: 'Rahmân',
  56: 'Vâkıa',
  57: 'Hadîd',
  58: 'Mücâdele',
  59: 'Haşr',
  60: 'Mümtehine',
  61: 'Saff',
  62: 'Cuma',
  63: 'Münâfikûn',
  64: 'Tegâbün',
  65: 'Talâk',
  66: 'Tahrîm',
  67: 'Mülk',
  68: 'Kalem',
  69: 'Hâkka',
  70: 'Meâric',
  71: 'Nûh',
  72: 'Cin',
  73: 'Müzzemmil',
  74: 'Müddessir',
  75: 'Kıyâme',
  76: 'İnsan',
  77: 'Mürselât',
  78: 'Nebe’',
  79: 'Nâziât',
  80: 'Abese',
  81: 'Tekvîr',
  82: 'İnfitâr',
  83: 'Mutaffifîn',
  84: 'İnşikâk',
  85: 'Bürûc',
  86: 'Târık',
  87: 'A‘lâ',
  88: 'Gâşiye',
  89: 'Fecr',
  90: 'Beled',
  91: 'Şems',
  92: 'Leyl',
  93: 'Duha',
  94: 'İnşirah',
  95: 'Tîn',
  96: 'Alak',
  97: 'Kadr',
  98: 'Beyyine',
  99: 'Zilzâl',
  100: 'Âdiyât',
  101: 'Kâria',
  102: 'Tekâsür',
  103: 'Asr',
  104: 'Hümeze',
  105: 'Fîl',
  106: 'Kureyş',
  107: 'Mâûn',
  108: 'Kevser',
  109: 'Kâfirûn',
  110: 'Nasr',
  111: 'Tebbet',
  112: 'İhlâs',
  113: 'Felak',
  114: 'Nâs',
};

export default function FavoriteAyahsScreen({ navigation }: Props) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setFavorites([]);
          return;
        }
        const parsed = JSON.parse(raw) as NotesState;
        const result: FavoriteItem[] = [];

        Object.entries(parsed).forEach(([surahKey, surahNotes]) => {
          const surahId = Number(surahKey);
          Object.entries(surahNotes).forEach(([ayahStr, note]) => {
            if (note?.isFavorite) {
              result.push({
                surahId,
                ayahNumber: Number(ayahStr),
                note: note.note,
              });
            }
          });
        });

        result.sort((a, b) => {
          if (a.surahId === b.surahId) {
            return a.ayahNumber - b.ayahNumber;
          }
          return a.surahId - b.surahId;
        });

        setFavorites(result);
      } catch {
        setFavorites([]);
      } finally {
        setIsLoaded(true);
      }
    };

    load();
  }, []);

  const openSurah = (item: FavoriteItem) => {
    const name =
      TURKISH_SURA_NAMES[item.surahId] ?? `Sure ${item.surahId.toString()}`;
    navigation.navigate('QuranSurahDetail', {
      surahId: item.surahId,
      surahName: name,
    });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>Favori Ayetlerim</Text>
        <Text style={styles.subtitle}>
          Yıldızladığın ayetler burada listelenir. Bir ayetin notu varsa kısa
          bir önizleme olarak gösterilir.
        </Text>
      </View>

      {!isLoaded && (
        <Text style={styles.infoText}>Favoriler yükleniyor...</Text>
      )}

      {isLoaded && favorites.length === 0 && (
        <Text style={styles.infoText}>
          Henüz favori ayet eklemedin. Bir ayetin yanındaki yıldız simgesine
          dokunarak favorilere ekleyebilirsin.
        </Text>
      )}

      {favorites.map((fav) => (
        <Pressable
          key={`${fav.surahId}-${fav.ayahNumber}`}
          onPress={() => openSurah(fav)}
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
          ]}
        >
          <View style={styles.itemHeader}>
            <View style={styles.surahBadge}>
              <Text style={styles.surahBadgeText}>
                {TURKISH_SURA_NAMES[fav.surahId] ??
                  `Sure ${fav.surahId.toString()}`}
              </Text>
            </View>
            <Text style={styles.ayahIndex}>Ayet {fav.ayahNumber}</Text>
          </View>
          {fav.note && (
            <Text style={styles.notePreview}>
              {fav.note.length > 120
                ? `${fav.note.slice(0, 117)}...`
                : fav.note}
            </Text>
          )}
        </Pressable>
      ))}
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
    gap: 8,
  },
  headerCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0B1120',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
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
  infoText: {
    marginTop: 12,
    fontSize: 13,
    color: '#9CA3AF',
  },
  item: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  itemPressed: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  surahBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  surahBadgeText: {
    fontSize: 12,
    color: '#38BDF8',
  },
  ayahIndex: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  notePreview: {
    marginTop: 4,
    fontSize: 13,
    color: '#E5E7EB',
  },
});

