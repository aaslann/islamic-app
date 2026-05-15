import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type Volume = {
  id: string;
  cilt: number;
  title: string;
  surahs: string;
  accent: string;
  description: string;
  highlight: string;
};

const VOLUMES: Volume[] = [
  {
    id: 'c1', cilt: 1, title: 'Cilt I', surahs: 'Fâtiha — Bakara (1–2)',
    accent: '#6366F1',
    description: 'Tefsirin giriş bölümü ve Kur\'an\'ın ilk iki suresi. Fatiha\'nın sırrı, Bakara\'nın hukuki ve akaid konuları işlenir.',
    highlight: 'Bakara sûresi "el-Kitab" kavramının derinlikli izahını içerir.',
  },
  {
    id: 'c2', cilt: 2, title: 'Cilt II', surahs: 'Âl-i İmrân — Nisâ (3–4)',
    accent: '#0EA5E9',
    description: 'Uhud gazvesi, Ehl-i Kitap meselesi ve kadın hakları. İslam hukukunun temel kaynakları Nisâ sûresinde ele alınır.',
    highlight: 'Nisâ sûresi miras, nikah ve cihad ahkâmını ayrıntılı işler.',
  },
  {
    id: 'c3', cilt: 3, title: 'Cilt III', surahs: "Mâide — En'âm (5–6)",
    accent: '#22C55E',
    description: 'Helal-haram sınırları, Ehl-i Kitapla ilişkiler ve tevhidin delilleri. En\'âm sûresi akaid ve imanın esaslarını kapsar.',
    highlight: "En'âm 6:151-153 İslam'ın on emri olarak bilinen âyetleri içerir.",
  },
  {
    id: 'c4', cilt: 4, title: 'Cilt IV', surahs: "A'râf — Enfâl — Tevbe (7–9)",
    accent: '#F59E0B',
    description: 'Peygamber kıssaları, savaş hukukunun esasları ve münafıklarla mücadele. Tebük gazvesinin bağlamı ele alınır.',
    highlight: "A'râf sûresi Âdem'den Hz. Musa'ya uzanan peygamber tarihini anlatır.",
  },
  {
    id: 'c5', cilt: 5, title: 'Cilt V', surahs: 'Yûnus — Hûd — Yûsuf — Ra\'d — İbrâhîm (10–14)',
    accent: '#EC4899',
    description: 'Peygamberler tarihi devam eder. Hz. Yusuf\'un kıssası Türkçe edebiyatı de derinden etkilemiştir.',
    highlight: 'Yûsuf sûresi "ahsen-ül kasas" (kıssaların en güzeli) olarak nitelendirilir.',
  },
  {
    id: 'c6', cilt: 6, title: 'Cilt VI', surahs: 'Hicr — Nahl — İsrâ — Kehf (15–18)',
    accent: '#8B5CF6',
    description: 'Nahl sûresi nimetten şükre, İsrâ sûresi Miraç hadisesine, Kehf sûresi dört meşhur kıssaya ayrılmıştır.',
    highlight: "Kehf'in ilk ve son âyetleri Deccal fitnesine karşı okunması tavsiye edilir.",
  },
  {
    id: 'c7', cilt: 7, title: 'Cilt VII', surahs: 'Meryem — Tâhâ — … — Nûr (19–24)',
    accent: '#F97316',
    description: 'Hz. Meryem ve Hz. İsa kıssası, Tâhâ\'da Hz. Musa detaylı anlatılır. Nûr sûresi iffet ve hukuk kurallarını içerir.',
    highlight: "Nûr 24:35 'Nûr Âyeti' İslam metafiziğinin en derin ifadelerinden biridir.",
  },
  {
    id: 'c8', cilt: 8, title: 'Cilt VIII', surahs: 'Furkân — … — Ahzâb (25–33)',
    accent: '#14B8A6',
    description: 'Kur\'an\'ın isimlerinden biri olan Furkân\'dan itibaren, Hz. Peygamber\'in özel ahkâmı ve Ahzab gazvesi ele alınır.',
    highlight: "Ahzâb 33:21 'Üsve-i Hasene' âyeti rehber kişiliğin temel referansıdır.",
  },
  {
    id: 'c9', cilt: 9, title: 'Cilt IX', surahs: 'Sebe — … — Nâs (34–114)',
    accent: '#A78BFA',
    description: 'Kur\'an\'ın geri kalan bölümü. Kısa sureler, haşir ve âhiret tasvirleri, sure-i ihlâs ve muavvizeteyn.',
    highlight: "Son iki sure 'Muavvizeteyn' olarak bilinir; her sabah-akşam okunması tavsiye edilir.",
  },
];

