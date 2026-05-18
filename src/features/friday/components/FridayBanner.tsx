import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette, radii, spacing } from '../../../core/theme/tokens';
import { getDailySalavat, isFriday } from '../utils/fridayUtils';
import type { RootStackParamList } from '../../../navigation/types';

const KEHF_KEY = '@kehf-read';
const SALAVAT_KEY = '@salavat-counter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function FridayBanner() {
  const friday = isFriday();
  const navigation = useNavigation<Nav>();
  const [kehfRead, setKehfRead] = useState(false);
  const [salavatCount, setSalavatCount] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  const salavat = useMemo(() => getDailySalavat(), []);

  useEffect(() => {
    AsyncStorage.multiGet([KEHF_KEY, SALAVAT_KEY])
      .then((rows) => {
        const map = Object.fromEntries(rows);
        if (map[KEHF_KEY] === todayKey()) setKehfRead(true);
        if (map[SALAVAT_KEY]) {
          const parsed = JSON.parse(map[SALAVAT_KEY]!);
          if (parsed.date === todayKey()) setSalavatCount(parsed.count ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const markKehfRead = useCallback(() => {
    AsyncStorage.setItem(KEHF_KEY, todayKey()).catch(() => {});
    setKehfRead(true);
  }, []);

  const addSalavat = useCallback(() => {
    setSalavatCount((prev) => {
      const next = prev + 1;
      AsyncStorage.setItem(SALAVAT_KEY, JSON.stringify({ date: todayKey(), count: next })).catch(() => {});
      return next;
    });
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1, duration: 90, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
  }, [pulse]);

  if (!friday) return null;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#1E4D33', '#0F2A1D', '#0A1F15']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.topGold} />

        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Ionicons name="star" size={11} color={palette.gold400} />
            <Text style={styles.headerBadgeText}>MÜBAREK CUMA</Text>
            <Ionicons name="star" size={11} color={palette.gold400} />
          </View>
        </View>

        <Text style={styles.title}>Cuma Günü Amelleri</Text>
        <Text style={styles.subtitle}>"Cuma müminin bayramıdır." (Hadis-i şerif)</Text>

        {/* Kehf */}
        <Pressable
          onPress={kehfRead ? undefined : markKehfRead}
          style={({ pressed }) => [
            styles.actionCard,
            kehfRead && { borderColor: '#22C55E60', backgroundColor: 'rgba(34,197,94,0.08)' },
            pressed && !kehfRead && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: kehfRead ? '#22C55E30' : `${palette.gold500}25` }]}>
            <Ionicons name={kehfRead ? 'checkmark' : 'book'} size={18} color={kehfRead ? '#22C55E' : palette.gold400} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Kehf Sûresi</Text>
            <Text style={styles.actionSub}>
              {kehfRead ? 'Bugün okudun' : 'İki Cuma arası nurun kılınır'}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('QuranSurahDetail', { surahId: 18, surahName: 'Kehf' })}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>{kehfRead ? 'Aç' : 'Oku'}</Text>
            <Ionicons name="chevron-forward" size={12} color={palette.gold400} />
          </Pressable>
        </Pressable>

        {/* Salavat */}
        <Pressable
          onPress={addSalavat}
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${palette.gold500}25` }]}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Ionicons name="heart" size={18} color={palette.gold400} />
            </Animated.View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Salavat Sayacı</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{salavat.short} · dokun → say</Text>
          </View>
          <View style={styles.salavatBadge}>
            <Text style={styles.salavatCount}>{salavatCount}</Text>
          </View>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: palette.gold500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  banner: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${palette.gold500}40`,
    position: 'relative',
  },
  topGold: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: palette.gold500,
    opacity: 0.5,
  },
  headerRow: { alignItems: 'center', marginBottom: 6 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(200,162,74,0.12)',
    borderWidth: 1,
    borderColor: `${palette.gold500}40`,
  },
  headerBadgeText: { fontSize: 9, fontWeight: '900', color: palette.gold400, letterSpacing: 2 },

  title: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', textAlign: 'center', marginTop: 2, marginBottom: spacing.md },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
  actionSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    backgroundColor: 'rgba(200,162,74,0.15)',
    borderRadius: 99,
    gap: 2,
  },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 0.3 },

  salavatBadge: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: palette.gold500,
    alignItems: 'center',
  },
  salavatCount: { fontSize: 16, fontWeight: '900', color: '#0D1F18' },
});
