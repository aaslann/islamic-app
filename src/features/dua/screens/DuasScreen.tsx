import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

type Dua = { id: string; category: 'sabah' | 'aksam' | 'gunluk'; title: string; arabic: string; translation: string };

const DUAS: Dua[] = [
  { id: 'sabah-1', category: 'sabah', title: 'Sabah Tesbihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', translation: 'Allah\'ı noksan sıfatlardan tenzih eder ve O\'nu hamd ile anarım.' },
  { id: 'aksam-1', category: 'aksam', title: 'Akşam Korunma Duası', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translation: 'Allah\'ın eksiksiz kelimelerine, O\'nun yarattıklarının şerrinden sığınırım.' },
  { id: 'gunluk-1', category: 'gunluk', title: 'Eve Girerken', arabic: 'بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا', translation: 'Allah\'ın adıyla girdik, Allah\'ın adıyla çıkarız ve Rabbimize tevekkül ettik.' },
  { id: 'gunluk-2', category: 'gunluk', title: 'Evden Çıkarken', arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translation: 'Allah\'ın adıyla çıkıyorum. Allah\'a tevekkül ettim. Güç ve kuvvet yalnız Allah iledir.' },
  { id: 'sabah-2', category: 'sabah', title: 'Sabah Korunma Duası', arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', translation: 'Allah\'ım, seninle sabahladık, seninle akşamladık, seninle yaşar, seninle ölürüz ve dönüş sanadır.' },
  { id: 'aksam-2', category: 'aksam', title: 'Akşam Tesbihi', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ', translation: 'Allah\'ım, sen benim Rabbimsin, senden başka ilah yoktur; beni sen yarattın, ben senin kulunum.' },
  { id: 'gunluk-3', category: 'gunluk', title: 'Yemek Duası', arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ', translation: 'Allah\'ın adıyla ve Allah\'ın bereketi üzere.' },
  { id: 'sabah-3', category: 'sabah', title: 'Seyyidül İstiğfar', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ', translation: 'Allah\'ım! Sen benim Rabbimsin, senden başka ilah yoktur. Beni sen yarattın, ben senin kulun ve ahdindeyim.' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  sabah: { bg: `${palette.gold500}20`, text: palette.gold400, emoji: '🌅' },
  aksam: { bg: `${palette.green500}20`, text: palette.green300, emoji: '🌙' },
  gunluk: { bg: 'rgba(139,92,246,.2)', text: '#A78BFA', emoji: '☀️' },
};

export default function DuasScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [activeCategory, setActiveCategory] = useState<'hepsi' | 'sabah' | 'aksam' | 'gunluk'>('hepsi');
  const [fontScale, setFontScale] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    AsyncStorage.getItem('app-settings-v2').then((raw) => {
      if (raw) {
        const p = JSON.parse(raw);
        if (['small', 'medium', 'large'].includes(p.fontScale)) setFontScale(p.fontScale);
      }
    });
  }, []);

  const fontMult = fontScale === 'small' ? 0.9 : fontScale === 'large' ? 1.15 : 1;
  const filteredDuas = useMemo(() => activeCategory === 'hepsi' ? DUAS : DUAS.filter((d) => d.category === activeCategory), [activeCategory]);

  const tabs = [
    { id: 'hepsi' as const, label: 'Hepsi', emoji: '📚' },
    { id: 'sabah' as const, label: 'Sabah', emoji: '🌅' },
    { id: 'aksam' as const, label: 'Akşam', emoji: '🌙' },
    { id: 'gunluk' as const, label: 'Günlük', emoji: '☀️' },
  ];

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]} style={styles.hero}>
        <Text style={[{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }]}>🤲 Günlük Dualar</Text>
        <Text style={[t.caption, { color: 'rgba(255,255,255,.6)', marginTop: spacing.xs }]}>Sabah-akşam ve günlük hayatta okunacak dualar</Text>
      </LinearGradient>

      {/* Category tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <Pressable key={tab.id} onPress={() => setActiveCategory(tab.id)}
            style={({ pressed }) => [styles.tab, activeCategory === tab.id && { backgroundColor: c.primarySoft, borderColor: c.primary }, pressed && { opacity: 0.75 }]}>
            <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
            <Text style={[t.captionBold, { color: activeCategory === tab.id ? c.primary : c.textSecondary }]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Dua cards */}
      {filteredDuas.map((dua) => {
        const cat = CATEGORY_COLORS[dua.category];
        return (
          <View key={dua.id} style={[styles.duaCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.duaHeader}>
              <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                <Text style={[{ fontSize: 10, fontWeight: '700', color: cat.text }]}>{cat.emoji} {dua.category === 'sabah' ? 'Sabah' : dua.category === 'aksam' ? 'Akşam' : 'Günlük'}</Text>
              </View>
              <Text style={[t.bodyBold, { color: c.text, flex: 1 }]}>{dua.title}</Text>
            </View>

            {/* Arabic */}
            <View style={[styles.arabicBox, { backgroundColor: `${palette.gold500}08`, borderColor: `${palette.gold500}20` }]}>
              <Text style={[styles.arabic, { fontSize: 20 * fontMult, color: theme.dark ? palette.gold300 : palette.gold500 }]}>
                {dua.arabic}
              </Text>
            </View>

            {/* Translation */}
            <Text style={[t.caption, { color: c.textSecondary, lineHeight: 20, fontSize: 13 * fontMult, marginTop: spacing.sm }]}>
              {dua.translation}
            </Text>
          </View>
        );
      })}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  content:   { paddingBottom: spacing.xxl },
  hero:      { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  tabsRow:   { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginVertical: spacing.md },
  tab:       { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: radii.lg, borderWidth: 1, borderColor: 'transparent' },
  duaCard:   { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radii.xl, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  duaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  catBadge:  { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full },
  arabicBox: { borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, marginVertical: spacing.sm },
  arabic:    { textAlign: 'right', lineHeight: 42, direction: 'rtl' as any },
});
