import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type PrayerKey = 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'vitir';

type PrayerPart = {
  id: string;
  title: string;
  rakaat: number;
  type: 'sunnet' | 'farz' | 'vitir';
  steps: string[];
};

type PrayerGuide = {
  key: PrayerKey;
  label: string;
  emoji: string;
  totalRakaat: number;
  info: string;
  parts: PrayerPart[];
};

const PRAYER_GUIDES: PrayerGuide[] = [
  {
    key: 'sabah', label: 'Sabah', emoji: '🌅', totalRakaat: 4,
    info: '2 rekât sünnet + 2 rekât farz — toplam 4 rekât',
    parts: [
      {
        id: 'sabah-sunnet', title: '2 Rekât Sünnet', rakaat: 2, type: 'sunnet',
        steps: [
          'Niyet et: "Allah rızası için bugünün sabah namazının sünnetini kılmaya."',
          'İftitah tekbiri al, Subhâneke oku, Fâtiha ve kısa sûre oku.',
          'Rükûya var (Sübhâne Rabbiyel Azîm × 3), doğrul, secdeye git (Sübhâne Rabbiyel A\'lâ × 3).',
          'İkinci rekâta kalk, aynı şekilde kıraat ve rükünleri tamamla.',
          'Son oturuşta Ettehiyyâtü, Salli-Bârik ve Rabbena oku; sağa-sola selam ver.',
        ],
      },
      {
        id: 'sabah-farz', title: '2 Rekât Farz', rakaat: 2, type: 'farz',
        steps: [
          'Niyet et: "Allah rızası için bugünün sabah namazının farzını kılmaya."',
          'Cemaatle kılınıyorsa imama uy; yalnız ise sünnetle aynı tertipte kıl.',
          'İlk rekâtta Fâtiha ve sûre, rükû ve iki secde.',
          'İkinci rekâtta Fâtiha ve sûre, rükû ve secdelerden sonra son oturuma geç.',
          'Ettehiyyâtü, Salli-Bârik ve duaları okuyup sağa-sola selam ver.',
        ],
      },
    ],
  },
  {
    key: 'ogle', label: 'Öğle', emoji: '☀️', totalRakaat: 10,
    info: '4 ilk sünnet + 4 farz + 2 son sünnet — toplam 10 rekât',
    parts: [
      {
        id: 'ogle-sunnet1', title: '4 Rekât İlk Sünnet', rakaat: 4, type: 'sunnet',
        steps: [
          'Niyet et: "Öğle namazının ilk sünnetini kılmaya."',
          'İlk iki rekâtta Fâtiha + sûre; 3. ve 4. rekâtta yalnız Fâtiha oku.',
          '2. rekât sonunda ilk oturuş yap, Ettehiyyâtü oku; 3. rekâta kalk.',
          '4. rekât sonunda son oturuşta Ettehiyyâtü, Salli-Bârik ve duaları okuyup selam ver.',
        ],
      },
      {
        id: 'ogle-farz', title: '4 Rekât Farz', rakaat: 4, type: 'farz',
        steps: [
          'Niyet et: "Öğle namazının farzını kılmaya."',
          'İlk iki rekâtta Fâtiha + sûre; son iki rekâtta sadece Fâtiha.',
          '2. rekât sonunda ilk oturuş (Ettehiyyâtü); 4. rekât sonunda son oturuş.',
          'Son oturuşta Ettehiyyâtü, Salli-Bârik, Rabbena ve diğer duaları okuyup selam ver.',
        ],
      },
      {
        id: 'ogle-sunnet2', title: '2 Rekât Son Sünnet', rakaat: 2, type: 'sunnet',
        steps: [
          'Niyet et: "Öğle namazının son sünnetini kılmaya."',
          'Sabah sünneti tertibinde iki rekât kıl.',
          'Son oturuşta duaları okuyup selam ver.',
        ],
      },
    ],
  },
  {
    key: 'ikindi', label: 'İkindi', emoji: '🌤️', totalRakaat: 8,
    info: '4 rekât sünnet + 4 rekât farz — toplam 8 rekât',
    parts: [
      {
        id: 'ikindi-sunnet', title: '4 Rekât Sünnet', rakaat: 4, type: 'sunnet',
        steps: [
          'Niyet et: "İkindi namazının sünnetini kılmaya."',
          'Öğle ilk sünneti gibi 4 rekât kıl; ilk iki rekâtta Fâtiha + sûre.',
          '2. rekât sonunda ilk oturuş; 4. rekât sonunda son oturuş ve selam.',
        ],
      },
      {
        id: 'ikindi-farz', title: '4 Rekât Farz', rakaat: 4, type: 'farz',
        steps: [
          'Niyet et: "İkindi namazının farzını kılmaya."',
          'Öğle farzı gibi ilk iki rekâtta sûre, son iki rekâtta yalnız Fâtiha.',
          'Son oturuşta duaları okuyup selam ver.',
        ],
      },
    ],
  },
  {
    key: 'aksam', label: 'Akşam', emoji: '🌇', totalRakaat: 5,
    info: '3 rekât farz + 2 rekât sünnet — toplam 5 rekât',
    parts: [
      {
        id: 'aksam-farz', title: '3 Rekât Farz', rakaat: 3, type: 'farz',
        steps: [
          'Niyet et: "Akşam namazının farzını kılmaya."',
          'Sesli okunur; ilk iki rekâtta Fâtiha + sûre, 3. rekâtta sadece Fâtiha.',
          '2. rekât sonunda otur, Ettehiyyâtü oku; 3. rekâta kalk.',
          '3. rekât sonunda son oturuşta duaları okuyup selam ver.',
        ],
      },
      {
        id: 'aksam-sunnet', title: '2 Rekât Sünnet', rakaat: 2, type: 'sunnet',
        steps: [
          'Niyet et: "Akşam namazının sünnetini kılmaya."',
          'Sabah sünneti gibi iki rekât kıl.',
          'Son oturuşta duaları okuyup selam ver.',
        ],
      },
    ],
  },
  {
    key: 'yatsi', label: 'Yatsı', emoji: '🌙', totalRakaat: 9,
    info: '4 ilk sünnet + 4 farz + 2 son sünnet — toplam 9 rekât (vitir ayrı)',
    parts: [
      {
        id: 'yatsi-sunnet1', title: '4 Rekât İlk Sünnet', rakaat: 4, type: 'sunnet',
        steps: [
          'Niyet et: "Yatsı namazının ilk sünnetini kılmaya."',
          'Öğle ilk sünneti gibi kıl; ilk iki rekâtta Fâtiha + sûre.',
          '2. rekâtta ilk oturuş; 4. rekâtta son oturuş ve selam.',
        ],
      },
      {
        id: 'yatsi-farz', title: '4 Rekât Farz', rakaat: 4, type: 'farz',
        steps: [
          'Niyet et: "Yatsı namazının farzını kılmaya."',
          'Öğle farzı gibi kıl; son iki rekâtta sadece Fâtiha.',
          'Son oturuşta duaları okuyup selam ver.',
        ],
      },
      {
        id: 'yatsi-sunnet2', title: '2 Rekât Son Sünnet', rakaat: 2, type: 'sunnet',
        steps: [
          'Niyet et: "Yatsı namazının son sünnetini kılmaya."',
          'İki rekât kıl, son oturuşta selam ver.',
        ],
      },
    ],
  },
  {
    key: 'vitir', label: 'Vitir', emoji: '⭐', totalRakaat: 3,
    info: '3 rekât vacip — yatsıdan sonra kılınır',
    parts: [
      {
        id: 'vitir', title: '3 Rekât Vitir', rakaat: 3, type: 'vitir',
        steps: [
          'Niyet et: "Allah rızası için vitir namazını kılmaya."',
          'İlk iki rekâtta Fâtiha + sûre; 2. rekât sonunda otur, Ettehiyyâtü oku.',
          '3. rekâtta Fâtiha + sûre oku; rükûdan önce tekbir al ve Kunut duasını oku.',
          'Kunut: "Allahümme innâ nesteînüke ve nestağfiruke ve nü\'minü bike..." okuduktan sonra rükûya var.',
          'Secdelerden sonra son oturuşta duaları okuyup selam ver.',
        ],
      },
    ],
  },
];

