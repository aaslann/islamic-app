import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, spacing } from '../../../core/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type GoodDeed = {
  id: string;
  text: string;
  category: DeedCategory;
  date: string;
  timestamp: number;
};

type DeedCategory = 'sadaka' | 'yardim' | 'guzel-soz' | 'ibadet' | 'diger';

const CATEGORIES: { id: DeedCategory; label: string; icon: IconName; color: string }[] = [
  { id: 'sadaka',     label: 'Sadaka',      icon: 'heart-outline',         color: '#EF4444' },
  { id: 'yardim',     label: 'Yardım',      icon: 'people-outline',        color: '#22C55E' },
  { id: 'guzel-soz',  label: 'Güzel söz',   icon: 'chatbubble-outline',    color: '#0EA5E9' },
  { id: 'ibadet',     label: 'Ekstra İbadet', icon: 'star-outline',        color: palette.gold500 },
  { id: 'diger',      label: 'Diğer',       icon: 'sparkles-outline',      color: '#8B5CF6' },
];

const STORAGE_KEY = '@good-deeds-v1';

const QUICK_TEMPLATES = [
  { text: 'Bir kişiye selam verdim', category: 'guzel-soz' as DeedCategory },
  { text: 'Yola eziyet veren bir şeyi kaldırdım', category: 'yardim' as DeedCategory },
  { text: 'Bir yoksula sadaka verdim', category: 'sadaka' as DeedCategory },
  { text: 'Anneme/babama yardım ettim', category: 'yardim' as DeedCategory },
  { text: '10 salavat çektim', category: 'ibadet' as DeedCategory },
  { text: 'Bir hasta ziyaret ettim', category: 'yardim' as DeedCategory },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function thisWeek(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function GoodDeedsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [deeds, setDeeds] = useState<GoodDeed[]>([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState<DeedCategory>('sadaka');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setDeeds(JSON.parse(raw) as GoodDeed[]);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((items: GoodDeed[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const add = useCallback((t: string, cat: DeedCategory) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    const deed: GoodDeed = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      category: cat,
      date: today(),
      timestamp: Date.now(),
    };
    setDeeds((prev) => {
      const next = [deed, ...prev];
      persist(next);
      return next;
    });
    setText('');
  }, [persist]);

  const remove = useCallback((id: string) => {
    setDeeds((prev) => {
      const next = prev.filter((d) => d.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const todayDeeds = useMemo(() => deeds.filter((d) => d.date === today()), [deeds]);
  const weekDays = useMemo(() => thisWeek(), []);
  const weekCounts = useMemo(
    () => weekDays.map((day) => deeds.filter((d) => d.date === day).length),
    [weekDays, deeds],
  );
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(1, ...weekCounts);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <LinearGradient
        colors={[c.heroGradientStart, c.heroGradientEnd] as [string, string]}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>İYİLİK DEFTERİ</Text>
        <Text style={styles.heroTitle}>Bugünkü İyiliklerin</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayDeeds.length}</Text>
            <Text style={styles.statLabel}>BUGÜN</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{weekTotal}</Text>
            <Text style={styles.statLabel}>BU HAFTA</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{deeds.length}</Text>
            <Text style={styles.statLabel}>TOPLAM</Text>
          </View>
        </View>

        {/* Weekly bar chart */}
        <View style={styles.chartRow}>
          {weekDays.map((day, i) => {
            const count = weekCounts[i];
            const height = (count / maxCount) * 38 + 4;
            const date = new Date(day);
            const dayLabel = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][date.getDay()];
            const isToday = i === 0;
            return (
              <View key={day} style={styles.chartCol}>
                <View style={[styles.chartBar, { height, backgroundColor: count > 0 ? palette.gold500 : 'rgba(255,255,255,0.1)' }]} />
                <Text style={[styles.chartLabel, isToday && { color: palette.gold400, fontWeight: '800' }]}>{dayLabel}</Text>
              </View>
            );
          }).reverse()}
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>YENİ EKLE</Text>

        <View style={styles.catRow}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.catChip,
                  { backgroundColor: c.surface, borderColor: c.border },
                  isActive && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                ]}
              >
                <Ionicons name={cat.icon} size={14} color={isActive ? cat.color : c.textSecondary} />
                <Text style={[styles.catLabel, { color: isActive ? cat.color : c.textSecondary, fontWeight: isActive ? '800' : '600' }]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.inputRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Bugün ne iyilik yaptın?"
            placeholderTextColor={c.textSecondary}
            style={[styles.input, { color: c.text }]}
            multiline
          />
          <Pressable
            onPress={() => add(text, category)}
            disabled={!text.trim()}
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: !text.trim() ? 0.4 : pressed ? 0.7 : 1 },
            ]}
          >
            <LinearGradient
              colors={['#F4D67E', '#C8A24A', '#8A6418']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="add" size={22} color="#0D1F18" />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: spacing.lg }]}>HIZLI EKLE</Text>
        <View style={styles.templatesWrap}>
          {QUICK_TEMPLATES.map((tmpl, i) => {
            const cat = CATEGORIES.find((cc) => cc.id === tmpl.category)!;
            return (
              <Pressable
                key={i}
                onPress={() => add(tmpl.text, tmpl.category)}
                style={({ pressed }) => [
                  styles.template,
                  { backgroundColor: c.surface, borderColor: c.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name={cat.icon} size={14} color={cat.color} />
                <Text style={[styles.templateText, { color: c.text }]}>{tmpl.text}</Text>
                <Ionicons name="add-circle" size={18} color={palette.gold400} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>BUGÜN ({todayDeeds.length})</Text>
        {todayDeeds.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📝</Text>
            <Text style={[t.body, { color: c.textSecondary, textAlign: 'center' }]}>
              Bugün için kayıt yok.{'\n'}Küçük bir iyilik bile sevap getirir.
            </Text>
          </View>
        ) : (
          todayDeeds.map((deed) => {
            const cat = CATEGORIES.find((cc) => cc.id === deed.category)!;
            return (
              <View
                key={deed.id}
                style={[styles.deedRow, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <View style={[styles.deedIcon, { backgroundColor: `${cat.color}20` }]}>
                  <Ionicons name={cat.icon} size={16} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deedText, { color: c.text }]}>{deed.text}</Text>
                  <Text style={[styles.deedMeta, { color: c.textSecondary }]}>
                    {new Date(deed.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {cat.label}
                  </Text>
                </View>
                <Pressable onPress={() => remove(deed.id)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={c.textSecondary} />
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },

  hero: { padding: spacing.lg, paddingBottom: spacing.md },
  heroLabel: { fontSize: 10, color: palette.gold400, fontWeight: '700', letterSpacing: 3 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(200,162,74,0.2)',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '900', color: palette.gold400 },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.md, gap: 6, height: 60 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  section: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  catLabel: { fontSize: 11 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 6,
    gap: 8,
  },
  input: { flex: 1, padding: 8, fontSize: 14, minHeight: 40, maxHeight: 100 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  templatesWrap: { gap: 6 },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  templateText: { flex: 1, fontSize: 13 },

  deedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: 6,
  },
  deedIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deedText: { fontSize: 13, fontWeight: '600' },
  deedMeta: { fontSize: 10, marginTop: 2 },

  empty: { alignItems: 'center', padding: spacing.xl },
});