const SOURCE_URL = 'https://kuran.diyanet.gov.tr';

export default function ElmaliliTafsirScreen() {
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
          <Text style={styles.heroTitle}>Elmalılı Hamdi</Text>
          <Text style={styles.heroTitle}>Yazır Tefsiri</Text>
          <Text style={styles.heroSub}>
            "Hak Dini Kur'an Dili" — Türkçe tefsir geleneğinin başyapıtı. Elmalılı Muhammed Hamdi Yazır (1878–1942) tarafından Türkçe kaleme alınmıştır.
          </Text>
          <Pressable onPress={() => Linking.openURL(SOURCE_URL)} style={styles.sourceBtn}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: palette.gold400 }}>🔗  Diyanet Kur'an Portalı →</Text>
          </Pressable>
        </LinearGradient>

        {/* About */}
        <View style={[styles.aboutCard, { backgroundColor: c.surface, borderColor: `${palette.gold500}30` }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: palette.gold500, marginBottom: spacing.xs }}>✦  Eser Hakkında</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 20 }}>
            Diyanet İşleri Başkanlığı'nın talebiyle hazırlanan bu eser, 1935–1938 yılları arasında yayımlanmıştır.
            9 cilt ve yaklaşık 6.000 sayfadan oluşan tefsir; Türk müfessirliğinin zirvesi olarak kabul edilir.
            Kur'an metnine sadık kalırken Osmanlı ilim geleneğini de yansıtır.
          </Text>
        </View>

        {/* Volumes */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>9 Cilt — Sure Endeksi</Text>

          {VOLUMES.map((vol) => {
            const isOpen = expanded === vol.id;
            return (
              <View key={vol.id} style={[styles.volCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Pressable onPress={() => toggle(vol.id)} style={styles.volHeader}>
                  <View style={[styles.ciltBadge, { backgroundColor: `${vol.accent}20`, borderColor: `${vol.accent}40` }]}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: vol.accent }}>{vol.cilt}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[t.bodyBold, { color: c.text }]}>{vol.title}</Text>
                    <Text style={{ fontSize: 12, color: vol.accent, marginTop: 1 }}>{vol.surahs}</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: c.textSecondary }}>{isOpen ? '▾' : '▸'}</Text>
                </Pressable>

                {isOpen && (
                  <View style={[styles.volBody, { borderTopColor: c.border }]}>
                    <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 20, marginBottom: spacing.sm }}>
                      {vol.description}
                    </Text>
                    <View style={[styles.highlightBox, { backgroundColor: `${vol.accent}0C`, borderLeftColor: vol.accent }]}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: vol.accent, marginBottom: 2 }}>📌 ÖNE ÇIKAN</Text>
                      <Text style={{ fontSize: 13, color: c.text, lineHeight: 18 }}>{vol.highlight}</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL(SOURCE_URL)}>
                      <Text style={{ fontSize: 12, color: palette.gold400, fontWeight: '600', marginTop: spacing.sm }}>
                        Diyanet'te oku →
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={[styles.footerNote, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ fontSize: 12, color: c.textSecondary, lineHeight: 18, textAlign: 'center' }}>
            Tam metin Diyanet İşleri Başkanlığı'nın{' '}
            <Text style={{ color: palette.gold500, fontWeight: '600' }}>kuran.diyanet.gov.tr</Text>
            {' '}adresinde ücretsiz olarak okunabilir.
          </Text>
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:           { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:      { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:      { fontSize: 27, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 33 },
  heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: spacing.sm, lineHeight: 19 },
  sourceBtn:      { marginTop: spacing.md, alignSelf: 'flex-start' },
  aboutCard:      { margin: spacing.lg, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, ...shadows.card },
  volCard:        { borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  volHeader:      { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  ciltBadge:      { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  volBody:        { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  highlightBox:   { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs },
  footerNote:     { margin: spacing.lg, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth },
});
