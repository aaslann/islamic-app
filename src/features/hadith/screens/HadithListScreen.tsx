import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HADITHS, type Hadith } from '../data/hadiths';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HadithListScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return HADITHS;
    return HADITHS.filter((h) =>
      h.topic.toLocaleLowerCase('tr').includes(q) ||
      h.text.toLocaleLowerCase('tr').includes(q) ||
      h.narrator.toLocaleLowerCase('tr').includes(q),
    );
  }, [query]);

  const todayIndex = new Date().getDate() % HADITHS.length;
  const todayHadith = HADITHS[todayIndex];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>40 HADİS</Text>
        <Text style={styles.heroTitle}>Hadis-i Nevevî</Text>
        <Text style={styles.heroSub}>İmam Nevevî'nin Erbaîn derlemesi</Text>

        <Pressable
          style={styles.todayCard}
          onPress={() => navigation.navigate('HadithDetail', { id: todayHadith.id })}
        >
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>✦ GÜNÜN HADİSİ</Text>
          </View>
          <Text style={styles.todayTopic}>{todayHadith.topic}</Text>
          <Text style={styles.todayText} numberOfLines={3}>"{todayHadith.text}"</Text>
          <Text style={styles.todayNarrator}>— {todayHadith.narrator}</Text>
        </Pressable>
      </LinearGradient>

      <View style={[styles.searchWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search" size={16} color={c.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Konu, ravi veya metin..."
          placeholderTextColor={c.textSecondary}
          style={[styles.searchInput, { color: c.text }]}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <HadithRow item={item} onPress={() => navigation.navigate('HadithDetail', { id: item.id })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[t.body, { color: c.textSecondary }]}>Sonuç bulunamadı.</Text>
          </View>
        }
      />
    </View>
  );
}

function HadithRow({ item, onPress }: { item: Hadith; onPress: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.rowNum}>
        <Text style={styles.rowNumText}>{item.id}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTopic, { color: c.text }]}>{item.topic}</Text>
        <Text style={[styles.rowText, { color: c.textSecondary }]} numberOfLines={2}>{item.text}</Text>
        <View style={styles.rowMeta}>
          <Ionicons name="person-outline" size={11} color={palette.gold400} />
          <Text style={styles.rowNarrator}>{item.narrator}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} style={{ opacity: 0.5 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  heroLabel: { fontSize: 10, color: palette.gold400, fontWeight: '700', letterSpacing: 3 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  todayCard: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(200,162,74,0.1)',
    borderColor: `${palette.gold500}40`,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  todayBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#0D1F18',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    borderColor: palette.gold500,
    borderWidth: 1,
  },
  todayBadgeText: { fontSize: 9, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5 },
  todayTopic: { fontSize: 14, fontWeight: '800', color: palette.gold400, marginTop: 6 },
  todayText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginTop: 4, lineHeight: 19 },
  todayNarrator: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'right' },

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

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  rowNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(200,162,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumText: { fontSize: 13, fontWeight: '800', color: palette.gold400 },
  rowTopic: { fontSize: 14, fontWeight: '800' },
  rowText: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowNarrator: { fontSize: 10, color: palette.gold400, fontWeight: '600' },

  empty: { padding: spacing.xl, alignItems: 'center' },
});
