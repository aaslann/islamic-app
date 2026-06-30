import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Defs,
  G,
  Circle,
  Polygon,
  Line,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export const LOGIN_KEY = 'login-complete-v1';

type Props = { onComplete: () => void };

const { width: SCREEN_W } = Dimensions.get('window');
const STAR_SIZE = Math.min(SCREEN_W - 60, 320);
const TOP_INSET = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 24) + 8;
const BOTTOM_INSET = Platform.OS === 'ios' ? 34 : 16;

export default function LoginScreen({ onComplete }: Props) {

  const rotateOuter = useRef(new Animated.Value(0)).current;
  const rotateInner = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const shineX = useRef(new Animated.Value(-1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateOuter, {
        toValue: 1,
        duration: 80000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(rotateInner, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(shineX, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(shineX, { toValue: -1, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [breathe, floatY, rotateInner, rotateOuter, shineX]);

  const outerSpin = rotateOuter.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const innerSpin = rotateInner.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const glowScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const floatTranslate = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const enterApp = onComplete;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#102218', '#0A1610', '#050A08']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.scanlight}>
        <LinearGradient
          colors={['rgba(200,162,74,0.18)', 'rgba(200,162,74,0.04)', 'transparent']}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.8, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View pointerEvents="none" style={styles.archFrame} />
      <View pointerEvents="none" style={styles.archFrameOuter} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowCircle,
          { transform: [{ translateX: -110 }, { translateY: -110 }, { scale: glowScale }], opacity: glowOpacity },
        ]}
      >
        <RadialOverlay />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.starWrap,
          { width: STAR_SIZE, height: STAR_SIZE, marginLeft: -STAR_SIZE / 2, transform: [{ rotate: outerSpin }] },
        ]}
      >
        <ShemsStar size={STAR_SIZE} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.starInner,
          {
            width: STAR_SIZE * 0.45,
            height: STAR_SIZE * 0.45,
            marginLeft: -(STAR_SIZE * 0.45) / 2,
            marginTop: -(STAR_SIZE * 0.45) / 2,
            transform: [{ rotate: innerSpin }],
          },
        ]}
      >
        <InnerStar size={STAR_SIZE * 0.45} />
      </Animated.View>

      <View pointerEvents="none" style={styles.coreDot}>
        <LinearGradient
          colors={['#FBE89C', '#C8A24A', '#8A6418']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.satellite, { top: 90, left: 32 }, { transform: [{ translateY: floatTranslate }] }]}
      >
        <Hexagon />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.satellite, { top: 100, right: 32 }, { transform: [{ translateY: floatTranslate }] }]}
      >
        <Hexagon />
      </Animated.View>

      <View style={[styles.content, { paddingTop: TOP_INSET, paddingBottom: BOTTOM_INSET + 24 }]}>
        <View style={styles.topRow}>
          <View style={styles.brandTag}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>İSLAMİ ASİSTAN</Text>
          </View>
          <View style={styles.langPill}>
            <Text style={styles.langText}>TR</Text>
          </View>
        </View>

        <Text style={styles.bismillah}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ</Text>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Manevi Yolculuk</Text>
          <Text style={styles.titleArabic}>رحلة روحية</Text>
          <Text style={styles.subtitle}>
            İbadetini takip et, Kur'an'la huzur bul,{'\n'}her gün biraz daha aydınlan.
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.authBlock}>
          <Pressable
            onPress={enterApp}
            style={({ pressed }) => [styles.btnGold, pressed && styles.btnPressed]}
          >
            <LinearGradient
              colors={['#F4D67E', '#C8A24A', '#8A6418']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shine,
                { transform: [{ translateX: shineX.interpolate({ inputRange: [-1, 1], outputRange: [-SCREEN_W, SCREEN_W] }) }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Text style={styles.btnGoldText}>Başla</Text>
          </Pressable>

          <View style={styles.privacyNoteRow}>
            <Ionicons name="lock-closed" size={12} color="rgba(200,162,74,0.7)" />
            <Text style={styles.privacyNote}>
              Hesap gerekmez · Verileriniz yalnızca cihazınızda saklanır
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ShemsStar({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;
  const tickOuter = r;
  const tickInner = r - 5;

  const ticks: React.ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i * 15 * Math.PI) / 180;
    const x1 = cx + tickOuter * Math.sin(angle);
    const y1 = cy - tickOuter * Math.cos(angle);
    const x2 = cx + tickInner * Math.sin(angle);
    const y2 = cy - tickInner * Math.cos(angle);
    ticks.push(<Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8A24A" strokeWidth={0.8} opacity={0.6} />);
  }

  const pts12: Array<[number, number]> = [];
  const innerR = r * 0.89;
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    pts12.push([cx + innerR * Math.sin(angle), cy - innerR * Math.cos(angle)]);
  }
  const polygonStr = pts12.map(([x, y]) => `${x},${y}`).join(' ');

  const hex1: Array<[number, number]> = [];
  const hex2: Array<[number, number]> = [];
  const hexR = r * 0.82;
  for (let i = 0; i < 6; i++) {
    const a1 = (i * 60 - 90) * (Math.PI / 180);
    const a2 = (i * 60 - 60) * (Math.PI / 180);
    hex1.push([cx + hexR * Math.cos(a1), cy + hexR * Math.sin(a1)]);
    hex2.push([cx + hexR * Math.cos(a2), cy + hexR * Math.sin(a2)]);
  }
  const hex1Str = hex1.map(([x, y]) => `${x},${y}`).join(' ');
  const hex2Str = hex2.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <SvgLinearGradient id="goldS" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FBE89C" stopOpacity={0.95} />
          <Stop offset="0.5" stopColor="#C8A24A" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#8A6418" stopOpacity={0.7} />
        </SvgLinearGradient>
      </Defs>

      <G opacity={0.5}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#C8A24A" strokeWidth={0.4} />
        <Circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="#C8A24A" strokeWidth={0.4} />
      </G>

      <G>{ticks}</G>

      <Polygon points={polygonStr} fill="none" stroke="#C8A24A" strokeWidth={0.7} opacity={0.75} />
      <Polygon points={hex1Str} fill="none" stroke="#C8A24A" strokeWidth={0.7} opacity={0.85} />
      <Polygon points={hex2Str} fill="none" stroke="#C8A24A" strokeWidth={0.7} opacity={0.85} />

      <Circle cx={cx} cy={cy} r={r * 0.65} fill="none" stroke="#C8A24A" strokeWidth={0.5} opacity={0.6} />
      <Circle cx={cx} cy={cy} r={r * 0.53} fill="none" stroke="#C8A24A" strokeWidth={0.5} opacity={0.45} />

      <G opacity={0.55}>
        <Line x1={cx} y1={cy - r * 0.89} x2={cx} y2={cy + r * 0.89} stroke="#C8A24A" strokeWidth={0.4} />
        <Line x1={cx - r * 0.89} y1={cy} x2={cx + r * 0.89} y2={cy} stroke="#C8A24A" strokeWidth={0.4} />
        <Line
          x1={cx + r * 0.63 * Math.cos(Math.PI / 4)}
          y1={cy + r * 0.63 * Math.sin(Math.PI / 4)}
          x2={cx - r * 0.63 * Math.cos(Math.PI / 4)}
          y2={cy - r * 0.63 * Math.sin(Math.PI / 4)}
          stroke="#C8A24A"
          strokeWidth={0.4}
        />
        <Line
          x1={cx + r * 0.63 * Math.cos(-Math.PI / 4)}
          y1={cy + r * 0.63 * Math.sin(-Math.PI / 4)}
          x2={cx - r * 0.63 * Math.cos(-Math.PI / 4)}
          y2={cy - r * 0.63 * Math.sin(-Math.PI / 4)}
          stroke="#C8A24A"
          strokeWidth={0.4}
        />
      </G>

      <G fill="url(#goldS)" opacity={0.9}>
        {pts12.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2.5} />
        ))}
      </G>
    </Svg>
  );
}

