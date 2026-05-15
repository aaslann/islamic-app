import React, { useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { requestNotificationPermission } from '../../../core/notifications/prayerNotifications';
import { palette, radii, spacing } from '../../../core/theme/tokens';

export const ONBOARDING_KEY = 'onboarding-complete-v1';

type Props = { onComplete: () => void };

type Step = {
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  skip?: string;
  color: [string, string];
};

const STEPS: Step[] = [
  {
    emoji: '🌙',
    title: 'İslami Asistan\'a\nHoş Geldin',
    subtitle: 'Günlük ibadetlerin için namaz vakitleri, Kur\'an-ı Kerim, zikir sayacı ve daha fazlası.',
    cta: 'Başlayalım',
    color: ['#1A6648', '#0F3D2E'],
  },
  {
    emoji: '📍',
    title: 'Konumuna\nİzin Ver',
    subtitle: 'Bulunduğun şehre göre doğru namaz vakitlerini hesaplayabilmemiz için konum iznine ihtiyacımız var.',
    cta: 'Konuma İzin Ver',
    skip: 'Şimdilik Atla',
    color: ['#0F3D2E', '#0A2818'],
  },
  {
    emoji: '🔔',
    title: 'Namaz Vakti\nHatırlatıcı',
    subtitle: 'Her namaz vakti geldiğinde sana bildirim gönderelim. İstediğin zaman kapatabilirsin.',
    cta: 'Bildirimlere İzin Ver',
    skip: 'Şimdilik Atla',
    color: ['#162028', '#0A1520'],
  },
  {
    emoji: '✨',
    title: 'Her Şey\nHazır!',
    subtitle: 'Uygulamanı kullanmaya başlayabilirsin. Hayırlı ibadetler dileriz.',
    cta: 'Uygulamaya Gir',
    color: ['#1A6648', '#0F3D2E'],
  },
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [locGranted, setLocGranted] = useState<boolean | null>(null);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleCta = async () => {
    if (loading) return;
    if (step === 0) { setStep(1); return; }

    if (step === 1) {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocGranted(status === 'granted');
      } catch { setLocGranted(false); }
      setLoading(false);
      setStep(2);
      return;
    }

    if (step === 2) {
      setLoading(true);
      try {
        const granted = await requestNotificationPermission();
        setNotifGranted(granted);
      } catch { setNotifGranted(false); }
      setLoading(false);
      setStep(3);
      return;
    }

    if (step === 3) { await finish(); }
  };

  const handleSkip = async () => {
    if (step === 1) { setLocGranted(false); setStep(2); return; }
    if (step === 2) { setNotifGranted(false); await finish(); }
  };

  const { width } = Dimensions.get('window');

  return (
    <LinearGradient colors={current.color} style={styles.root}>
      {/* Decorative rings */}
      <View style={[styles.ring, styles.ring1, { borderColor: 'rgba(255,255,255,.04)' }]} />
      <View style={[styles.ring, styles.ring2, { borderColor: 'rgba(255,255,255,.03)' }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Emoji badge */}
        <View style={styles.emojiBadge}>
          <Text style={styles.emoji}>{current.emoji}</Text>
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {/* Permission status feedback */}
        {step === 2 && locGranted !== null && (
          <View style={[styles.statusBadge, { backgroundColor: locGranted ? `${palette.green500}20` : 'rgba(255,255,255,.08)' }]}>
            <Text style={{ fontSize: 12, color: locGranted ? palette.green300 : 'rgba(255,255,255,.5)' }}>
              {locGranted ? '✓ Konum izni verildi' : '○ Konum izni atlandı'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {/* CTA button */}
        <Pressable
          onPress={handleCta}
          disabled={loading}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
        >
          <LinearGradient
            colors={[palette.gold500, palette.gold300]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Text style={styles.ctaText}>
              {loading ? '⏳ Bekle...' : current.cta}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Skip */}
        {current.skip && (
          <Pressable onPress={handleSkip} style={{ marginTop: spacing.md }}>
            <Text style={styles.skipText}>{current.skip}</Text>
          </Pressable>
        )}

        <View style={{ height: spacing.xl }} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  ring:         { position: 'absolute', borderRadius: 9999, borderWidth: 1 },
  ring1:        { width: 500, height: 500, top: -180, right: -140 },
  ring2:        { width: 360, height: 360, top: -80, right: -80 },
  content:      { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emojiBadge:   { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emoji:        { fontSize: 52 },
  title:        { fontSize: 34, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -1, lineHeight: 42, marginBottom: spacing.lg },
  subtitle:     { fontSize: 16, color: 'rgba(255,255,255,.6)', textAlign: 'center', lineHeight: 26, maxWidth: 300 },
  statusBadge:  { marginTop: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full },
  bottom:       { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' },
  dots:         { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.25)' },
  dotActive:    { width: 24, backgroundColor: palette.gold500 },
  ctaBtn:       { width: '100%' },
  ctaGrad:      { borderRadius: radii.full, paddingVertical: 16, alignItems: 'center' },
  ctaText:      { fontSize: 17, fontWeight: '800', color: '#000', letterSpacing: -0.3 },
  skipText:     { fontSize: 14, color: 'rgba(255,255,255,.4)', textDecorationLine: 'underline' },
});
