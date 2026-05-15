import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type FontScale = 'small' | 'medium' | 'large';
type CalcMethod = 'diyanet' | 'mwl' | 'isna' | 'karachi';

type SettingsState = {
  fontScale: FontScale;
  enablePrayerNotifications: boolean;
  calcMethod: CalcMethod;
};

const STORAGE_KEY = 'app-settings-v2';

const CALC_METHODS: { id: CalcMethod; label: string; detail: string }[] = [
  { id: 'diyanet', label: 'Diyanet', detail: 'Türkiye — Diyanet İşleri Başkanlığı (Metod 13)' },
  { id: 'mwl',    label: 'MWL',     detail: 'Müslüman Dünya Birliği (Metod 3)' },
  { id: 'isna',   label: 'ISNA',    detail: 'Kuzey Amerika İslami Cemiyeti (Metod 2)' },
  { id: 'karachi',label: 'Karachi', detail: 'Karachi Üniversitesi (Metod 1)' },
];

const FONT_SCALES: { id: FontScale; label: string; arabic: string }[] = [
  { id: 'small',  label: 'Küçük',  arabic: 'آ' },
  { id: 'medium', label: 'Orta',   arabic: 'اَ' },
  { id: 'large',  label: 'Büyük',  arabic: 'أَ' },
];

async function loadSettings(): Promise<SettingsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SettingsState>;
      return {
        fontScale: p.fontScale ?? 'medium',
        enablePrayerNotifications: p.enablePrayerNotifications ?? false,
        calcMethod: p.calcMethod ?? 'diyanet',
      };
    }
  } catch {}
  return { fontScale: 'medium', enablePrayerNotifications: false, calcMethod: 'diyanet' };
}

async function saveSettings(s: SettingsState) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function SettingRow({ emoji, title, subtitle, children }: { emoji: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={{ fontSize: 22, marginRight: spacing.md }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#EDF5F2' }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: '#7AADA0', marginTop: 1 }}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [settings, setSettings] = useState<SettingsState>({
    fontScale: 'medium',
    enablePrayerNotifications: false,
    calcMethod: 'diyanet',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => { setSettings(s); setIsLoaded(true); });
  }, []);

  const update = (patch: Partial<SettingsState>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <IslamicBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>UYGULAMA</Text>
          <Text style={styles.heroTitle}>Ayarlar</Text>
          <Text style={styles.heroSub}>Tema, yazı boyutu, bildirimler ve hesaplama yöntemini buradan yönet.</Text>
        </LinearGradient>

        {/* ── Görünüm ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.gold500 }]}>🎨  Görünüm</Text>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SettingRow emoji="🌙" title="Gece Modu" subtitle={isDark ? 'Koyu tema aktif' : 'Açık tema aktif'}>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor={c.white}
              />
            </SettingRow>
          </View>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ fontSize: 22, marginRight: spacing.md }}>🔡</Text>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>Yazı Boyutu</Text>
                  <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>Kur'an ve dua ekranlarında kullanılır</Text>
                </View>
              </View>
              <View style={styles.pillRow}>
                {FONT_SCALES.map((fs) => {
                  const isActive = settings.fontScale === fs.id;
                  return (
                    <Pressable
                      key={fs.id}
                      disabled={!isLoaded}
                      onPress={() => update({ fontScale: fs.id })}
                      style={[
                        styles.pill,
                        { borderColor: isActive ? c.primary : c.border, backgroundColor: isActive ? c.primarySoft : 'transparent' },
                      ]}
                    >
                      <Text style={{ fontSize: 18, fontFamily: 'Amiri_400Regular' }}>{fs.arabic}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isActive ? c.primary : c.textSecondary, marginTop: 2 }}>
                        {fs.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={{ height: spacing.md }} />
          </View>
        </View>

        {/* ── Bildirimler ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.gold500 }]}>🔔  Bildirimler</Text>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SettingRow
              emoji="🕌"
              title="Namaz Bildirimleri"
              subtitle="Her namaz vakti için hatırlatma al"
            >
              <Switch
                value={settings.enablePrayerNotifications}
                onValueChange={(v) => update({ enablePrayerNotifications: v })}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor={c.white}
                disabled={!isLoaded}
              />
            </SettingRow>
          </View>
        </View>

        {/* ── Hesaplama Yöntemi ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.gold500 }]}>🧮  Namaz Vakti Hesabı</Text>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ padding: spacing.md }}>
              <Text style={{ fontSize: 13, color: c.textSecondary, marginBottom: spacing.sm, lineHeight: 18 }}>
                Türkiye için Diyanet metodu önerilir. Yurt dışındaysanız bulunduğunuz bölgeye uygun metodu seçin.
              </Text>
              {CALC_METHODS.map((method) => {
                const isActive = settings.calcMethod === method.id;
                return (
                  <Pressable
                    key={method.id}
                    disabled={!isLoaded}
                    onPress={() => update({ calcMethod: method.id })}
                    style={[
                      styles.methodRow,
                      {
                        borderColor: isActive ? c.primary : c.border,
                        backgroundColor: isActive ? c.primarySoft : 'transparent',
                      },
                    ]}
                  >
                    <View style={[
                      styles.radioOuter,
                      { borderColor: isActive ? c.primary : c.border },
                    ]}>
                      {isActive && <View style={[styles.radioInner, { backgroundColor: c.primary }]} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{method.label}</Text>
                      <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 1 }}>{method.detail}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Hakkında ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.gold500 }]}>ℹ️  Hakkında</Text>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              <View style={styles.aboutRow}>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>Versiyon</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>1.0.0</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <View style={styles.aboutRow}>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>Namaz Vakitleri</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>aladhan.com</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <View style={styles.aboutRow}>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>Kur'an Metni</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>alquran.cloud</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <View style={styles.aboutRow}>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>Cami Verisi</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary }}>OpenStreetMap</Text>
              </View>
            </View>
          </View>

          {/* Links */}
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, marginTop: spacing.sm }]}>
            <Pressable
              onPress={() => Linking.openURL('https://aaslann.github.io/islami-asistan/')}
              style={styles.linkRow}
            >
              <Text style={{ fontSize: 22, marginRight: spacing.md }}>🔒</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, flex: 1 }}>Gizlilik Politikası</Text>
              <Text style={{ fontSize: 16, color: c.textSecondary }}>›</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: c.border, marginHorizontal: spacing.md }]} />
            <Pressable
              onPress={() => Linking.openURL('https://github.com/aaslann/islami-asistan/issues')}
              style={styles.linkRow}
            >
              <Text style={{ fontSize: 22, marginRight: spacing.md }}>🐛</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, flex: 1 }}>Hata Bildir / Öneri</Text>
              <Text style={{ fontSize: 16, color: c.textSecondary }}>›</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:        { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:   { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:   { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs, lineHeight: 18 },
  section:     { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle:{ fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: spacing.sm },
  card:        { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...shadows.card },
  settingRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  pillRow:     { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
  pill:        { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.lg, borderWidth: 1.5 },
  methodRow:   { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radii.md, borderWidth: 1.5, marginBottom: spacing.xs },
  radioOuter:  { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner:  { width: 9, height: 9, borderRadius: 5 },
  aboutRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider:     { height: StyleSheet.hairlineWidth },
  linkRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
});
