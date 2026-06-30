import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'FavoriteAyahs'>;

type AyahNote = { note?: string; isFavorite?: boolean };
type SurahNotes = Record<number, AyahNote>;
type NotesState = Record<string, SurahNotes>;
type FavoriteItem = { surahId: number; ayahNumber: number; note?: string };

const STORAGE_KEY = 'quran-notes-v1';

const SURAH_NAMES: Record<number, string> = {
  1:'Fâtiha',2:'Bakara',3:'Âl-i İmrân',4:'Nisâ',5:'Mâide',6:"En'âm",7:"A'râf",8:'Enfâl',
  9:'Tevbe',10:'Yûnus',11:'Hûd',12:'Yûsuf',13:"Ra'd",14:'İbrâhîm',15:'Hicr',16:'Nahl',
  17:'İsrâ',18:'Kehf',19:'Meryem',20:'Tâhâ',21:'Enbiyâ',22:'Hacc',23:"Mü'minûn",24:'Nûr',
  25:'Furkân',26:'Şuarâ',27:'Neml',28:'Kasas',29:'Ankebût',30:'Rûm',31:'Lokmân',32:'Secde',
  33:'Ahzâb',34:"Sebe'",35:'Fâtır',36:'Yâsîn',37:'Sâffât',38:'Sâd',39:'Zümer',40:"Mü'min",
  41:'Fussilet',42:'Şûrâ',43:'Zuhruf',44:'Duhân',45:'Câsiye',46:'Ahkâf',47:'Muhammed',
  48:'Fetih',49:'Hucurât',50:'Kaf',51:'Zâriyât',52:'Tûr',53:'Necm',54:'Kamer',55:'Rahmân',
  56:'Vâkıa',57:'Hadîd',58:'Mücâdele',59:'Haşr',60:'Mümtehine',61:'Saff',62:'Cuma',
  63:'Münâfikûn',64:'Tegâbün',65:'Talâk',66:'Tahrîm',67:'Mülk',68:'Kalem',69:'Hâkka',
  70:'Meâric',71:'Nûh',72:'Cin',73:'Müzzemmil',74:'Müddessir',75:'Kıyâme',76:'İnsan',
  77:'Mürselât',78:"Nebe'",79:'Nâziât',80:'Abese',81:'Tekvîr',82:'İnfitâr',83:'Mutaffifîn',
  84:'İnşikâk',85:'Bürûc',86:'Târık',87:"A'lâ",88:'Gâşiye',89:'Fecr',90:'Beled',91:'Şems',
  92:'Leyl',93:'Duha',94:'İnşirah',95:'Tîn',96:'Alak',97:'Kadr',98:'Beyyine',99:'Zilzâl',
  100:'Âdiyât',101:'Kâria',102:'Tekâsür',103:'Asr',104:'Hümeze',105:'Fîl',106:'Kureyş',
  107:'Mâûn',108:'Kevser',109:'Kâfirûn',110:'Nasr',111:'Tebbet',112:'İhlâs',113:'Felak',114:'Nâs',
};

export default function FavoriteAyahsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsLoaded(false);
      AsyncStorage.getItem(STORAGE_KEY)
        .then((raw) => {
          if (!raw) { setFavorites([]); return; }
          const parsed = JSON.parse(raw) as NotesState;
          const result: FavoriteItem[] = [];
          Object.entries(parsed).forEach(([surahKey, surahNotes]) => {
            const surahId = Number(surahKey);
            Object.entries(surahNotes).forEach(([ayahStr, note]) => {
              if (note?.isFavorite) {
                result.push({ surahId, ayahNumber: Number(ayahStr), note: note.note });
              }
            });
          });
          result.sort((a, b) => a.surahId !== b.surahId ? a.surahId - b.surahId : a.ayahNumber - b.ayahNumber);
          setFavorites(result);
        })
        .catch(() => setFavorites([]))
        .finally(() => setIsLoaded(true));
    }, []),
  );

  const openSurah = (item: FavoriteItem) => {
    navigation.navigate('QuranSurahDetail', {
      surahId: item.surahId,
      surahName: SURAH_NAMES[item.surahId] ?? `Sure ${item.surahId}`,
    });
  };

  return (
    <IslamicBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>FAVORİLER</Text>
          <Text style={styles.heroTitle}>Favori Ayetlerim</Text>
          <Text style={styles.heroSub}>
            Kur'an okurken yıldızladığın ayetler burada listelenir. Bir ayete dokununca o sureye gidersin.
          </Text>
          {isLoaded && (
            <View style={styles.countBadge}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.gold400 }}>
                ⭐ {favorites.length} favori ayet
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Loading */}
        {!isLoaded && (
          <View style={styles.emptyCenter}>
            <Text style={{ fontSize: 32 }}>⭐</Text>
            <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.sm }]}>Yükleniyor…</Text>
          </View>
        )}

        {/* Empty */}
        {isLoaded && favorites.length === 0 && (
          <View style={styles.emptyCenter}>
            <Text style={{ fontSize: 56 }}>⭐</Text>
            <Text style={[t.bodyBold, { color: c.text, marginTop: spacing.md, textAlign: 'center' }]}>
              Henüz favori ayet yok
            </Text>
            <Text style={[t.caption, { color: c.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 }]}>
              Kur'an okurken bir ayetin yanındaki yıldız simgesine dokunarak buraya ekleyebilirsin.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: 'QuranSurahList' })}
              style={[styles.openQuranBtn, { backgroundColor: c.primary }]}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Kur'an'ı Aç →</Text>
            </Pressable>
          </View>
        )}

        {/* Favorites list */}
        {isLoaded && favorites.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            {favorites.map((fav) => {
              const surahName = SURAH_NAMES[fav.surahId] ?? `Sure ${fav.surahId}`;
              return (
                <Pressable
                  key={`${fav.surahId}-${fav.ayahNumber}`}
                  onPress={() => openSurah(fav)}
                  style={({ pressed }) => [
                    styles.favCard,
                    { backgroundColor: c.surface, borderColor: c.border },
                    pressed && { backgroundColor: c.primarySoft, borderColor: `${palette.gold500}40` },
                  ]}
                >
                  {/* Left gold accent */}
                  <View style={[styles.favAccent, { backgroundColor: palette.gold500 }]} />

                  <View style={{ flex: 1, padding: spacing.md }}>
                    {/* Header row */}
                    <View style={styles.favHeaderRow}>
                      <View style={[styles.surahBadge, { backgroundColor: `${palette.gold500}18`, borderColor: `${palette.gold500}30` }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold500 }}>{surahName}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: c.textSecondary }}>Ayet {fav.ayahNumber}</Text>
                      <Text style={{ fontSize: 16, color: palette.gold400 }}>⭐</Text>
                    </View>

                    {/* Note preview */}
                    {fav.note ? (
                      <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: spacing.xs, lineHeight: 18 }} numberOfLines={2}>
                        📝 {fav.note.length > 100 ? `${fav.note.slice(0, 97)}…` : fav.note}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: spacing.xs }}>Nota eklenmemiş</Text>
                    )}

                    <Text style={{ fontSize: 11, color: palette.gold500, fontWeight: '600', marginTop: spacing.xs }}>
                      Sureye git →
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:          { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:     { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:     { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs, lineHeight: 18 },
  countBadge:    { marginTop: spacing.sm, alignSelf: 'flex-start' },
  emptyCenter:   { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  openQuranBtn:  { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full },
  favCard:       { flexDirection: 'row', borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  favAccent:     { width: 4 },
  favHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  surahBadge:    { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, borderWidth: 1 },
});
