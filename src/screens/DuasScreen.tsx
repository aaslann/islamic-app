import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      <View style={styles.headerCard}>
        <Text style={styles.title}>Günlük Dualar</Text>
        <Text style={styles.subtitle}>
          Sabah-akşam ve günlük hayatta sık okunan bazı temel dualar. Kategori
          butonlarıyla filtreleyebilirsin.
        </Text>
      </View>

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
        <View key={dua.id} style={styles.duaCard}>
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
              { fontSize: styles.duaArabic.fontSize * fontMultiplier },
            ]}
          >
            {dua.arabic}
          </Text>
          <Text
            style={[
              styles.duaTranslation,
              {
                fontSize:
                  styles.duaTranslation.fontSize * fontMultiplier,
              },
            ]}
          >
            {dua.translation}
          </Text>
        </View>
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
  },
  headerCard: {
    marginBottom: 12,
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
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#4B5563',
  },
  tabPillActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  tabPillPressed: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  tabText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  tabTextActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  duaCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  categoryText: {
    fontSize: 11,
    color: '#38BDF8',
  },
  duaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  duaArabic: {
    fontSize: 18,
    color: '#F9FAFB',
    marginTop: 4,
  },
  duaTranslation: {
    marginTop: 8,
    fontSize: 13,
    color: '#E5E7EB',
  },
});

