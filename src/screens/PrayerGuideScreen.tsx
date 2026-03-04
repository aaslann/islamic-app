import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Step = {
  id: string;
  title: string;
  description: string;
  accentColor: string;
};

const STEPS: Step[] = [
  {
    id: 'niyet',
    title: '1. Niyet',
    description:
      'Hangi namazı, kaç rekat kılacağına kalben ve dilinle niyet et. Örneğin: “Niyet ettim Allah rızası için bugünün öğle namazının farzını kılmaya.”',
    accentColor: '#38BDF8',
  },
  {
    id: 'tekbir',
    title: '2. İftitah Tekbiri',
    description:
      'Ellerini omuz hizasına kaldırıp “Allahu Ekber” diyerek namaza başla, ellerini göğüs hizasında birleştir.',
    accentColor: '#22C55E',
  },
  {
    id: 'kiraat',
    title: '3. Kıraat',
    description:
      'Önce Fatiha Suresi’ni oku, ardından imkânına göre kısa bir sure veya birkaç ayet daha ekle.',
    accentColor: '#F97316',
  },
  {
    id: 'ruku',
    title: '4. Rükû',
    description:
      '“Allahu Ekber” diyerek rükûya git, belin düz olacak şekilde eğil ve en az üç kez “Sübhane rabbiye’l-azîm” de.',
    accentColor: '#A855F7',
  },
  {
    id: 'secde',
    title: '5. Secde',
    description:
      '“Semiallâhu limen hamideh” deyip doğrul, ardından “Allahu Ekber” diyerek secdeye git, en az üç kez “Sübhane rabbiye’l-a’lâ” de. İki secde arasında kısa bir oturuş yap.',
    accentColor: '#FACC15',
  },
  {
    id: 'ikinci-rekat',
    title: '6. İkinci Rekât',
    description:
      'İkinci rekâta kalk, yine Fatiha ve kısa bir sure oku, rükû ve secdeleri birinci rekât gibi tamamla.',
    accentColor: '#0EA5E9',
  },
  {
    id: 'tahiyyat',
    title: '7. Tahiyyat Oturuşu',
    description:
      'Son oturuşta “Ettehiyyâtü, Allâhümme salli, Allâhümme barik, Rabbenâ âtinâ” ve dualarını oku.',
    accentColor: '#FBBF24',
  },
  {
    id: 'selam',
    title: '8. Selam',
    description:
      'Önce sağa, sonra sola dönerek “Esselâmü aleyküm ve rahmetullah” diyerek namazı bitir.',
    accentColor: '#34D399',
  },
];

export default function PrayerGuideScreen() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Namaz Kılavuzu</Text>
        <Text style={styles.subtitle}>
          Farz bir namazın rekâtlarını temel adımlarıyla takip edebilirsin.
        </Text>
      </View>

      {STEPS.map((step, index) => (
        <View key={step.id} style={styles.stepCard}>
          <View
            style={[
              styles.stepIllustration,
              { borderColor: step.accentColor, backgroundColor: 'rgba(15,23,42,0.9)' },
            ]}
          >
            <View
              style={[
                styles.stepIllustrationCircle,
                { backgroundColor: step.accentColor },
              ]}
            />
          </View>
          <View style={styles.stepHeader}>
            <View style={styles.stepIndexCircle}>
              <Text style={styles.stepIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
      ))}

      <Text style={styles.noteText}>
        Not: Bu kılavuz genel bir özet niteliğindedir. Mezhebine göre detaylar
        farklılık gösterebilir; güvenilir ilmihal kaynaklarını da mutlaka
        incele.
      </Text>
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
  header: {
    marginBottom: 16,
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
  stepCard: {
    marginTop: 12,
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  stepIllustration: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIllustrationCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepIndexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1120',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  stepDescription: {
    fontSize: 13,
    color: '#E5E7EB',
    marginTop: 4,
  },
  noteText: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

