import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type Work = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  description: string;
  keyTopics: string[];
  famousQuote?: string;
  famousQuoteRef?: string;
};

const WORKS: Work[] = [
  {
    id: 'sozler',
    title: 'Sözler',
    subtitle: '33 risale — İmanın esasları',
    emoji: '📜',
    accent: '#6366F1',
    description:
      'Risale-i Nur\'un temel taşı. Allah\'ın varlığı ve birliği, peygamberlik, haşir gibi iman hakikatlerini akıl ve kalbi birleştiren bir üslupla ele alır.',
    keyTopics: ['Allah\'ın varlığı ve birliği', 'Nübüvvet ve mu\'cizeler', 'Haşir ve âhiret', 'Kur\'an\'ın i\'cazı', 'İnsanın yaratılış hikmeti'],
    famousQuote: 'Ey insan! Sen kendine mâlik değilsin; sen bir Kadîr-i Zülcelâl\'in kudret eliyle tutulmuş bir misafirhane müsafirisin.',
    famousQuoteRef: 'Onuncu Söz',
  },
  {
    id: 'mektubat',
    title: 'Mektubat',
    subtitle: '33 mektup — İhlas ve uhuvvet',
    emoji: '✉️',
    accent: '#0EA5E9',
    description:
      'Talebelerine ve dönemin âlimlerine yazılan mektuplardan oluşur. İhlas, uhuvvet, takva ve niyet gibi amel-i salihin ruhunu işler.',
    keyTopics: ['İhlas ve samimilik', 'İslam kardeşliği', 'Şükür ve sabır', 'Ehl-i sünnet yolu', 'Siyaset ve din'],
    famousQuote: 'Lillahilhamd, uhuvvet-i imaniyenin sırrıyla, bu kardeşliğin kıymetini takdir ediyorum.',
    famousQuoteRef: 'Yirmi İkinci Mektup',
  },
  {
    id: 'lemalar',
    title: "Lem'alar",
    subtitle: '33 lem\'a — Pratik ahlak dersleri',
    emoji: '✨',
    accent: '#F59E0B',
    description:
      'İhlas, hüsn-ü zan, şükür ve kanaat gibi günlük manevi hayatın temel değerlerini kısa ve yoğun derslerle sunar.',
    keyTopics: ['İhlas risalesi', 'Hüsn-ü zan', 'Kanaat ve şükür', 'Tevazu ve kibir', 'İktisad ve israf'],
    famousQuote: 'Amelde ihlası kazanmak için, nefsini ve dünyayı ve uhrevî makamatı düşünme; yalnız rıza-yı İlahîyi düşün.',
    famousQuoteRef: 'Yirminci Lem\'a — İhlas Risalesi',
  },
  {
    id: 'sualar',
    title: "Şu'alar",
    subtitle: '15 şua — İleri seviye iman dersleri',
    emoji: '🌟',
    accent: '#EC4899',
    description:
      'Kur\'an\'ın i\'cazı, âyetlerin işaretleri ve iman hizmetinin esasları gibi daha derinlikli konuları ele alır. Âyetü\'l-Kübrâ bu bölümün en hacimli risalesidir.',
    keyTopics: ["Âyetü'l-Kübrâ", "Kur'an'ın i'cazı", 'İmanın hakikatleri', 'Arapça kalıplar ve belâgat', 'Hapis mektupları'],
    famousQuote: 'Kur\'an, kâinat kitabının âyet-i kübrası olan bu âlemin tercüme-i ezeliyesidir.',
    famousQuoteRef: "Birinci Şua'",
  },
  {
    id: 'isarat',
    title: "İşarât-ül İ'câz",
    subtitle: 'Fatiha ve Bakara Tefsiri',
    emoji: '🔍',
    accent: '#22C55E',
    description:
      "Kur'an'ın mu'cize yönünü hareke harfine kadar inen tefsir metoduyla açıklar. Cephe koşullarında dikte ettirilen bu eser dilbilim açısından da son derece özgündür.",
    keyTopics: ['Fatiha sûresi tefsiri', 'Bakara sûresinin ilk ayetleri', "Kur'an'ın edebî mu'cizesi", 'Arap dili ve belâgat', 'İ\'caz-ı Kur\'an'],
  },
  {
    id: 'mesnevi',
    title: 'Mesnevî-i Nuriye',
    subtitle: 'Erken dönem eseri',
    emoji: '🌹',
    accent: '#8B5CF6',
    description:
      'Risale-i Nur\'un çekirdeğini oluşturan erken dönem eseridir. Felsefe ile imanı karşılaştırarak tevhidin aklî ispatları üzerinde durur.',
    keyTopics: ['Tevhidin delilleri', 'Felsefe eleştirisi', 'Varlık ve yokluk', 'Ruhun mahiyeti', 'İnsan ve kâinat'],
  },
  {
    id: 'sikke',
    title: "Sikke-i Tasdik-i Gaybî",
    subtitle: "Kur'an'ın işaretleri",
    emoji: '🔐',
    accent: '#F97316',
    description:
      "Kur'an-ı Kerim'in çeşitli âyetlerinde Risale-i Nur'a ve müellifine yapılan işaretleri inceler. Ebced hesabı ve cifr ilmi çerçevesinde değerlendirilir.",
    keyTopics: ['Ebced hesabı', 'Gaybî işaretler', "Kur'an'ın sırları", 'Harf ilmi', 'Cifr ve tevafuk'],
  },
  {
    id: 'barla',
    title: 'Barla Lahikası',
    subtitle: 'Talebe mektupları',
    emoji: '📬',
    accent: '#14B8A6',
    description:
      'Barla sürgünü döneminde talebelerle yazışmalardan oluşur. Risale-i Nur hizmetinin nasıl büyüdüğünü ve müellifinin günlük hayatını aktarır.',
    keyTopics: ['Hizmet şevki', 'Talebe mektupları', 'Sürgün hayatı', 'Nur talebeleri', 'Manevi sohbet'],
  },
];