const TYPE_COLOR: Record<string, string> = {
  sunnet: palette.green400,
  farz:   '#22C55E',
  vitir:  '#EC4899',
};

const TYPE_LABEL: Record<string, string> = {
  sunnet: 'Sünnet',
  farz:   'Farz',
  vitir:  'Vacip',
};

export default function PrayerGuideScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [active, setActive] = useState<PrayerKey>('sabah');
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const current = PRAYER_GUIDES.find((g) => g.key === active)!;

  const togglePart = (id: string) => setExpandedPart((prev) => (prev === id ? null : id));

  return (
    <IslamicBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[c.heroGradientStart, c.heroGradientEnd]}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>NAMAZ KILAVUZU</Text>
          <Text style={styles.heroTitle}>Adım Adım Rehber</Text>
          <Text style={styles.heroSub}>
            Vakit seç, rekâtları ve adımları gör. Mezheplere göre ayrıntılar değişebilir.
          </Text>
        </LinearGradient>

        {/* Prayer tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {PRAYER_GUIDES.map((guide) => {
              const isActive = active === guide.key;
              return (
                <Pressable
                  key={guide.key}
                  onPress={() => { setActive(guide.key); setExpandedPart(null); }}
                  style={[
                    styles.tab,
                    { borderColor: isActive ? c.primary : c.border, backgroundColor: isActive ? c.primarySoft : c.surface },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{guide.emoji}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? c.primary : c.textSecondary, marginTop: 2 }}>
                    {guide.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: isActive ? c.primary : c.textSecondary }}>
                    {guide.totalRakaat} rekât
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Current prayer info */}
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ fontSize: 22 }}>{current.emoji}</Text>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[t.heading2, { color: c.text }]}>{current.label} Namazı</Text>
            <Text style={{ fontSize: 13, color: palette.gold500, marginTop: 2 }}>{current.info}</Text>
          </View>
        </View>

        {/* Parts */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          {current.parts.map((part, idx) => {
            const isOpen = expandedPart === part.id;
            const color = TYPE_COLOR[part.type] ?? palette.green400;
            return (
              <View key={part.id} style={[styles.partCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                {/* Part header (tap to expand) */}
                <Pressable
                  onPress={() => togglePart(part.id)}
                  style={styles.partHeader}
                >
                  <View style={[styles.partIndexBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color }}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <View style={styles.partTitleRow}>
                      <Text style={[t.bodyBold, { color: c.text }]}>{part.title}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: `${color}18` }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color }}>{TYPE_LABEL[part.type]}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                      {part.rakaat} rekât  •  {part.steps.length} adım
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: c.textSecondary }}>{isOpen ? '▾' : '▸'}</Text>
                </Pressable>

                {/* Expanded steps */}
                {isOpen && (
                  <View style={[styles.stepsContainer, { borderTopColor: c.border }]}>
                    {part.steps.map((step, si) => (
                      <View key={si} style={styles.stepRow}>
                        <View style={[styles.stepNum, { backgroundColor: color }]}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{si + 1}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, color: c.text, lineHeight: 20 }}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ fontSize: 13, color: palette.gold500, marginBottom: 4 }}>ℹ️  Önemli Not</Text>
          <Text style={{ fontSize: 12, color: c.textSecondary, lineHeight: 18 }}>
            Bu kılavuz genel bir özet sunar. Mezheplere göre bazı ayrıntılar farklılık gösterebilir.
            Daha kapsamlı bilgi için güvenilir ilmihal eserlerine ve Diyanet kaynaklarına başvurunuz.
          </Text>
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:            { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:       { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:       { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:         { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: spacing.xs, lineHeight: 18 },
  tabsContainer:   { marginTop: spacing.md },
  tabsContent:     { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab:             { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.lg, borderWidth: 1, minWidth: 70 },
  infoCard:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  partCard:        { borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  partHeader:      { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  partIndexBadge:  { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  partTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeBadge:       { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  stepsContainer:  { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  stepRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum:         { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  disclaimer:      { margin: spacing.lg, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth },
});
