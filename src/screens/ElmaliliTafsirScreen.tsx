import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';

type Volume = {
  id: string;
  title: string;
  description: string;
};

const VOLUMES: Volume[] = [
  {
    id: 'cilt-1',
    title: 'Cilt 1',
    description:
      'Fâtiha ve Bakara sûreleri tefsiri. Elmalılı Hamdi Yazır&apos;ın &quot;Hak Dini Kur&apos;an Dili&quot; eserinin ilk cildi.',
  },
  {
    id: 'cilt-2',
    title: 'Cilt 2',
    description: 'Âl-i İmrân, Nisâ ve Mâide sûrelerinin tefsiri.',
  },
  {
    id: 'cilt-3',
    title: 'Cilt 3',
    description: 'En&apos;âm, A&apos;râf ve Enfâl sûrelerinin tefsiri.',
  },
];

export default function ElmaliliTafsirScreen() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <Text style={styles.title}>Elmalılı Hamdi Yazır Tefsiri</Text>
        <Text style={styles.subtitle}>
          &quot;Hak Dini Kur&apos;an Dili&quot; isimli tefsir eserinin cilt bazlı
          yapısı. Bu ekranda şimdilik örnek cilt başlıkları gösteriliyor; tam
          tefsir metni için yasal veri kaynağı ile entegrasyon yapılmalıdır.
        </Text>
      </Card>

      {VOLUMES.map((volume) => (
        <Card key={volume.id} style={styles.volumeCard}>
          <Text style={styles.volumeTitle}>{volume.title}</Text>
          <Text style={styles.volumeDescription}>{volume.description}</Text>
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
  },
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  volumeCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  volumeTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  volumeDescription: {
    ...textStyles.caption,
  },
});