function InnerStar({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  const points: Array<[number, number]> = [];
  for (let i = 0; i < 8; i++) {
    const outerAngle = (i * 45 - 90) * (Math.PI / 180);
    const innerAngle = (i * 45 - 90 + 22.5) * (Math.PI / 180);
    points.push([cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle)]);
    points.push([cx + r * 0.4 * Math.cos(innerAngle), cy + r * 0.4 * Math.sin(innerAngle)]);
  }
  const starStr = points.map(([x, y]) => `${x},${y}`).join(' ');

  const petalPoints: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 - 90 + 22.5) * (Math.PI / 180);
    petalPoints.push({ x: cx + r * 0.78 * Math.cos(angle), y: cy + r * 0.78 * Math.sin(angle) });
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="innerG" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
          <Stop offset="0" stopColor="#FBE89C" stopOpacity={0.95} />
          <Stop offset="0.6" stopColor="#C8A24A" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#8A6418" stopOpacity={0.4} />
        </RadialGradient>
      </Defs>
      <Polygon points={starStr} fill="url(#innerG)" stroke="#FBE89C" strokeWidth={0.6} />
      <Circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="rgba(13,31,24,0.4)" strokeWidth={0.5} />
      <G fill="#C8A24A" opacity={0.75}>
        {petalPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={2} />
        ))}
      </G>
    </Svg>
  );
}

