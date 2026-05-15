import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../core/theme/ThemeContext';
import { radii, spacing } from '../../../core/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type FontScale = 'small' | 'medium' | 'large';
type SettingsState = {
  fontScale: FontScale;
  enablePrayerNotifications: boolean;
};

const STORAGE_KEY = 'app-settings-v2';

async function loadSettings(): Promise<SettingsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SettingsState>;
      return { fontScale: p.fontScale ?? 'medium', enablePrayerNotifications: p.enablePrayerNotifications ?? false };
    }
  } catch {}
  return { fontScale: 'medium', enablePrayerNotifications: false };
}

async function saveSettings(s: SettingsState) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const [settings, setSettings] = useState<SettingsState>({ fontScale: 'medium', enablePrayerNotifications: false });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => { setSettings(s); setIsLoaded(true); });
  }, []);

  const update = (patch: Partial<SettingsState>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const pillStyle = (active: boolean) => [
    styles.pill,
    { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primarySoft : 'transparent' },
  ];

  return (
    <IslamicBackground>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <Card style={styles.card}>
          <Text style={[t.heading1, { color: c.text }]}>Ayarlar</Text>
          <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.xs }]}>
            Tema, yazı boyutu ve namaz bildirimleri gibi tercihlerini buradan yönetebilirsin.
          </Text>
        </Card>

        {/* Dark mode toggle */}
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[t.heading2, { color: c.text }]}>Gece Modu</Text>
              <Text style={[t.caption, { color: c.textSecondary, marginTop: 2 }]}>
                {isDark ? 'Koyu tema aktif' : 'Açık tema aktif'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.white}
            />
          </View>
        </Card>

        {/* Font scale */}
        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Yazı Boyutu</Text>
          <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.xs }]}>
            Kur'an ve dualar ekranında kullanılacak yazı boyutu.
          </Text>
          <View style={styles.pillRow}>
            {(['small', 'medium', 'large'] as FontScale[]).map((id) => (
              <Pressable key={id} disabled={!isLoaded} onPress={() => update({ fontScale: id })} style={pillStyle(settings.fontScale === id)}>
                <Text style={[t.captionBold, { color: settings.fontScale === id ? c.primary : c.textSecondary }]}>
                  {id === 'small' ? 'Küçük' : id === 'medium' ? 'Orta' : 'Büyük'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[t.heading2, { color: c.text }]}>Namaz Bildirimleri</Text>
              <Text style={[t.caption, { color: c.textSecondary, marginTop: 2 }]}>
                Namaz vakitlerinde hatırlatma al.
              </Text>
            </View>
            <Switch
              value={settings.enablePrayerNotifications}
              onValueChange={(v) => update({ enablePrayerNotifications: v })}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.white}
              disabled={!isLoaded}
            />
          </View>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Hakkında</Text>
          <Text style={[t.caption, { color: c.textSecondary, marginTop: spacing.xs }]}>
            İslami Asistan v1.0{'\n'}
            Namaz vakitleri, Kur'an, dua ve daha fazlası.
          </Text>
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: 'transparent' },
  content:   { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card:      { padding: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  pillRow:   { marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill:      { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full, borderWidth: StyleSheet.hairlineWidth },
});
