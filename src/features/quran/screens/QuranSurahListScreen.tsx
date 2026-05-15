import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { getCache, setCache, TTL } from '../../../core/cache/appCache';

const CACHE_KEY = 'qcache-surahlist-v1';

type Props = NativeStackScreenProps<RootStackParamList, 'QuranSurahList'>;

type Surah = { id: number; name: string; arabic: string; ayahCount: number; page: number };

const TURKISH_NAMES: Record<number, string> = {
  1:'Fâtiha',2:'Bakara',3:'Âl-i İmrân',4:'Nisâ',5:'Mâide',6:'En\'âm',7:'A\'râf',8:'Enfâl',9:'Tevbe',10:'Yûnus',
  11:'Hûd',12:'Yûsuf',13:'Ra\'d',14:'İbrâhîm',15:'Hicr',16:'Nahl',17:'İsrâ',18:'Kehf',19:'Meryem',20:'Tâhâ',
  21:'Enbiyâ',22:'Hacc',23:'Mü\'minûn',24:'Nûr',25:'Furkân',26:'Şuarâ',27:'Neml',28:'Kasas',29:'Ankebût',30:'Rûm',
  31:'Lokmân',32:'Secde',33:'Ahzâb',34:'Sebe\'',35:'Fâtır',36:'Yâsîn',37:'Sâffât',38:'Sâd',39:'Zümer',40:'Mü\'min',
  41:'Fussilet',42:'Şûrâ',43:'Zuhruf',44:'Duhân',45:'Câsiye',46:'Ahkâf',47:'Muhammed',48:'Fetih',49:'Hucurât',50:'Kaf',
  51:'Zâriyât',52:'Tûr',53:'Necm',54:'Kamer',55:'Rahmân',56:'Vâkıa',57:'Hadîd',58:'Mücâdele',59:'Haşr',60:'Mümtehine',
  61:'Saff',62:'Cuma',63:'Münâfikûn',64:'Tegâbün',65:'Talâk',66:'Tahrîm',67:'Mülk',68:'Kalem',69:'Hâkka',70:'Meâric',
  71:'Nûh',72:'Cin',73:'Müzzemmil',74:'Müddessir',75:'Kıyâme',76:'İnsan',77:'Mürselât',78:'Nebe\'',79:'Nâziât',80:'Abese',
  81:'Tekvîr',82:'İnfitâr',83:'Mutaffifîn',84:'İnşikâk',85:'Bürûc',86:'Târık',87:'A\'lâ',88:'Gâşiye',89:'Fecr',90:'Beled',
  91:'Şems',92:'Leyl',93:'Duha',94:'İnşirah',95:'Tîn',96:'Alak',97:'Kadr',98:'Beyyine',99:'Zilzâl',100:'Âdiyât',
  101:'Kâria',102:'Tekâsür',103:'Asr',104:'Hümeze',105:'Fîl',106:'Kureyş',107:'Mâûn',108:'Kevser',109:'Kâfirûn',
  110:'Nasr',111:'Tebbet',112:'İhlâs',113:'Felak',114:'Nâs',
};

const JUZ_STARTS: Record<number, number> = {
  1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,11:11,12:12,13:13,14:14,15:15,
  16:18,17:21,18:23,19:25,20:27,21:29,22:33,23:36,24:39,25:41,26:46,27:51,
  28:58,29:67,30:78,
};

