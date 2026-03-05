import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { IslamicBackground } from '../components/IslamicBackground';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, shadows, spacing, textStyles } from '../theme/designSystem';

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
  const greeting = getGreeting();

  return (
    <IslamicBackground>
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['rgba(15,61,62,0.92)', 'rgba(31,110,90,0.88)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
        <Text style={styles.heroGreeting}>{greeting}</Text>
        <Text style={styles.heroTitle}>İslami Asistan</Text>
        <Text style={styles.heroSubtitle}>
          Günlük ibadetlerin için rehber
        </Text>
      </LinearGradient>

      <View style={styles.scrollWrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hızlı erişim - 4 ana modül */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={[styles.quickGrid, isNarrow && styles.quickGridNarrow]}>
            <Card style={[styles.quickCard, isNarrow && styles.quickCardFull]}>
              <Text style={styles.quickEmoji}>🕌</Text>
              <Text style={styles.quickLabel}>Namaz Vakitleri</Text>
              <PrimaryButton
                label="Vakitleri Gör"
                onPress={() => navigation.navigate('PrayerTimes')}
                style={styles.quickButton}
              />
            </Card>
            <Card style={[styles.quickCard, isNarrow && styles.quickCardFull]}>
              <Text style={styles.quickEmoji}>📖</Text>
              <Text style={styles.quickLabel}>Kur'an-ı Kerim</Text>
              <Pressable
                onPress={() => navigation.navigate('QuranSurahList')}
                style={({ pressed }) => [
                  styles.quickSecondaryBtn,
                  pressed && styles.quickSecondaryBtnPressed,
                ]}
              >
                <Text style={styles.quickSecondaryBtnText}>Sureleri Aç</Text>
              </Pressable>
            </Card>
            <Card style={[styles.quickCard, isNarrow && styles.quickCardFull]}>
              <Text style={styles.quickEmoji}>📿</Text>
              <Text style={styles.quickLabel}>Zikir Sayacı</Text>
              <Pressable
                onPress={() => navigation.navigate('ZikrCounter')}
                style={({ pressed }) => [
                  styles.quickSecondaryBtn,
                  pressed && styles.quickSecondaryBtnPressed,
                ]}
              >
                <Text style={styles.quickSecondaryBtnText}>Sayacı Aç</Text>
              </Pressable>
            </Card>
            <Card style={[styles.quickCard, isNarrow && styles.quickCardFull]}>
              <Text style={styles.quickEmoji}>🤲</Text>
              <Text style={styles.quickLabel}>Günlük Dualar</Text>
              <Pressable
                onPress={() => navigation.navigate('Duas')}
                style={({ pressed }) => [
                  styles.quickSecondaryBtn,
                  pressed && styles.quickSecondaryBtnPressed,
                ]}
              >
                <Text style={styles.quickSecondaryBtnText}>Duaları Aç</Text>
              </Pressable>
            </Card>
          </View>
        </View>

        {/* Namaz */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Namaz</Text>
          <RowLink
            emoji="🧭"
            title="Namaz Kılavuzu"
            subtitle="Adım adım rehber"
            onPress={() => navigation.navigate('PrayerGuide')}
          />
          <RowLink
            emoji="📓"
            title="Namaz Hatıra Defteri"
            subtitle="Kıldığın vakitleri işaretle"
            onPress={() => navigation.navigate('PrayerLog')}
          />
          <RowLink
            emoji="🧭"
            title="Kıble Yönü"
            subtitle="Pusula ile kıbleyi bul"
            onPress={() => navigation.navigate('Qibla')}
          />
        </View>

        {/* Okuma & Kaynak */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Okuma & Kaynak</Text>
          <RowLink
            emoji="📚"
            title="Risale-i Nur Külliyatı"
            subtitle="Ana eser başlıkları"
            onPress={() => navigation.navigate('RisaleNur')}
          />
          <RowLink
            emoji="📚"
            title="Elmalılı Tefsiri"
            subtitle="Hak Dini Kur'an Dili"
            onPress={() => navigation.navigate('ElmaliliTafsir')}
          />
        </View>

        {/* Takip & Keşfet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Takip & Keşfet</Text>
          <RowLink
            emoji="📊"
            title="Manevî Analiz"
            subtitle="Haftalık istatistikler"
            onPress={() => navigation.navigate('Analytics')}
          />
          <RowLink
            emoji="🎯"
            title="Hedeflerim"
            subtitle="Namaz, zikir, Kur'an hedefleri"
            onPress={() => navigation.navigate('Goals')}
          />
          <RowLink
            emoji="📅"
            title="İslami Takvim"
            subtitle="Hicrî tarih ve özel günler"
            onPress={() => navigation.navigate('IslamicCalendar')}
          />
          <RowLink
            emoji="📍"
            title="Cami Bulucu"
            subtitle="Yakındaki camiler, Cuma saati"
            onPress={() => navigation.navigate('MosqueFinder')}
          />
        </View>

        {/* Diğer */}
        <View style={styles.section}>
          <RowLink
            emoji="⭐"
            title="Favori Ayetlerim"
            subtitle="Yıldızladığın ayetler"
            onPress={() => navigation.navigate('FavoriteAyahs')}
          />
          <RowLink
            emoji="⚙️"
            title="Ayarlar"
            subtitle="Tema ve yazı boyutu"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </View>
      </View>
    </IslamicBackground>
  );
}

type RowLinkProps = {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function RowLink({ emoji, title, subtitle, onPress }: RowLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowLink,
        pressed && styles.rowLinkPressed,
      ]}
    >
      <Text style={styles.rowLinkEmoji}>{emoji}</Text>
      <View style={styles.rowLinkText}>
        <Text style={styles.rowLinkTitle}>{title}</Text>
        <Text style={styles.rowLinkSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.rowLinkChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  heroGreeting: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    ...textStyles.body,
    color: 'rgba(255,255,255,0.85)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.heading2,
    marginBottom: spacing.sm,
    color: colors.textDark,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickGridNarrow: {
    gap: spacing.sm,
  },
  quickCard: {
    width: '48%',
    minHeight: 140,
    padding: spacing.md,
  },
  quickCardFull: {
    width: '100%',
  },
  quickEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickLabel: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  quickButton: {
    alignSelf: 'stretch',
  },
  quickSecondaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  quickSecondaryBtnPressed: {
    backgroundColor: colors.primarySoft,
  },
  quickSecondaryBtnText: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  rowLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    ...shadows.card,
  },
  rowLinkPressed: {
    backgroundColor: colors.primarySoft,
    opacity: 0.95,
  },
  rowLinkEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  rowLinkText: {
    flex: 1,
  },
  rowLinkTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.textDark,
  },
  rowLinkSubtitle: {
    ...textStyles.caption,
    marginTop: 2,
  },
  rowLinkChevron: {
    fontSize: 20,
    color: colors.textSoft,
    fontWeight: '300',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
