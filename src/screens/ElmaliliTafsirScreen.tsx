import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.card}>
        <Text style={styles.title}>Elmalılı Hamdi Yazır Tefsiri</Text>
        <Text style={styles.subtitle}>
          &quot;Hak Dini Kur&apos;an Dili&quot; isimli tefsir eserinin cilt bazlı
          yapısı. Bu ekranda şimdilik örnek cilt başlıkları gösteriliyor; tam
          tefsir metni için yasal veri kaynağı ile entegrasyon yapılmalıdır.
        </Text>
      </View>

      {VOLUMES.map((volume) => (
        <View key={volume.id} style={styles.volumeCard}>
          <Text style={styles.volumeTitle}>{volume.title}</Text>
          <Text style={styles.volumeDescription}>{volume.description}</Text>
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
  volumeCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  volumeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  volumeDescription: {
    fontSize: 13,
    color: '#E5E7EB',
  },
});

