import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ESMA_NAMES, type EsmaName } from '../data/names';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { AdBanner } from '../../../shared/components/AdBanner';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EsmaulHusnaListScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return ESMA_NAMES;
    return ESMA_NAMES.filter((n) =>
      n.latin.toLocaleLowerCase('tr').includes(q) ||
      n.meaning.toLocaleLowerCase('tr').includes(q) ||
      String(n.no).includes(q),
    );
  }, [query]);

  const todayIndex = new Date().getDate() % 99;
  const todayName = ESMA_NAMES[todayIndex];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>ESMÂÜL HÜSNÂ</Text>
        <Text style={styles.heroTitle}>Allah'ın 99 İsmi</Text>
        <Text style={styles.heroSub}>"En güzel isimler Allah'ındır."</Text>

        <Pressable
          style={styles.todayCard}
          onPress={() => navigation.navigate('EsmaulHusnaDetail', { no: todayName.no })}
        >
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>✦ BUGÜN</Text>
          </View>
          <Text style={styles.todayArabic}>{todayName.arabic}</Text>
          <Text style={styles.todayLatin}>{todayName.latin}</Text>
          <Text style={styles.todayMeaning}>"{todayName.meaning}"</Text>
        </Pressable>
      </LinearGradient>

      <View style={[styles.searchWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search" size={16} color={c.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="İsim veya anlam ara..."
          placeholderTextColor={c.textSecondary}
          style={[styles.searchInput, { color: c.text }]}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.no)}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <NameCard item={item} onPress={() => navigation.navigate('EsmaulHusnaDetail', { no: item.no })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[t.body, { color: c.textSecondary }]}>Sonuç bulunamadı.</Text>
          </View>
        }
        ListFooterComponent={items.length > 0 ? <AdBanner /> : null}
      />
    </View>
  );
}

function NameCard({ item, onPress }: { item: EsmaName; onPress: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.card,
      { backgroundColor: c.surface, borderColor: `${palette.gold500}28` },
      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
    ]}>
      <View style={styles.cardNumWrap}>
        <Text style={styles.cardNum}>{item.no}</Text>
      </View>
      <Text style={styles.cardArabic} numberOfLines={1}>{item.arabic}</Text>
      <Text style={[styles.cardLatin, { color: c.text }]} numberOfLines={1}>{item.latin}</Text>
      <Text style={[styles.cardMeaning, { color: c.textSecondary }]} numberOfLines={1}>{item.meaning}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  heroLabel: { fontSize: 10, color: palette.gold400, fontWeight: '700', letterSpacing: 3 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: 6 },

  todayCard: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(200,162,74,0.1)',
    borderColor: `${palette.gold500}40`,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  todayBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#0D1F18',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    borderColor: palette.gold500,
    borderWidth: 1,
  },
  todayBadgeText: { fontSize: 9, fontWeight: '800', color: palette.gold400, letterSpacing: 2 },
  todayArabic: { fontSize: 32, color: palette.gold400, marginTop: 4, fontWeight: '600' },
  todayLatin: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 4 },
  todayMeaning: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: 2 },

  searchWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 130,
  },
  cardNumWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200,162,74,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  cardNum: { fontSize: 11, fontWeight: '800', color: palette.gold400 },
  cardArabic: { fontSize: 22, color: palette.gold400, fontWeight: '600', textAlign: 'right' },
  cardLatin: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  cardMeaning: { fontSize: 11, marginTop: 2 },

  empty: { padding: spacing.xl, alignItems: 'center' },
});