export default function QuranSurahListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const loadSurahs = async () => {
    try {
      setState('loading'); setErrorMsg(null);
      // Try cache first
      const cached = await getCache<Surah[]>(CACHE_KEY, TTL.SEVEN_DAYS);
      if (cached) { setSurahs(cached); setState('success'); return; }
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      if (!res.ok) throw new Error('api-error');
      const json = await res.json();
      if (!Array.isArray(json?.data)) throw new Error('invalid');
      const mapped = json.data.map((d: any): Surah => ({
        id: d.number,
        name: TURKISH_NAMES[d.number] ?? d.englishName ?? `Sure ${d.number}`,
        arabic: d.name,
        ayahCount: d.numberOfAyahs,
        page: d.page ?? 0,
      }));
      setSurahs(mapped);
      setState('success');
      setCache(CACHE_KEY, mapped);
    } catch {
      // Fallback to stale cache if available
      const stale = await getCache<Surah[]>(CACHE_KEY, TTL.THIRTY_DAYS);
      if (stale) { setSurahs(stale); setState('success'); return; }
      setState('error');
      setErrorMsg('Sure listesi alınamadı. İnternet bağlantını kontrol et.');
    }
  };

  useEffect(() => { loadSurahs(); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return surahs;
    const q = query.toLowerCase();
    return surahs.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.arabic.includes(q) ||
      String(s.id).includes(q)
    );
  }, [surahs, query]);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Hero */}
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: palette.gold400, letterSpacing: 1.2, marginBottom: 4 }}>
              KUR'AN-I KERİM
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
              114 Sure · 6236 Ayet
            </Text>
            <Text style={[t.caption, { color: 'rgba(255,255,255,.5)', marginTop: 2 }]}>
              Arapça metin + Diyanet meali
            </Text>
          </View>
          <View style={styles.heroRight}>
            <Pressable onPress={() => setShowSearch((p) => !p)} style={[styles.iconBtn, showSearch && { backgroundColor: `${palette.gold500}25`, borderColor: `${palette.gold500}50` }]}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('FavoriteAyahs')} style={styles.iconBtn}>
              <Text style={{ fontSize: 16 }}>⭐</Text>
            </Pressable>
          </View>
        </View>

        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.15)' }]}>
            <Text style={{ fontSize: 14, marginRight: spacing.sm }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Sure adı veya numara ara..."
              placeholderTextColor="rgba(255,255,255,.4)"
              style={[t.body, { flex: 1, color: '#fff', fontSize: 14 }]}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>✕</Text>
              </Pressable>
            )}
          </View>
        )}
      </LinearGradient>

      {/* States */}
      {state === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.gold500} />
          <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.md }]}>Sure listesi yükleniyor...</Text>
        </View>
      )}

      {state === 'error' && (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: spacing.md }}>⚠️</Text>
          <Text style={[t.body, { color: '#FCA5A5', textAlign: 'center', marginBottom: spacing.lg }]}>{errorMsg}</Text>
          <Pressable onPress={loadSurahs} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
            <Text style={[t.bodyBold, { color: '#fff' }]}>Tekrar Dene</Text>
          </Pressable>
        </View>
      )}

      {state === 'success' && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={[t.body, { color: c.textSecondary, marginTop: spacing.sm }]}>Sonuç bulunamadı</Text>
            </View>
          }
          renderItem={({ item }) => {
            const juzNum = Object.entries(JUZ_STARTS).findLast(([, start]) => item.id >= start)?.[0];
            return (
              <Pressable
                onPress={() => navigation.navigate('QuranSurahDetail', { surahId: item.id, surahName: item.name })}
                style={({ pressed }) => [styles.item, { backgroundColor: c.surface, borderColor: c.border }, pressed && { backgroundColor: c.primarySoft }]}
              >
                {/* Number badge */}
                <View style={[styles.numBadge, { backgroundColor: `${palette.gold500}18`, borderColor: `${palette.gold500}35` }]}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold500 }}>{item.id}</Text>
                </View>

                {/* Name */}
                <View style={styles.nameCol}>
                  <Text style={[t.bodyBold, { color: c.text }]}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[t.caption, { color: c.textSecondary }]}>{item.ayahCount} ayet</Text>
                    {juzNum && (
                      <View style={[styles.juzBadge, { backgroundColor: `${palette.green500}15` }]}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: palette.green300 }}>{juzNum}. Cüz</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Arabic */}
                <Text style={{ fontFamily: 'Amiri_400Regular', fontSize: 20, color: palette.gold400, textAlign: 'right' }}>
                  {item.arabic}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  hero:       { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  heroRow:    { flexDirection: 'row', alignItems: 'flex-start' },
  heroRight:  { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  iconBtn:    { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' },
  searchBar:  { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  retryBtn:   { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full },
  list:       { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  item:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.xl, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  numBadge:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameCol:    { flex: 1 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  juzBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.full },
});
