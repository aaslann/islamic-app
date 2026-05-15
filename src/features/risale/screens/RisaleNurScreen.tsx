import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../../../theme/designSystem';
import { Card } from '../../../shared/components/Card';

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
      <Card style={styles.card}>
        <Text style={styles.title}>Risale-i Nur Külliyatı</Text>
        <Text style={styles.subtitle}>
          Bediüzzaman Said Nursî&apos;nin iman ve Kur&apos;an hakikatlerini izah eden eserlerinden
          ana bölümler. Bu ekranda şimdilik sadece yapı iskeleti yer alıyor; tam metinler için
          telif durumuna uygun ayrı bir veri kaynağı entegre edilmelidir.
        </Text>
      </Card>

      {WORKS.map((work) => (
        <Card key={work.id} style={styles.workCard}>
          <Text style={styles.workTitle}>{work.title}</Text>
          <Text style={styles.workDescription}>{work.description}</Text>
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
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  workCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  workTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  workDescription: {
    ...textStyles.caption,
  },
});

