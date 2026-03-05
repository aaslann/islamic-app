import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';

type Props = NativeStackScreenProps<RootStackParamList, 'QuranSurahList'>;

type Surah = {
  id: number;
  name: string;
  arabic: string;
  ayahCount: number;
};

type FetchState = 'idle' | 'loading' | 'success' | 'error';

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

export default function QuranSurahListScreen({ navigation }: Props) {
  const [state, setState] = useState<FetchState>('idle');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSurahs = async () => {
    try {
      setState('loading');
      setErrorMessage(null);

      const response = await fetch('https://api.alquran.cloud/v1/surah');
      if (!response.ok) {
        throw new Error('api-error');
      }
      const json = await response.json();
      if (!json || !json.data || !Array.isArray(json.data)) {
        throw new Error('invalid-response');
      }

      const mapped: Surah[] = json.data.map((item: any) => ({
        id: item.number,
        name:
          TURKISH_SURA_NAMES[item.number] ??
          item.englishName ??
          `Sure ${item.number}`,
        arabic: item.name,
        ayahCount: item.numberOfAyahs,
      }));

      setSurahs(mapped);
      setState('success');
    } catch {
      setState('error');
      setErrorMessage(
        'Sure listesi alınırken bir hata oluştu. Lütfen internet bağlantını kontrol edip tekrar dene.',
      );
    }
  };

  useEffect(() => {
    loadSurahs();
  }, []);

  const handleOpenSurah = (surah: Surah) => {
    navigation.navigate('QuranSurahDetail', {
      surahId: surah.id,
      surahName: surah.name,
    });
  };

  return (
    <View style={styles.root}>
      <Card style={styles.headerCard}>
        <Text style={styles.title}>Kur&apos;an-ı Kerim</Text>
        <Text style={styles.subtitle}>
          Tam mushaf ve meal deneyimi. Aşağıda gerçek sure listesinden alınan
          veriler gösteriliyor.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('FavoriteAyahs')}
          style={({ pressed }) => [
            styles.favLinkButton,
            pressed && styles.favLinkButtonPressed,
          ]}
        >
          <Text style={styles.favLinkText}>⭐ Favori ayetlerimi gör</Text>
        </Pressable>
      </Card>

      {state === 'loading' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.infoText}>Sure listesi yükleniyor...</Text>
        </View>
      )}

      {state === 'error' && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={loadSurahs}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      )}

      {state === 'success' && (
        <FlatList
          data={surahs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpenSurah(item)}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={styles.itemLeft}>
                <View style={styles.indexCircle}>
                  <Text style={styles.indexText}>{item.id}</Text>
                </View>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.ayahCount} ayet</Text>
                </View>
              </View>
              <Text style={styles.itemArabic}>{item.arabic}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    ...textStyles.heading1,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.body,
    color: colors.textMuted,
  },
  favLinkButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  favLinkButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  favLinkText: {
    ...textStyles.caption,
    color: colors.primary,
  },
  centerBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
  retryButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  retryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  retryButtonText: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  item: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPressed: {
    backgroundColor: '#020617',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  itemName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text,
  },
  itemMeta: {
    marginTop: 2,
    ...textStyles.caption,
    color: colors.textMuted,
  },
  itemArabic: {
    ...textStyles.arabic,
    color: colors.accentGold,
  },
});

