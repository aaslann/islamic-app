import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, textStyles } from '../theme/designSystem';
import { Card } from '../components/Card';

type ThemeMode = 'dark' | 'system';
type FontScale = 'small' | 'medium' | 'large';
type SettingsState = {
  theme: ThemeMode;
  fontScale: FontScale;
  enablePrayerNotifications: boolean;
};

const STORAGE_KEY = 'app-settings-v1';

export async function loadAppSettings(): Promise<SettingsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return {
        theme: parsed.theme ?? 'dark',
        fontScale: parsed.fontScale ?? 'medium',
        enablePrayerNotifications: parsed.enablePrayerNotifications ?? false,
      };
    }
  } catch {
    // ignore
  }
  return {
    theme: 'dark',
    fontScale: 'medium',
    enablePrayerNotifications: false,
  };
}

export async function saveAppSettings(next: SettingsState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'dark',
    fontScale: 'medium',
    enablePrayerNotifications: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await loadAppSettings();
      setSettings(s);
      setIsLoaded(true);
    };
    load();
  }, []);

  const update = (patch: Partial<SettingsState>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAppSettings(next);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <Text style={styles.title}>Ayarlar</Text>
        <Text style={styles.subtitle}>
          Tema ve yazı boyutu gibi genel tercihlerini buradan değiştirebilirsin.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Tema</Text>
        <Text style={styles.sectionSubtitle}>
          Şimdilik uygulama koyu tema ile tasarlandı. Daha sonra sistem temasına
          uyum için geliştirilebilir.
        </Text>
        <View style={styles.row}>
          {[
            { id: 'dark' as ThemeMode, label: 'Koyu' },
            { id: 'system' as ThemeMode, label: 'Sistem' },
          ].map((opt) => (
            <Pressable
              key={opt.id}
              disabled={!isLoaded}
              onPress={() => update({ theme: opt.id })}
              style={({ pressed }) => [
                styles.optionPill,
                settings.theme === opt.id && styles.optionPillActive,
                pressed && styles.optionPillPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.theme === opt.id && styles.optionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Yazı Boyutu</Text>
        <Text style={styles.sectionSubtitle}>
          Kur&apos;an ve dualar ekranında kullanılacak yazı boyutu.
        </Text>
        <View style={styles.row}>
          {[
            { id: 'small' as FontScale, label: 'Küçük' },
            { id: 'medium' as FontScale, label: 'Orta' },
            { id: 'large' as FontScale, label: 'Büyük' },
          ].map((opt) => (
            <Pressable
              key={opt.id}
              disabled={!isLoaded}
              onPress={() => update({ fontScale: opt.id })}
              style={({ pressed }) => [
                styles.optionPill,
                settings.fontScale === opt.id && styles.optionPillActive,
                pressed && styles.optionPillPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.fontScale === opt.id && styles.optionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Namaz Bildirimleri</Text>
        <Text style={styles.sectionSubtitle}>
          Bugünkü namaz vakitleri için hatırlatma al. Bildirimler ayrıca
          Namaz Vakitleri ekranından planlanır.
        </Text>
        <View style={styles.row}>
          {[
            { id: true, label: 'Açık' },
            { id: false, label: 'Kapalı' },
          ].map((opt) => (
            <Pressable
              key={String(opt.id)}
              disabled={!isLoaded}
              onPress={() => update({ enablePrayerNotifications: opt.id })}
              style={({ pressed }) => [
                styles.optionPill,
                settings.enablePrayerNotifications === opt.id &&
                  styles.optionPillActive,
                pressed && styles.optionPillPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.enablePrayerNotifications === opt.id &&
                    styles.optionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  sectionTitle: {
    ...textStyles.heading2,
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSoft,
  },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  optionPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionPillPressed: {
    backgroundColor: '#E5F2ED',
  },
  optionText: {
    fontSize: 13,
    color: colors.textSoft,
  },
  optionTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
});

