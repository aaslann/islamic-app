import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const PRAYER_LOG_KEY = 'prayer-log-v1';
const PRAYER_IDS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const DAILY_VERSES = [
  { arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Şüphesiz güçlükle birlikte kolaylık vardır.', ref: 'İnşirah 94:6' },
  { arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', translation: 'Başarım ancak Allah\'ın yardımıyla gerçekleşir.', ref: 'Hûd 11:88' },
  { arabic: 'رَبِّ زِدْنِي عِلْمًا', translation: 'Rabbim! İlmimi artır.', ref: 'Tâhâ 20:114' },
  { arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translation: 'Allah bize yeter; O ne güzel vekildir.', ref: 'Âl-i İmrân 3:173' },
  { arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', translation: 'Şüphesiz Allah sabredenlerle beraberdir.', ref: 'Bakara 2:153' },
  { arabic: 'وَلَذِكْرُ اللَّهِ أَكْبَرُ', translation: 'Allah\'ı anmak elbette en büyük ibadettir.', ref: 'Ankebût 29:45' },
  { arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ', translation: 'Beni zikredin, ben de sizi zikredeyim.', ref: 'Bakara 2:152' },
  { arabic: 'وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', translation: 'Rabbim! Küçüklüğümde beni terbiye ettikleri gibi sen de onlara merhamet et.', ref: 'İsrâ 17:24' },
  { arabic: 'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ', translation: 'Mü\'minler ancak kardeştir.', ref: 'Hucurât 49:10' },
  { arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', translation: 'Kim Allah\'tan korkarsa Allah ona bir çıkış yolu açar.', ref: 'Talâk 65:2' },
  { arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation: 'Allah, kendisinden başka ilah olmayandır; O diridir, her şeyi ayakta tutandır.', ref: 'Bakara 2:255 (Âyetü\'l-Kürsî)' },
  { arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'De ki: O Allah birdir.', ref: 'İhlâs 112:1' },
  { arabic: 'وَبِالْوَالِدَيْنِ إِحْسَانًا', translation: 'Ana-babaya iyilik edin.', ref: 'Bakara 2:83' },
  { arabic: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ', translation: 'Şüphesiz Allah güzel davrananları sever.', ref: 'Bakara 2:195' },
];

const QUICK_ITEMS: { emoji: string; label: string; route: keyof RootStackParamList; gradient: [string, string] }[] = [
  { emoji: '🕌', label: 'Namaz Vakitleri', route: 'PrayerTimes', gradient: ['#0F3D2E', '#1A7A56'] },
  { emoji: '📖', label: "Kur'an-ı Kerim", route: 'QuranSurahList', gradient: ['#1E3A5F', '#2563EB'] },
  { emoji: '📿', label: 'Zikir Sayacı', route: 'ZikrCounter', gradient: ['#78350F', '#C8A24A'] },
  { emoji: '🤲', label: 'Günlük Dualar', route: 'Duas', gradient: ['#3B0764', '#7C3AED'] },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Hayırlı geceler';
  if (hour < 12) return 'Hayırlı sabahlar';
  if (hour < 18) return 'Hayırlı günler';
  return 'Hayırlı akşamlar';
}

function getHijriDate(): string {
  try {
    return new Intl.DateTimeFormat('tr-TR-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
  } catch { return ''; }
}

function getDailyVerse() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const day = Math.floor((Date.now() - start) / 86_400_000);
  return DAILY_VERSES[day % DAILY_VERSES.length];
}

type C = import('../../../core/theme/themes').AppTheme['colors'];
type T = import('../../../core/theme/themes').AppTheme['text'];

function SectionHeader({ label, c }: { label: string; c: C }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: c.text, letterSpacing: 0.2 }}>{label}</Text>
      <View style={[styles.sectionLine, { backgroundColor: c.border }]} />
    </View>
  );
}

function NavRow({
  emoji, title, subtitle, accent, onPress, c, t,
}: { emoji: string; title: string; subtitle: string; accent: string; onPress: () => void; c: C; t: T }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navRow,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && { backgroundColor: c.primarySoft },
      ]}
    >
      <View style={[styles.navAccent, { backgroundColor: accent }]} />
      <Text style={styles.navEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[t.bodyBold, { color: c.text, fontSize: 15 }]}>{title}</Text>
        <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <Text style={{ fontSize: 20, color: c.textSecondary, marginRight: spacing.sm }}>›</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [prayedToday, setPrayedToday] = useState(0);
  const hijriDate = useMemo(getHijriDate, []);
  const verse = useMemo(getDailyVerse, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PRAYER_LOG_KEY).then((raw) => {
        if (!raw) { setPrayedToday(0); return; }
        const log = JSON.parse(raw) as LogState;
        const key = new Date().toISOString().slice(0, 10);
        const day = log[key];
        setPrayedToday(day ? PRAYER_IDS.filter((id) => day[id] === 'prayed').length : 0);
      }).catch(() => setPrayedToday(0));
    }, []),
  );

  return (
    <IslamicBackground>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[c.heroGradientStart, c.heroGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>{getGreeting().toUpperCase()}</Text>
              <Text style={styles.heroTitle}>İslami Asistan</Text>
              {hijriDate !== '' && (
                <Text style={styles.heroHijri}>🌙  {hijriDate}</Text>
              )}
            </View>
            <Text style={{ fontSize: 48 }}>🕌</Text>
          </View>

          {/* Today's prayer mini-bar */}
          <Pressable
            onPress={() => navigation.navigate('PrayerLog')}
            style={styles.prayerBar}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.prayerBarLabel}>BUGÜNKÜ NAMAZ</Text>
              <Text style={styles.prayerBarValue}>{prayedToday}/5 vakit kılındı</Text>
            </View>
            <View style={styles.prayerDots}>
              {PRAYER_IDS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.prayerDot,
                    { backgroundColor: i < prayedToday ? palette.gold400 : 'rgba(255,255,255,0.2)' },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        </LinearGradient>

        {/* ── Verse of the Day ── */}
        <View style={[styles.verseCard, { backgroundColor: c.surface, borderColor: `${palette.gold500}40` }]}>
          <View style={styles.verseHeader}>
            <Text style={[styles.verseLabel, { color: palette.gold500 }]}>✦  GÜNÜN AYETİ</Text>
          </View>
          <Text style={[styles.verseArabic, { color: c.text }]}>{verse.arabic}</Text>
          <Text style={[styles.verseTranslation, { color: c.textSecondary }]}>{verse.translation}</Text>
          <Text style={[styles.verseRef, { color: palette.gold500 }]}>— {verse.ref}</Text>
        </View>

        {/* ── Hızlı Erişim ── */}
        <View style={styles.section}>
          <SectionHeader label="⚡  Hızlı Erişim" c={c} />
          <View style={styles.quickGrid}>
            {QUICK_ITEMS.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => navigation.navigate(item.route as never)}
                style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.82 }]}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.quickCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                  <Text style={styles.quickCardLabel}>{item.label}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Namaz ── */}
        <View style={styles.section}>
          <SectionHeader label="🕌  Namaz" c={c} />
          <NavRow emoji="🕐" title="Namaz Vakitleri"       subtitle="Konuma göre otomatik hesaplama" accent={palette.green600} onPress={() => navigation.navigate('PrayerTimes')}  c={c} t={t} />
          <NavRow emoji="📓" title="Namaz Hatıra Defteri"  subtitle="Kıldığın vakitleri işaretle"    accent={palette.green500} onPress={() => navigation.navigate('PrayerLog')}    c={c} t={t} />
          <NavRow emoji="📋" title="Namaz Kılavuzu"        subtitle="Vakit vakit adım adım rehber"   accent={palette.green400} onPress={() => navigation.navigate('PrayerGuide')}  c={c} t={t} />
          <NavRow emoji="🧭" title="Kıble Yönü"            subtitle="Gerçek zamanlı pusula"          accent={palette.green300} onPress={() => navigation.navigate('Qibla')}        c={c} t={t} />
        </View>

        {/* ── Kur'an & İbadet ── */}
        <View style={styles.section}>
          <SectionHeader label="📖  Kur'an & İbadet" c={c} />
          <NavRow emoji="📿" title="Zikir Sayacı"     subtitle="Özelleştirilebilir hedefler ve istatistik" accent={palette.gold500} onPress={() => navigation.navigate('ZikrCounter')}    c={c} t={t} />
          <NavRow emoji="🤲" title="Günlük Dualar"    subtitle="Sabah, akşam ve günlük hayat duaları"     accent={palette.gold400} onPress={() => navigation.navigate('Duas')}           c={c} t={t} />
          <NavRow emoji="⭐" title="Favori Ayetlerim" subtitle="Yıldızladığın ayetler ve notlar"           accent={palette.gold300} onPress={() => navigation.navigate('FavoriteAyahs')}  c={c} t={t} />
        </View>

        {/* ── Takip & Analiz ── */}
        <View style={styles.section}>
          <SectionHeader label="📊  Takip & Analiz" c={c} />
          <NavRow emoji="🔥" title="Namaz İlerlemesi" subtitle="Seri takibi, haftalık grafik, heatmap" accent="#F97316" onPress={() => navigation.navigate('PrayerProgress')} c={c} t={t} />
          <NavRow emoji="📈" title="Manevî Analiz"    subtitle="Son 7 günün istatistikleri ve özeti"   accent="#FB923C" onPress={() => navigation.navigate('Analytics')}       c={c} t={t} />
          <NavRow emoji="🎯" title="Hedeflerim"       subtitle="Günlük namaz, zikir, Kur'an hedefleri" accent="#F59E0B" onPress={() => navigation.navigate('Goals')}           c={c} t={t} />
          <NavRow emoji="🌙" title="Ramazan Takibi"   subtitle="Oruç, teravih, Kur'an sayfası"        accent="#8B5CF6" onPress={() => navigation.navigate('RamadanTracker')}  c={c} t={t} />
        </View>

        {/* ── Keşfet ── */}
        <View style={styles.section}>
          <SectionHeader label="🌍  Keşfet" c={c} />
          <NavRow emoji="📅" title="İslami Takvim" subtitle="Hicrî tarih, kandiller ve mübarek günler" accent="#0EA5E9" onPress={() => navigation.navigate('IslamicCalendar')} c={c} t={t} />
          <NavRow emoji="📍" title="Cami Bulucu"   subtitle="5 km içindeki camiler ve Cuma vakti"    accent="#06B6D4" onPress={() => navigation.navigate('MosqueFinder')}    c={c} t={t} />
        </View>

        {/* ── Okuma & Kaynak ── */}
        <View style={styles.section}>
          <SectionHeader label="📚  Okuma & Kaynak" c={c} />
          <NavRow emoji="📚" title="Risale-i Nur Külliyatı" subtitle="Bediüzzaman Said Nursî'nin temel eserleri" accent="#6366F1" onPress={() => navigation.navigate('RisaleNur')}      c={c} t={t} />
          <NavRow emoji="🔖" title="Elmalılı Tefsiri"       subtitle="Hak Dini Kur'an Dili — 9 cilt"           accent="#8B5CF6" onPress={() => navigation.navigate('ElmaliliTafsir')} c={c} t={t} />
        </View>

        {/* ── Ayarlar ── */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <SectionHeader label="⚙️  Ayarlar" c={c} />
          <NavRow emoji="⚙️" title="Uygulama Ayarları" subtitle="Tema, bildirimler, hesaplama yöntemi" accent={palette.gray500} onPress={() => navigation.navigate('Settings')} c={c} t={t} />
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:              { paddingTop: 56, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  heroTop:           { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  heroGreeting:      { fontSize: 11, fontWeight: '700', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:         { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroHijri:         { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  prayerBar:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderRadius: radii.lg, padding: spacing.md },
  prayerBarLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.8 },
  prayerBarValue:    { fontSize: 16, color: '#fff', fontWeight: '700', marginTop: 2 },
  prayerDots:        { flexDirection: 'row', gap: 6 },
  prayerDot:         { width: 11, height: 11, borderRadius: 6 },
  verseCard:         { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, ...shadows.card },
  verseHeader:       { marginBottom: spacing.sm },
  verseLabel:        { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  verseArabic:       { fontSize: 20, fontFamily: 'Amiri_400Regular', textAlign: 'right', lineHeight: 34, marginBottom: spacing.sm },
  verseTranslation:  { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  verseRef:          { fontSize: 11, fontWeight: '700', marginTop: spacing.xs },
  section:           { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionLine:       { flex: 1, height: StyleSheet.hairlineWidth },
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickCard:         { width: '47.5%', borderRadius: radii.lg, overflow: 'hidden', ...shadows.card },
  quickCardGradient: { padding: spacing.md, minHeight: 110, justifyContent: 'flex-end' },
  quickCardLabel:    { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: spacing.sm, lineHeight: 17 },
  navRow:            { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', minHeight: 62, ...shadows.card },
  navAccent:         { width: 4, alignSelf: 'stretch' },
  navEmoji:          { fontSize: 22, marginHorizontal: spacing.md },
});
