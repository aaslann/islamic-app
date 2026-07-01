import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Pressable, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import FridayBanner from '../../friday/components/FridayBanner';
import { HADITHS } from '../../hadith/data/hadiths';
import { ESMA_NAMES } from '../../esmaulhusna/data/names';
import { AdBanner } from '../../../shared/components/AdBanner';
import { maybeShowInterstitial } from '../../../core/ads/interstitial';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PrayerStatus = 'none' | 'prayed' | 'qada';
type DayLog = Record<PrayerId, PrayerStatus>;
type LogState = Record<string, DayLog>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const PRAYER_LOG_KEY = 'prayer-log-v1';
const PRAYER_IDS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<PrayerId, string> = {
  fajr: 'Sabah', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı',
};

const SCREEN_W = Dimensions.get('window').width;

const DAILY_VERSES = [
  { arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Şüphesiz güçlükle birlikte kolaylık vardır.', ref: 'İnşirah 94:6' },
  { arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', translation: 'Başarım ancak Allah\'ın yardımıyla gerçekleşir.', ref: 'Hûd 11:88' },
  { arabic: 'رَبِّ زِدْنِي عِلْمًا', translation: 'Rabbim! İlmimi artır.', ref: 'Tâhâ 20:114' },
  { arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translation: 'Allah bize yeter; O ne güzel vekildir.', ref: 'Âl-i İmrân 3:173' },
  { arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', translation: 'Şüphesiz Allah sabredenlerle beraberdir.', ref: 'Bakara 2:153' },
  { arabic: 'وَلَذِكْرُ اللَّهِ أَكْبَرُ', translation: 'Allah\'ı anmak elbette en büyük ibadettir.', ref: 'Ankebût 29:45' },
  { arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ', translation: 'Beni zikredin, ben de sizi zikredeyim.', ref: 'Bakara 2:152' },
  { arabic: 'وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', translation: 'Rabbim! Beni yetiştirdikleri gibi onlara merhamet et.', ref: 'İsrâ 17:24' },
  { arabic: 'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ', translation: 'Mü\'minler ancak kardeştir.', ref: 'Hucurât 49:10' },
  { arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', translation: 'Kim Allah\'tan korkarsa Allah ona bir çıkış yolu açar.', ref: 'Talâk 65:2' },
  { arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation: 'Allah\'tan başka ilah yoktur; O diridir, her şeyi ayakta tutandır.', ref: 'Bakara 2:255' },
  { arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'De ki: O Allah birdir.', ref: 'İhlâs 112:1' },
  { arabic: 'وَبِالْوَالِدَيْنِ إِحْسَانًا', translation: 'Ana-babaya iyilik edin.', ref: 'Bakara 2:83' },
  { arabic: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ', translation: 'Şüphesiz Allah güzel davrananları sever.', ref: 'Bakara 2:195' },
];

type QuickItem = {
  icon: IoniconName;
  label: string;
  route: keyof RootStackParamList;
  colors: [string, string];
};

const QUICK_ITEMS: QuickItem[] = [
  { icon: 'time',      label: 'Namaz',   route: 'PrayerTimes',     colors: ['#082C1E', '#166A47'] },
  { icon: 'book',      label: "Kur'an",  route: 'QuranSurahList',  colors: ['#0D2347', '#1B4FBF'] },
  { icon: 'infinite',  label: 'Zikir',   route: 'ZikrCounter',     colors: ['#3A1100', '#B8841E'] },
  { icon: 'hand-left', label: 'Dualar',  route: 'Duas',            colors: ['#28095B', '#6B21A8'] },
  { icon: 'compass',   label: 'Kıble',   route: 'Qibla',           colors: ['#062E3A', '#0891B2'] },
  { icon: 'sparkles',  label: 'Esmâ',    route: 'EsmaulHusnaList', colors: ['#3A1430', '#9D2A6B'] },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Hayırlı geceler';
  if (h < 12) return 'Hayırlı sabahlar';
  if (h < 18) return 'Hayırlı günler';
  return 'Hayırlı akşamlar';
}

function getHijriDate() {
  try {
    return new Intl.DateTimeFormat('tr-TR-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
  } catch { return ''; }
}

function getMiladDate() {
  return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDailyVerse() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const day = Math.floor((Date.now() - start) / 86_400_000);
  return DAILY_VERSES[day % DAILY_VERSES.length];
}

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const hijriDate = useMemo(getHijriDate, []);
  const verse     = useMemo(getDailyVerse, []);
  const miladDate = useMemo(getMiladDate, []);
  const todayHadith = useMemo(() => HADITHS[new Date().getDate() % HADITHS.length], []);
  const todayEsma   = useMemo(() => ESMA_NAMES[new Date().getDate() % ESMA_NAMES.length], []);

  const [dailyIndex, setDailyIndex] = useState(0);

  const [dayLog, setDayLog] = useState<DayLog>({
    fajr: 'none', dhuhr: 'none', asr: 'none', maghrib: 'none', isha: 'none',
  });

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PRAYER_LOG_KEY).then((raw) => {
        if (!raw) return;
        const log = JSON.parse(raw) as LogState;
        const key = new Date().toISOString().slice(0, 10);
        if (log[key]) setDayLog(log[key]);
      }).catch(() => {});
    }, []),
  );

  const prayedCount = PRAYER_IDS.filter((id) => dayLog[id] === 'prayed').length;

  const navigate = (route: keyof RootStackParamList) => {
    const SACRED: (keyof RootStackParamList)[] = ['QuranSurahDetail', 'Qibla', 'ElmaliliTafsir', 'FavoriteAyahs'];
    if (!SACRED.includes(route)) maybeShowInterstitial();
    navigation.navigate(route as never);
  };

  const openKesfet = () => {
    maybeShowInterstitial();
    navigation.navigate('Kesfet');
  };

  const onDailyScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setDailyIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
  };

  return (
    <IslamicBackground>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HERO ─── */}
        <LinearGradient
          colors={[c.heroGradientStart, c.heroGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.bismillah}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ</Text>

          {hijriDate !== '' && (
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>🌙  {hijriDate}</Text>
            </View>
          )}

          <Text style={styles.heroGreeting}>{getGreeting()}</Text>
          <Text style={styles.heroTitle}>İslami Asistan</Text>
          <Text style={styles.heroMilad}>{miladDate}</Text>

          {/* Namaz durum kartı */}
          <Pressable onPress={() => navigate('PrayerLog')} style={styles.prayerCard}>
            <View style={styles.prayerCardTop}>
              <Text style={styles.prayerCardLabel}>BUGÜNKÜ NAMAZ</Text>
              <View style={[
                styles.prayerCountBadge,
                { backgroundColor: prayedCount === 5 ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.1)' },
              ]}>
                <Text style={[styles.prayerCountText, {
                  color: prayedCount === 5 ? '#4ADE80' : prayedCount > 0 ? palette.gold400 : 'rgba(255,255,255,0.45)',
                }]}>
                  {prayedCount}/5
                </Text>
              </View>
            </View>
            <View style={styles.prayerDots}>
              {PRAYER_IDS.map((id) => {
                const status = dayLog[id];
                const prayed = status === 'prayed';
                const qada   = status === 'qada';
                return (
                  <View key={id} style={styles.prayerDotCol}>
                    <View style={[
                      styles.prayerDotRing,
                      prayed && { backgroundColor: '#22C55E', borderColor: '#22C55E' },
                      qada   && { backgroundColor: 'rgba(251,146,60,0.2)', borderColor: '#FB923C' },
                      !prayed && !qada && { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.18)' },
                    ]}>
                      {prayed && <Ionicons name="checkmark" size={18} color="#fff" />}
                      {qada   && <Ionicons name="return-down-forward" size={13} color="#FB923C" />}
                    </View>
                    <Text style={styles.prayerDotLabel}>{PRAYER_LABELS[id]}</Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </LinearGradient>

        {/* ─── CUMA BANNER (sadece Cuma günü) ─── */}
        <FridayBanner />

        {/* ─── GÜNÜN İLHAMI (Ayet · Hadis · Esmâ — kaydırmalı) ─── */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onDailyScroll}
          style={{ marginTop: spacing.md }}
        >
          {/* Ayet */}
          <View style={styles.dailyPage}>
            <View style={[styles.dailyCardBase, { backgroundColor: c.surface, borderColor: `${palette.gold500}30` }]}>
              <Text style={[styles.dailyTag, { color: palette.gold500 }]}>✦  GÜNÜN AYETİ  ✦</Text>
              <Text style={[styles.dailyArabic, { color: c.text }]}>{verse.arabic}</Text>
              <View style={[styles.dailyDivider, { backgroundColor: `${palette.gold500}22` }]} />
              <Text style={[styles.dailyTranslation, { color: c.textSecondary }]}>"{verse.translation}"</Text>
              <View style={[styles.dailyRefPill, { backgroundColor: `${palette.gold500}14`, borderColor: `${palette.gold500}28` }]}>
                <Text style={[styles.dailyRefText, { color: palette.gold500 }]}>{verse.ref}</Text>
              </View>
            </View>
          </View>

          {/* Hadis */}
          <Pressable style={styles.dailyPage} onPress={() => navigate('HadithList')}>
            <View style={[styles.dailyCardBase, styles.dailyLeft, { backgroundColor: c.surface, borderColor: `${palette.gold500}30` }]}>
              <View style={styles.dailyHeader}>
                <Ionicons name="chatbox" size={14} color={palette.gold500} />
                <Text style={[styles.dailyHeaderText, { color: palette.gold500 }]}>GÜNÜN HADİSİ</Text>
                <View style={{ flex: 1 }} />
                <Text style={[styles.dailyTopic, { color: palette.gold400 }]}>{todayHadith.topic}</Text>
              </View>
              <Text style={[styles.dailyBody, { color: c.text }]} numberOfLines={4}>"{todayHadith.text}"</Text>
              <View style={[styles.dailyFooter, { borderTopColor: `${palette.gold500}22` }]}>
                <Text style={[styles.dailyNarrator, { color: c.textSecondary }]}>— {todayHadith.narrator}</Text>
                <Ionicons name="chevron-forward" size={14} color={palette.gold400} />
              </View>
            </View>
          </Pressable>

          {/* Esmâ */}
          <Pressable style={styles.dailyPage} onPress={() => navigate('EsmaulHusnaList')}>
            <View style={[styles.dailyCardBase, styles.esmaCard, { backgroundColor: c.surface, borderColor: `${palette.gold500}40` }]}>
              <View style={styles.esmaLeft}>
                <Text style={[styles.dailyHeaderText, { color: palette.gold500 }]}>GÜNÜN ESMASI</Text>
                <Text style={[styles.esmaLatin, { color: c.text }]}>{todayEsma.latin}</Text>
                <Text style={[styles.esmaMeaning, { color: c.textSecondary }]}>"{todayEsma.meaning}"</Text>
                <View style={styles.esmaPill}>
                  <Text style={styles.esmaPillText}>{todayEsma.no} / 99</Text>
                </View>
              </View>
              <Text style={styles.esmaArabic}>{todayEsma.arabic}</Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* Karusel noktaları */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === dailyIndex && styles.dotActive]} />
          ))}
        </View>

        {/* ─── HIZLI ERİŞİM (6) ─── */}
        <View style={styles.quickSection}>
          <Text style={[styles.quickSectionLabel, { color: c.textSecondary }]}>HIZLI ERİŞİM</Text>
          <View style={styles.quickGrid}>
            {QUICK_ITEMS.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => navigate(item.route)}
                style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.82 }]}
              >
                <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickGradient}>
                  <View style={styles.quickIconWrap}>
                    <Ionicons name={item.icon} size={20} color="#fff" />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── TÜM ÖZELLİKLER ─── */}
        <Pressable
          onPress={openKesfet}
          style={({ pressed }) => [styles.seeAll, { borderColor: `${palette.gold500}40`, backgroundColor: c.surface }, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="apps" size={18} color={palette.gold400} />
          <Text style={[styles.seeAllText, { color: c.text }]}>Tüm Özellikler</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.seeAllHint, { color: c.textSecondary }]}>Takvim · Cami · Hatim · Risale…</Text>
          <Ionicons name="chevron-forward" size={18} color={palette.gold400} />
        </Pressable>

        {/* ─── REKLAM ─── */}
        <AdBanner style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:             { paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  bismillah:        { fontSize: 18, color: 'rgba(200,162,74,0.78)', textAlign: 'center', marginBottom: spacing.md },
  datePill:         { alignSelf: 'flex-start', backgroundColor: 'rgba(200,162,74,0.13)', borderWidth: 1, borderColor: 'rgba(200,162,74,0.3)', borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: 5, marginBottom: spacing.md },
  datePillText:     { fontSize: 12, color: palette.gold400, fontWeight: '600' },
  heroGreeting:     { fontSize: 13, color: 'rgba(255,255,255,0.48)', fontWeight: '600', marginBottom: 2 },
  heroTitle:        { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.8, marginBottom: 2 },
  heroMilad:        { fontSize: 12, color: 'rgba(255,255,255,0.33)', marginBottom: spacing.lg },

  prayerCard:       { backgroundColor: 'rgba(255,255,255,0.065)', borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: spacing.md },
  prayerCardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  prayerCardLabel:  { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.38)', letterSpacing: 1.3 },
  prayerCountBadge: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  prayerCountText:  { fontSize: 13, fontWeight: '800' },
  prayerDots:       { flexDirection: 'row', justifyContent: 'space-between' },
  prayerDotCol:     { alignItems: 'center', gap: 5 },
  prayerDotRing:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  prayerDotLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.42)', fontWeight: '500' },

  /* daily carousel */
  dailyPage:        { width: SCREEN_W, paddingHorizontal: spacing.lg },
  dailyCardBase:    { borderRadius: radii.xl, borderWidth: 1, padding: spacing.lg, minHeight: 196, ...shadows.card },
  dailyLeft:        { padding: spacing.md, justifyContent: 'space-between' },
  dailyTag:         { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.md, textAlign: 'center' },
  dailyArabic:      { fontSize: 22, textAlign: 'center', lineHeight: 38, marginBottom: spacing.md },
  dailyDivider:     { width: 48, height: 1, alignSelf: 'center', marginBottom: spacing.md },
  dailyTranslation: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  dailyRefPill:     { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radii.full, borderWidth: 1 },
  dailyRefText:     { fontSize: 11, fontWeight: '700' },

  dailyHeader:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  dailyHeaderText:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  dailyTopic:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  dailyBody:        { fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  dailyFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1 },
  dailyNarrator:    { fontSize: 11, fontWeight: '600' },

  esmaCard:         { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  esmaLeft:         { flex: 1, gap: 4 },
  esmaLatin:        { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  esmaMeaning:      { fontSize: 12, fontStyle: 'italic' },
  esmaPill:         { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(200,162,74,0.15)', borderRadius: 99 },
  esmaPillText:     { fontSize: 10, fontWeight: '800', color: palette.gold400, letterSpacing: 1 },
  esmaArabic:       { fontSize: 44, color: palette.gold400, fontWeight: '600', marginLeft: spacing.sm },

  dots:             { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:        { width: 18, backgroundColor: palette.gold500 },

  /* quick grid (3 cols × 2) */
  quickSection:      { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  quickSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickCard:         { width: '31.5%', borderRadius: radii.lg, overflow: 'hidden', ...shadows.strong },
  quickGradient:     { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  quickIconWrap:     { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  quickLabel:        { fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' },

  seeAll:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radii.xl, borderWidth: 1, ...shadows.card },
  seeAllText:       { fontSize: 15, fontWeight: '700' },
  seeAllHint:       { fontSize: 11, marginRight: 4 },
});
