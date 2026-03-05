import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';

type Dua = {
  id: string;
  category: 'sabah' | 'aksam' | 'gunluk';
  title: string;
  arabic: string;
  translation: string;
};

const DUAS: Dua[] = [
  {
    id: 'sabah-1',
    category: 'sabah',
    title: 'Sabah Tesbihi',
    arabic:
      'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    translation: 'Allah’ı noksan sıfatlardan tenzih eder ve O’nu hamd ile anarım.',
  },
  {
    id: 'aksam-1',
    category: 'aksam',
    title: 'Akşam Korunma Duası',
    arabic:
      'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    translation:
      'Allah’ın eksiksiz kelimelerine, O’nun yarattıklarının şerrinden sığınırım.',
  },
  {
    id: 'gunluk-1',
    category: 'gunluk',
    title: 'Eve Girerken',
    arabic:
      'بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    translation:
      'Allah’ın adıyla girdik, Allah’ın adıyla çıkarız ve Rabbimize tevekkül ettik.',
  },
  {
    id: 'gunluk-2',
    category: 'gunluk',
    title: 'Evden Çıkarken',
    arabic:
      'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    translation:
      'Allah’ın adıyla (evden çıkıyorum). Allah’a tevekkül ettim. Güç ve kuvvet yalnız Allah iledir.',
  },
  {
    id: 'sabah-2',
    category: 'sabah',
    title: 'Sabah Korunma Duası',
    arabic:
      'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    translation:
      'Allah’ım, seninle sabahladık, seninle akşamladık, seninle yaşar, seninle ölürüz ve dönüş sanadır.',
  },
  {
    id: 'aksam-2',
    category: 'aksam',
    title: 'Akşam Tesbihi',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ',
    translation:
      'Allah’ım, sen benim Rabbimsin, senden başka ilah yoktur; beni sen yarattın, ben senin kulunum. (Kısa bir bölüm)',
  },
];

export default function DuasScreen() {
  const [activeCategory, setActiveCategory] = useState<
    'hepsi' | 'sabah' | 'aksam' | 'gunluk'
  >('hepsi');
  const [fontScale, setFontScale] = useState<'small' | 'medium' | 'large'>(
    'medium',
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem('app-settings-v1');
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

  const filteredDuas = useMemo(() => {
    if (activeCategory === 'hepsi') return DUAS;
    return DUAS.filter((d) => d.category === activeCategory);
  }, [activeCategory]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.headerCard}>
        <Text style={styles.title}>Günlük Dualar</Text>
        <Text style={styles.subtitle}>
          Sabah-akşam ve günlük hayatta sık okunan bazı temel dualar. Kategori
          butonlarıyla filtreleyebilirsin.
        </Text>
      </Card>

      <View style={styles.tabsRow}>
        {[
          { id: 'hepsi' as const, label: 'Hepsi' },
          { id: 'sabah' as const, label: 'Sabah' },
          { id: 'aksam' as const, label: 'Akşam' },
          { id: 'gunluk' as const, label: 'Günlük' },
        ].map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveCategory(tab.id)}
            style={({ pressed }) => [
              styles.tabPill,
              activeCategory === tab.id && styles.tabPillActive,
              pressed && styles.tabPillPressed,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeCategory === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredDuas.map((dua) => (
        <Card key={dua.id} style={styles.duaCard}>
          <View style={styles.duaHeader}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>
                {dua.category === 'sabah'
                  ? 'Sabah'
                  : dua.category === 'aksam'
                  ? 'Akşam'
                  : 'Günlük'}
              </Text>
            </View>
            <Text style={styles.duaTitle}>{dua.title}</Text>
          </View>
          <Text
            style={[
              styles.duaArabic,
              { fontSize: 18 * fontMultiplier },
            ]}
          >
            {dua.arabic}
          </Text>
          <Text
            style={[
              styles.duaTranslation,
              {
                fontSize: 13 * fontMultiplier,
              },
            ]}
          >
            {dua.translation}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  tabPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  tabPillPressed: {
    backgroundColor: '#E5F2ED',
  },
  tabText: {
    ...textStyles.caption,
    color: colors.textSoft,
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  duaCard: {
    marginTop: spacing.md,
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  categoryText: {
    fontSize: 11,
    color: colors.primary,
  },
  duaTitle: {
    ...textStyles.body,
    fontWeight: '600',
  },
  duaArabic: {
    ...textStyles.arabic,
    marginTop: spacing.xs,
  },
  duaTranslation: {
    marginTop: spacing.sm,
    ...textStyles.caption,
  },
});

