import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HADITHS } from '../data/hadiths';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';

const FAV_KEY = '@hadith-favs-v1';

type DetailRoute = RouteProp<RootStackParamList, 'HadithDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HadithDetailScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();

  const currentIdx = useMemo(() => HADITHS.findIndex((h) => h.id === route.params.id), [route.params.id]);
  const hadith = HADITHS[currentIdx];
  const prev = currentIdx > 0 ? HADITHS[currentIdx - 1] : null;
  const next = currentIdx < HADITHS.length - 1 ? HADITHS[currentIdx + 1] : null;

  const [favs, setFavs] = useState<number[]>([]);
  const isFav = favs.includes(hadith.id);

  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY)
      .then((raw) => {
        if (raw) setFavs(JSON.parse(raw) as number[]);
      })
      .catch(() => {});
  }, []);

  const toggleFav = useCallback(() => {
    setFavs((prev) => {
      const next = prev.includes(hadith.id)
        ? prev.filter((id) => id !== hadith.id)
        : [...prev, hadith.id];
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [hadith.id]);

  const onShare = useCallback(() => {
    Share.share({
      message: `"${hadith.text}"\n— ${hadith.narrator}\n(${hadith.source})\n\nİslami Asistan uygulamasından`,
    }).catch(() => {});
  }, [hadith]);

  useEffect(() => {
    navigation.setOptions({
      title: `${hadith.id}. ${hadith.topic}`,
      headerRight: () => (
        <Pressable onPress={toggleFav} style={{ marginRight: 8, padding: 4 }}>
          <Ionicons name={isFav ? 'star' : 'star-outline'} size={22} color={palette.gold400} />
        </Pressable>
      ),
    });
  }, [navigation, hadith, isFav, toggleFav]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{hadith.id} / 40</Text>
        </View>
        <Text style={styles.topic}>{hadith.topic}</Text>
        <View style={styles.narratorRow}>
          <Ionicons name="person" size={14} color={palette.gold400} />
          <Text style={styles.narrator}>{hadith.narrator}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: `${palette.gold500}30` }]}>
        <View style={styles.quoteIcon}>
          <Text style={styles.quoteText}>"</Text>
        </View>
        <Text style={[styles.hadithText, { color: c.text }]}>{hadith.text}</Text>
        <View style={[styles.divider, { backgroundColor: `${palette.gold500}22` }]} />
        <View style={styles.sourceRow}>
          <Ionicons name="book-outline" size={14} color={palette.gold400} />
          <Text style={styles.source}>{hadith.source}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={toggleFav}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: c.surface, borderColor: c.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name={isFav ? 'star' : 'star-outline'} size={18} color={isFav ? palette.gold500 : c.text} />
          <Text style={[styles.actionText, { color: c.text }]}>{isFav ? 'Favorilerde' : 'Favorile'}</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: c.surface, borderColor: c.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="share-outline" size={18} color={c.text} />
          <Text style={[styles.actionText, { color: c.text }]}>Paylaş</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => prev && navigation.replace('HadithDetail', { id: prev.id })}
          disabled={!prev}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: c.surface, borderColor: c.border },
            !prev && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={c.text} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.navLabel, { color: c.textSecondary }]}>ÖNCEKİ</Text>
            <Text style={[styles.navName, { color: c.text }]} numberOfLines={1}>
              {prev ? prev.topic : '—'}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => next && navigation.replace('HadithDetail', { id: next.id })}
          disabled={!next}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: c.surface, borderColor: c.border },
            !next && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={{ flex: 1, marginRight: 8, alignItems: 'flex-end' }}>
            <Text style={[styles.navLabel, { color: c.textSecondary }]}>SONRAKİ</Text>
            <Text style={[styles.navName, { color: c.text }]} numberOfLines={1}>
              {next ? next.topic : '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.text} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  hero: { padding: spacing.lg, alignItems: 'center' },
  numBadge: {
    backgroundColor: 'rgba(200,162,74,0.18)',
    borderColor: `${palette.gold500}50`,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: spacing.md,
  },
  numText: { fontSize: 10, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5 },
  topic: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  narratorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  narrator: { fontSize: 13, color: palette.gold400, fontWeight: '600' },

  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  quoteIcon: {
    position: 'absolute',
    top: -16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.gold500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: { fontSize: 28, color: '#0D1F18', fontWeight: '900', marginTop: -8 },
  hadithText: { fontSize: 15, lineHeight: 25, letterSpacing: 0.2 },
  divider: { height: 1, marginVertical: spacing.md },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  source: { fontSize: 11, color: palette.gold400, fontWeight: '600' },

  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '700' },

  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  navLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  navName: { fontSize: 13, fontWeight: '700', marginTop: 2 },
});
