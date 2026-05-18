import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';

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
  sub: string;
  route: keyof RootStackParamList;
  colors: [string, string];
};

const QUICK_ITEMS: QuickItem[] = [
  { icon: 'time',      label: 'Namaz Vakitleri', sub: 'Bugünkü vakitler', route: 'PrayerTimes',    colors: ['#082C1E', '#166A47'] },
  { icon: 'book',      label: "Kur'an-ı Kerim",  sub: '114 sure',         route: 'QuranSurahList', colors: ['#0D2347', '#1B4FBF'] },
  { icon: 'infinite',  label: 'Zikir Sayacı',    sub: 'Hedef takibi',     route: 'ZikrCounter',    colors: ['#3A1100', '#B8841E'] },
  { icon: 'hand-left', label: 'Günlük Dualar',   sub: 'Sabah & akşam',    route: 'Duas',           colors: ['#28095B', '#6B21A8'] },
];

type SectionItem = {
  icon: IoniconName;
  iconColors: [string, string];
  label: string;
  subtitle: string;
  route: keyof RootStackParamList;
};

const SECTIONS: { label: string; items: SectionItem[] }[] = [
  {
    label: 'Namaz',
    items: [
      { icon: 'time-outline',      iconColors: ['#145E43', '#1A9E6A'], label: 'Namaz Vakitleri',    subtitle: 'Konuma göre otomatik hesaplama', route: 'PrayerTimes'  },
      { icon: 'journal-outline',   iconColors: ['#2D8A70', '#3EAF8A'], label: 'Namaz Defteri',      subtitle: 'Kılınan vakitleri işaretle',     route: 'PrayerLog'    },
      { icon: 'list-outline',      iconColors: ['#4AA88C', '#60CAAA'], label: 'Namaz Kılavuzu',     subtitle: 'Adım adım rehber',               route: 'PrayerGuide'  },
      { icon: 'compass-outline',   iconColors: ['#0EA5E9', '#38BDF8'], label: 'Kıble Yönü',         subtitle: 'Gerçek zamanlı pusula',          route: 'Qibla'        },
    ],
  },
  {
    label: "Kur'an & İbadet",
    items: [
      { icon: 'infinite-outline',  iconColors: ['#A07020', '#C8A24A'], label: 'Zikir Sayacı',     subtitle: 'Günlük hedefler ve istatistik', route: 'ZikrCounter'   },
      { icon: 'hand-left-outline', iconColors: ['#B88A35', '#D4AA60'], label: 'Günlük Dualar',    subtitle: 'Sabah, akşam duaları',          route: 'Duas'          },
      { icon: 'star-outline',      iconColors: ['#CA9840', '#E0BF72'], label: 'Favori Ayetlerim', subtitle: 'Yıldızladığın ayetler',         route: 'FavoriteAyahs' },
    ],
  },
  {
    label: 'Takip & Analiz',
    items: [
      { icon: 'trending-up-outline',         iconColors: ['#C2400C', '#F97316'], label: 'Namaz İlerlemesi', subtitle: 'Seri takibi ve grafik',      route: 'PrayerProgress' },
      { icon: 'bar-chart-outline',           iconColors: ['#D05A0A', '#FB923C'], label: 'Manevî Analiz',    subtitle: 'Haftalık istatistikler',     route: 'Analytics'      },
      { icon: 'flag-outline',                iconColors: ['#B45309', '#F59E0B'], label: 'Hedeflerim',       subtitle: 'Günlük ibadet hedefleri',    route: 'Goals'          },
      { icon: 'moon-outline',                iconColors: ['#6D28D9', '#8B5CF6'], label: 'Ramazan Takibi',   subtitle: 'Oruç, teravih, Kur\'an',    route: 'RamadanTracker' },
    ],
  },
  {
    label: 'Keşfet',
    items: [
      { icon: 'calendar-outline',  iconColors: ['#0369A1', '#0EA5E9'], label: 'İslami Takvim', subtitle: 'Kandiller ve mübarek günler', route: 'IslamicCalendar' },
      { icon: 'location-outline',  iconColors: ['#0E7490', '#06B6D4'], label: 'Cami Bulucu',   subtitle: '5 km içindeki camiler',       route: 'MosqueFinder'   },
    ],
  },
  {
    label: 'Okuma & Kaynak',
    items: [
      { icon: 'library-outline',   iconColors: ['#4338CA', '#6366F1'], label: 'Risale-i Nur Külliyatı', subtitle: 'Bediüzzaman Said Nursî',  route: 'RisaleNur'      },
      { icon: 'bookmark-outline',  iconColors: ['#6D28D9', '#8B5CF6'], label: 'Elmalılı Tefsiri',       subtitle: 'Hak Dini Kur\'an Dili',  route: 'ElmaliliTafsir' },
    ],
  },
  {
    label: 'Ayarlar',
    items: [
      { icon: 'settings-outline',  iconColors: ['#4B5563', '#6B7280'], label: 'Uygulama Ayarları', subtitle: 'Tema, bildirimler, yöntem', route: 'Settings' },
    ],
  },
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

type C = import('../../../core/theme/themes').AppTheme['colors'];

function SectionGroup({
  label, items, onPress, c,
}: { label: string; items: SectionItem[]; onPress: (r: keyof RootStackParamList) => void; c: C }) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: c.textSecondary }]}>{label.toUpperCase()}</Text>
      <View style={[styles.groupCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        {items.map((item, idx) => (
          <React.Fragment key={item.route}>
            {idx > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
            <Pressable
              onPress={() => onPress(item.route)}
              style={({ pressed }) => [styles.rowItem, pressed && { backgroundColor: c.primarySoft }]}
            >
              <LinearGradient
                colors={item.iconColors}
                style={styles.iconBox}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={item.icon} size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textSecondary} style={{ opacity: 0.5 }} />
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const hijriDate = useMemo(getHijriDate, []);
  const verse     = useMemo(getDailyVerse, []);
  const miladDate = useMemo(getMiladDate, []);

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
  const navigate = (route: keyof RootStackParamList) => navigation.navigate(route as never);

  return (
    <IslamicBackground>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 48 }}
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

        {/* ─── GÜNÜN AYETİ ─── */}
        <View style={[styles.verseOuter, { backgroundColor: c.surface, borderColor: `${palette.gold500}30` }]}>
          <LinearGradient
            colors={[`${palette.gold500}00`, palette.gold500, `${palette.gold500}00`]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.verseTopBar}
          />
          <View style={styles.verseInner}>
            <Text style={[styles.verseTag, { color: palette.gold500 }]}>✦  GÜNÜN AYETİ  ✦</Text>
            <Text style={[styles.verseArabic, { color: c.text }]}>{verse.arabic}</Text>
            <View style={[styles.verseDivider, { backgroundColor: `${palette.gold500}22` }]} />
            <Text style={[styles.verseTranslation, { color: c.textSecondary }]}>"{verse.translation}"</Text>
            <View style={[styles.verseRefPill, { backgroundColor: `${palette.gold500}14`, borderColor: `${palette.gold500}28` }]}>
              <Text style={[styles.verseRefText, { color: palette.gold500 }]}>{verse.ref}</Text>
            </View>
          </View>
        </View>

        {/* ─── HIZLI ERİŞİM ─── */}
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
                  <View style={styles.quickCircleDeco} />
                  <View style={styles.quickIconWrap}>
                    <Ionicons name={item.icon} size={22} color="#fff" />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                  <Text style={styles.quickSub}>{item.sub}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── BÖLÜMLER ─── */}
        {SECTIONS.map((section) => (
          <SectionGroup
            key={section.label}
            label={section.label}
            items={section.items}
            onPress={navigate}
            c={c}
          />
        ))}
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

  verseOuter:       { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden', ...shadows.card },
  verseTopBar:      { height: 2 },
  verseInner:       { padding: spacing.lg, alignItems: 'center' },
  verseTag:         { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.md },
  verseArabic:      { fontSize: 22, textAlign: 'center', lineHeight: 38, marginBottom: spacing.md },
  verseDivider:     { width: 48, height: 1, marginBottom: spacing.md },
  verseTranslation: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  verseRefPill:     { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radii.full, borderWidth: 1 },
  verseRefText:     { fontSize: 11, fontWeight: '700' },

  quickSection:      { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  quickSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickCard:         { width: '47.5%', borderRadius: radii.xl, overflow: 'hidden', ...shadows.strong },
  quickGradient:     { padding: spacing.md, paddingTop: spacing.lg, minHeight: 138, justifyContent: 'flex-end', overflow: 'hidden' },
  quickCircleDeco:   { position: 'absolute', top: -24, right: -24, width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.055)' },
  quickIconWrap:     { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickLabel:        { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 },
  quickSub:          { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  group:       { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  groupLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.xs, paddingLeft: 4 },
  groupCard:   { borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  divider:     { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  rowItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, minHeight: 62 },
  iconBox:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