function RadialOverlay() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        <RadialGradient id="glow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
          <Stop offset="0" stopColor="#C8A24A" stopOpacity={0.35} />
          <Stop offset="0.4" stopColor="#C8A24A" stopOpacity={0.1} />
          <Stop offset="1" stopColor="#C8A24A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={110} cy={110} r={110} fill="url(#glow)" />
    </Svg>
  );
}

function Hexagon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Polygon points="18,3 31,11 31,25 18,33 5,25 5,11" fill="none" stroke="#C8A24A" strokeWidth={1} />
      <Polygon points="18,9 27,14 27,22 18,27 9,22 9,14" fill="rgba(200,162,74,0.2)" />
    </Svg>
  );
}

const STAR_TOP = 140;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050807',
  },
  scanlight: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
  },
  archFrame: {
    position: 'absolute',
    top: 60,
    left: '50%',
    width: 320,
    height: 440,
    marginLeft: -160,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
    borderWidth: 1.5,
    borderColor: 'rgba(200,162,74,0.4)',
    borderBottomWidth: 0,
  },
  archFrameOuter: {
    position: 'absolute',
    top: 52,
    left: '50%',
    width: 336,
    height: 448,
    marginLeft: -168,
    borderTopLeftRadius: 168,
    borderTopRightRadius: 168,
    borderWidth: 0.5,
    borderColor: 'rgba(200,162,74,0.18)',
    borderBottomWidth: 0,
  },
  glowCircle: {
    position: 'absolute',
    top: STAR_TOP + STAR_SIZE / 2,
    left: '50%',
    width: 220,
    height: 220,
  },
  starWrap: {
    position: 'absolute',
    top: STAR_TOP,
    left: '50%',
  },
  starInner: {
    position: 'absolute',
    top: STAR_TOP + STAR_SIZE / 2,
    left: '50%',
  },
  coreDot: {
    position: 'absolute',
    top: STAR_TOP + STAR_SIZE / 2 - 14,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FBE89C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 8,
  },
  satellite: {
    position: 'absolute',
    width: 36,
    height: 36,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C8A24A',
    shadowColor: '#C8A24A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  brandText: {
    fontSize: 10,
    color: '#C8A24A',
    letterSpacing: 3,
    fontWeight: '700',
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  langText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    fontWeight: '600',
  },
  bismillah: {
    marginTop: STAR_SIZE + 70,
    fontSize: 18,
    color: '#E0BF72',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(200,162,74,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    opacity: 0.95,
  },
  titleBlock: {
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 38 : 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.2,
    textShadowColor: 'rgba(200,162,74,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 30,
  },
  titleArabic: {
    fontSize: 14,
    color: '#C8A24A',
    marginTop: 4,
    letterSpacing: 1,
    opacity: 0.85,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  spacer: {
    flex: 1,
    minHeight: 12,
  },
  authBlock: {
    width: '100%',
  },
  btnGold: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#C8A24A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  btnGoldText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D1F18',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  privacyNote: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