const SOURCE_URL = 'https://www.risaleinur.com';

export default function RisaleNurScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <IslamicBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>OKUMA & KAYNAK</Text>
          <Text style={styles.heroTitle}>Risale-i Nur</Text>
          <Text style={styles.heroTitle}>Külliyatı</Text>
          <Text style={styles.heroSub}>
            Bediüzzaman Said Nursî (1878–1960) tarafından kaleme alınan, iman ve Kur'an hakikatlerini akıl ve kalbi birleştiren eserler.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(SOURCE_URL)}
            style={styles.sourceBtn}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: palette.gold400 }}>🔗  risaleinur.com'da oku →</Text>
          </Pressable>
        </LinearGradient>

        {/* About */}
        <View style={[styles.aboutCard, { backgroundColor: c.surface, borderColor: `${palette.gold500}30` }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: palette.gold500, marginBottom: spacing.xs }}>✦  Külliyat Hakkında</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 20 }}>
            Risale-i Nur, 20. yüzyılda maddeci felsefeye karşı iman hakikatlerini müdafaa etmek amacıyla yazılmıştır.
            Sözler, Mektubat, Lem'alar ve Şu'alar dört ana koleksiyonu oluşturur. Tüm eserler telif hakkından muaftır.
          </Text>
        </View>

        {/* Works */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>Ana Eserler</Text>

          {WORKS.map((work) => {
            const isOpen = expanded === work.id;
            return (
              <View key={work.id} style={[styles.workCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                {/* Header */}
                <Pressable onPress={() => toggle(work.id)} style={styles.workHeader}>
                  <View style={[styles.workIconBox, { backgroundColor: `${work.accent}18` }]}>
                    <Text style={{ fontSize: 22 }}>{work.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[t.bodyBold, { color: c.text, fontSize: 16 }]}>{work.title}</Text>
                    <Text style={{ fontSize: 12, color: work.accent, marginTop: 2 }}>{work.subtitle}</Text>
                  </View>
                  <View style={[styles.accentDot, { backgroundColor: work.accent }]} />
                  <Text style={{ fontSize: 18, color: c.textSecondary, marginLeft: spacing.xs }}>{isOpen ? '▾' : '▸'}</Text>
                </Pressable>

                {/* Expanded */}
                {isOpen && (
                  <View style={[styles.workBody, { borderTopColor: c.border }]}>
                    <Text style={{ fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: spacing.sm }}>
                      {work.description}
                    </Text>

                    {/* Key topics */}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: work.accent, marginBottom: spacing.xs }}>
                      TEMEL KONULAR
                    </Text>
                    <View style={styles.tagsRow}>
                      {work.keyTopics.map((topic) => (
                        <View key={topic} style={[styles.tag, { backgroundColor: `${work.accent}15`, borderColor: `${work.accent}30` }]}>
                          <Text style={{ fontSize: 11, color: work.accent }}>{topic}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Famous quote */}
                    {work.famousQuote && (
                      <View style={[styles.quoteBox, { backgroundColor: `${work.accent}0A`, borderLeftColor: work.accent }]}>
                        <Text style={{ fontSize: 13, color: c.text, fontStyle: 'italic', lineHeight: 20 }}>
                          "{work.famousQuote}"
                        </Text>
                        <Text style={{ fontSize: 11, color: work.accent, marginTop: spacing.xs, fontWeight: '600' }}>
                          — {work.famousQuoteRef}
                        </Text>
                      </View>
                    )}

                    <Pressable onPress={() => Linking.openURL(SOURCE_URL)}>
                      <Text style={{ fontSize: 12, color: palette.gold400, fontWeight: '600', marginTop: spacing.sm }}>
                        Tam metni oku →
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer note */}
        <View style={[styles.footerNote, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ fontSize: 12, color: c.textSecondary, lineHeight: 18, textAlign: 'center' }}>
            Risale-i Nur Külliyatı'nın tamamı ücretsiz olarak{' '}
            <Text style={{ color: palette.gold500, fontWeight: '600' }}>risaleinur.com</Text>
            {' '}adresinde okunabilir.
          </Text>
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:        { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:   { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:   { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 34 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: spacing.sm, lineHeight: 19 },
  sourceBtn:   { marginTop: spacing.md, alignSelf: 'flex-start' },
  aboutCard:   { margin: spacing.lg, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, ...shadows.card },
  workCard:    { borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  workHeader:  { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  workIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accentDot:   { width: 6, height: 6, borderRadius: 3 },
  workBody:    { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tag:         { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, borderWidth: 1 },
  quoteBox:    { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs },
  footerNote:  { margin: spacing.lg, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth },
});
