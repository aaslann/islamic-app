import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/components/Card';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { useTheme } from '../../../core/theme/ThemeContext';
import { radii, shadows, spacing } from '../../../core/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Hayırlı sabahlar';
  if (hour < 18) return 'Hayırlı günler';
  return 'Hayırlı akşamlar';
}

export default function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  return (
    <IslamicBackground>
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[c.heroGradientStart, c.heroGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={[t.caption, { color: 'rgba(255,255,255,0.85)', marginBottom: spacing.xs }]}>
            {getGreeting()}
          </Text>
          <Text style={[t.hero, { color: c.white, fontSize: 28 }]}>İslami Asistan</Text>
          <Text style={[t.body, { color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs }]}>
            Günlük ibadetlerin için rehber
          </Text>
        </LinearGradient>

        <View style={styles.scrollWrapper}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hızlı erişim */}
            <View style={styles.section}>
              <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>Hızlı Erişim</Text>
              <View style={[styles.quickGrid, isNarrow && styles.quickGridNarrow]}>
                <Card style={[styles.quickCard, isNarrow && styles.quickCardFull]}>
                  <Text style={styles.quickEmoji}>🕌</Text>
                  <Text style={[t.bodyBold, { color: c.text, marginBottom: spacing.sm }]}>Namaz Vakitleri</Text>
                  <PrimaryButton label="Vakitleri Gör" onPress={() => navigation.navigate('PrayerTimes')} style={{ alignSelf: 'stretch' }} />
                </Card>
                {([
                  { emoji: '📖', label: "Kur'an-ı Kerim", route: 'QuranSurahList' as const, btn: 'Sureleri Aç' },
                  { emoji: '📿', label: 'Zikir Sayacı',   route: 'ZikrCounter' as const,    btn: 'Sayacı Aç' },
                  { emoji: '🤲', label: 'Günlük Dualar',  route: 'Duas' as const,            btn: 'Duaları Aç' },
                ] as const).map(({ emoji, label, route, btn }) => (
                  <Card key={route} style={[styles.quickCard, isNarrow && styles.quickCardFull]}>
                    <Text style={styles.quickEmoji}>{emoji}</Text>
                    <Text style={[t.bodyBold, { color: c.text, marginBottom: spacing.sm }]}>{label}</Text>
                    <Pressable
                      onPress={() => navigation.navigate(route)}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        { borderColor: c.primary },
                        pressed && { backgroundColor: c.primarySoft },
                      ]}
                    >
                      <Text style={[t.captionBold, { color: c.primary }]}>{btn}</Text>
                    </Pressable>
                  </Card>
                ))}
              </View>
            </View>

            {/* Namaz */}
            <Section title="Namaz" theme={theme}>
              <RowLink emoji="🧭" title="Namaz Kılavuzu"       subtitle="Adım adım rehber"             onPress={() => navigation.navigate('PrayerGuide')}  theme={theme} />
              <RowLink emoji="📓" title="Namaz Hatıra Defteri" subtitle="Kıldığın vakitleri işaretle"  onPress={() => navigation.navigate('PrayerLog')}    theme={theme} />
              <RowLink emoji="🧭" title="Kıble Yönü"           subtitle="Pusula ile kıbleyi bul"       onPress={() => navigation.navigate('Qibla')}        theme={theme} />
            </Section>

            {/* Okuma & Kaynak */}
            <Section title="Okuma & Kaynak" theme={theme}>
              <RowLink emoji="📚" title="Risale-i Nur Külliyatı" subtitle="Ana eser başlıkları"   onPress={() => navigation.navigate('RisaleNur')}      theme={theme} />
              <RowLink emoji="📚" title="Elmalılı Tefsiri"       subtitle="Hak Dini Kur'an Dili" onPress={() => navigation.navigate('ElmaliliTafsir')} theme={theme} />
            </Section>

            {/* Takip & Keşfet */}
            <Section title="Takip & Keşfet" theme={theme}>
              <RowLink emoji="🌙" title="Ramazan Takibi"    subtitle="Oruç, teravih, Kur'an sayfası"   onPress={() => navigation.navigate('RamadanTracker')} theme={theme} />
              <RowLink emoji="🔥" title="Namaz İlerlemesi"  subtitle="Seri, haftalık grafik, heatmap"   onPress={() => navigation.navigate('PrayerProgress')} theme={theme} />
              <RowLink emoji="📊" title="Manevî Analiz"     subtitle="Haftalık istatistikler"           onPress={() => navigation.navigate('Analytics')}      theme={theme} />
              <RowLink emoji="🎯" title="Hedeflerim"        subtitle="Namaz, zikir, Kur'an hedefleri"  onPress={() => navigation.navigate('Goals')}          theme={theme} />
              <RowLink emoji="📅" title="İslami Takvim"     subtitle="Hicrî tarih ve özel günler"      onPress={() => navigation.navigate('IslamicCalendar')} theme={theme} />
              <RowLink emoji="📍" title="Cami Bulucu"       subtitle="Yakındaki camiler, Cuma saati"   onPress={() => navigation.navigate('MosqueFinder')}   theme={theme} />
            </Section>

            {/* Diğer */}
            <View style={styles.section}>
              <RowLink emoji="⭐" title="Favori Ayetlerim" subtitle="Yıldızladığın ayetler" onPress={() => navigation.navigate('FavoriteAyahs')} theme={theme} />
              <RowLink emoji="⚙️" title="Ayarlar"          subtitle="Tema ve yazı boyutu"   onPress={() => navigation.navigate('Settings')}      theme={theme} />
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </View>
    </IslamicBackground>
  );
}

type ThemeType = import('../../../core/theme/themes').AppTheme;

function Section({ title, theme, children }: { title: string; theme: ThemeType; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[theme.text.heading2, { color: theme.colors.text, marginBottom: spacing.sm }]}>{title}</Text>
      {children}
    </View>
  );
}

function RowLink({ emoji, title, subtitle, onPress, theme }: { emoji: string; title: string; subtitle: string; onPress: () => void; theme: ThemeType }) {
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowLink,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && { backgroundColor: c.primarySoft },
      ]}
    >
      <Text style={styles.rowLinkEmoji}>{emoji}</Text>
      <View style={styles.rowLinkText}>
        <Text style={[theme.text.bodyBold, { color: c.text }]}>{title}</Text>
        <Text style={[theme.text.caption, { color: c.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.chevron, { color: c.textSecondary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  scrollWrapper:   { flex: 1 },
  hero:            { paddingTop: spacing.xxl, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  scroll:          { flex: 1 },
  scrollContent:   { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  section:         { marginBottom: spacing.xl },
  quickGrid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md },
  quickGridNarrow: { gap: spacing.sm },
  quickCard:       { width: '48%', minHeight: 140, padding: spacing.md },
  quickCardFull:   { width: '100%' },
  quickEmoji:      { fontSize: 28, marginBottom: spacing.xs },
  secondaryBtn:    { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.full, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  rowLink:         { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, ...shadows.card },
  rowLinkEmoji:    { fontSize: 24, marginRight: spacing.md },
  rowLinkText:     { flex: 1 },
  chevron:         { fontSize: 20, fontWeight: '300' },
});
