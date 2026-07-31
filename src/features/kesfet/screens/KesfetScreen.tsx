import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../../../navigation/types';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';
import { useTheme } from '../../../core/theme/ThemeContext';
import { radii, shadows, spacing } from '../../../core/theme/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Nav = NativeStackNavigationProp<RootStackParamList>;

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
      { icon: 'infinite-outline',  iconColors: ['#A07020', '#C8A24A'], label: 'Zikir Sayacı',       subtitle: 'Günlük hedefler ve istatistik', route: 'ZikrCounter'    },
      { icon: 'hand-left-outline', iconColors: ['#B88A35', '#D4AA60'], label: 'Günlük Dualar',      subtitle: 'Sabah, akşam duaları',          route: 'Duas'           },
      { icon: 'sparkles-outline',  iconColors: ['#A07020', '#FBE89C'], label: 'Esmâ-ül Hüsnâ',      subtitle: 'Allah\'ın 99 ismi',             route: 'EsmaulHusnaList' },
      { icon: 'chatbox-outline',   iconColors: ['#6D28D9', '#A78BFA'], label: '40 Hadis',           subtitle: 'İmam Nevevî derlemesi',         route: 'HadithList'     },
      { icon: 'star-outline',      iconColors: ['#CA9840', '#E0BF72'], label: 'Favori Ayetlerim',   subtitle: 'Yıldızladığın ayetler',         route: 'FavoriteAyahs'  },
    ],
  },
  {
    label: 'Takip & Analiz',
    items: [
      { icon: 'trending-up-outline',         iconColors: ['#C2400C', '#F97316'], label: 'Namaz İlerlemesi', subtitle: 'Seri takibi ve grafik',      route: 'PrayerProgress' },
      { icon: 'bar-chart-outline',           iconColors: ['#D05A0A', '#FB923C'], label: 'Manevî Analiz',    subtitle: 'Haftalık istatistikler',     route: 'Analytics'      },
      { icon: 'flag-outline',                iconColors: ['#B45309', '#F59E0B'], label: 'Hedeflerim',       subtitle: 'Günlük ibadet hedefleri',    route: 'Goals'          },
      { icon: 'heart-outline',               iconColors: ['#BE123C', '#F43F5E'], label: 'İyilik Defteri',   subtitle: 'Günlük sadaka ve iyilikler', route: 'GoodDeeds'      },
      { icon: 'book-outline',                iconColors: ['#15803D', '#22C55E'], label: 'Hatim Takibi',     subtitle: 'Kur\'an okuma planı',       route: 'HatimTracker'   },
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
];

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
              <LinearGradient colors={item.iconColors} style={styles.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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

export default function KesfetScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();

  // Keşfet is a pushed root-stack screen, so bottom-tab targets must be reached
  // via the nested MainTabs navigator (a bare tab name won't resolve from here).
  const TAB_ROUTES: (keyof RootStackParamList)[] = ['Home', 'PrayerTimes', 'QuranSurahList', 'ZikrCounter', 'Settings'];

  const navigate = (route: keyof RootStackParamList) => {
    if (TAB_ROUTES.includes(route)) {
      navigation.navigate('MainTabs', { screen: route as keyof TabParamList });
    } else {
      navigation.navigate(route as never);
    }
  };

  return (
    <IslamicBackground>
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <SectionGroup key={section.label} label={section.label} items={section.items} onPress={navigate} c={c} />
        ))}
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  group:       { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  groupLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.xs, paddingLeft: 4 },
  groupCard:   { borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  divider:     { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  rowItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, minHeight: 62 },
  iconBox:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
