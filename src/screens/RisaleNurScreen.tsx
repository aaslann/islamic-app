import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Work = {
  id: string;
  title: string;
  description: string;
};

const WORKS: Work[] = [
  {
    id: 'sozler',
    title: 'Sözler',
    description: 'İman hakikatleri üzerine derin tefekkürler içeren risaleler.',
  },
  {
    id: 'mektubat',
    title: 'Mektubat',
    description:
      'Talebelerine ve dönemin alimlerine yazılmış mektuplardan oluşan eser.',
  },
  {
    id: 'lemalar',
    title: 'Lem&apos;alar',
    description:
      'İhlas, uhuvvet ve takvâ gibi konularda kısa, yoğun dersler.',
  },
  {
    id: 'sualar',
    title: 'Şu&apos;alar',
    description:
      'İman ve Kur&apos;an hizmeti ekseninde yazılmış ileri seviye risaleler.',
  },
];

export default function RisaleNurScreen() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Risale-i Nur Külliyatı</Text>
        <Text style={styles.subtitle}>
          Bediüzzaman Said Nursî&apos;nin iman ve Kur&apos;an hakikatlerini izah eden eserlerinden
          ana bölümler. Bu ekranda şimdilik sadece yapı iskeleti yer alıyor; tam metinler için
          telif durumuna uygun ayrı bir veri kaynağı entegre edilmelidir.
        </Text>
      </View>

      {WORKS.map((work) => (
        <View key={work.id} style={styles.workCard}>
          <Text style={styles.workTitle}>{work.title}</Text>
          <Text style={styles.workDescription}>{work.description}</Text>
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
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0B1120',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
    marginBottom: 12,
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
  workCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  workTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  workDescription: {
    fontSize: 13,
    color: '#E5E7EB',
  },
});

