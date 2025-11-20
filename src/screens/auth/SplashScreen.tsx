// src/screens/auth/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
  Text,
  Easing,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/slices/authSlice';
import { AppDispatch } from '../../redux/store';
import { useNavigation } from '@react-navigation/native';
import { Images } from '../../utils/resources';
import colors from '../../constants/colors';
import { common } from '../../constants/common';
import { CustomText } from '../../utils/libraryAssets';
import LinearGradient from 'react-native-linear-gradient';

/**
 * SplashScreen — background shapes animate continuously.
 * No particle dots on/above logo (they have been removed).
 */

const SPLASH_WAIT = 3500; // ms until exit starts
const EXIT_DURATION = 420;

const confettiDefs = [
  { id: 'c1', left: -140, top: -60, size: 22, color: '#FF6B6B', rotate: 14 },
  { id: 'c2', left: -90, top: -160, size: 18, color: '#7C5CFA', rotate: -8 },
  { id: 'c3', left: 110, top: -120, size: 28, color: '#00B894', rotate: 20 },
  { id: 'c4', left: 150, top: -10, size: 20, color: '#00A8FF', rotate: 6 },
  { id: 'c5', left: -170, top: 120, size: 18, color: '#FFB86B', rotate: -10 },
  { id: 'c6', left: 110, top: 140, size: 16, color: '#EF476F', rotate: 4 },
  { id: 'c7', left: 10, top: 200, size: 18, color: '#FFD166', rotate: -6 },
  { id: 'c8', left: -40, top: 220, size: 24, color: '#4CC9F0', rotate: 22 },
];

type Nav = {
  reset: (s: any) => void;
  replace: (screen: string, params?: any) => void;
  navigate: (screen: string, params?: any) => void;
};

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const mountedRef = useRef(true);

  // logo parts support
  const logoParts = (Images as any).logoParts as string[] | undefined;
  const hasLogoParts = Array.isArray(logoParts) && logoParts.length > 0;
  const logoPiecesCount = hasLogoParts ? logoParts.length : 1;

  // Logo animated values
  const logoScales = useRef(Array.from({ length: logoPiecesCount }, () => new Animated.Value(0.4))).current;
  const logoOpacities = useRef(Array.from({ length: logoPiecesCount }, () => new Animated.Value(0))).current;
  const logoRot = useRef(new Animated.Value(0)).current; // small 3d tilt jitter
  const logoWrapScale = useRef(new Animated.Value(0.85)).current;

  // confetti/background shapes anim values
  const confettiAnim = useRef(
    confettiDefs.map(() => ({
      t: new Animated.Value(0), // drives orbit/translate
      r: new Animated.Value(0), // rotation
      s: new Animated.Value(1), // scale
      o: new Animated.Value(1), // opacity
    }))
  ).current;

  // overall exit opacity
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    mountedRef.current = true;

    // start lively confetti loops with randomized durations and delays
    confettiAnim.forEach((a, i) => {
      const dur = 3000 + Math.round(Math.random() * 2600);
      const delay = Math.round(Math.random() * 400);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(a.t, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(a.r, { toValue: 1, duration: dur * 1.1, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.sequence([
              Animated.timing(a.s, { toValue: 1.14, duration: dur / 2, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
              Animated.timing(a.s, { toValue: 0.9, duration: dur / 2, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
            ]),
            Animated.sequence([
              Animated.timing(a.o, { toValue: 0.72, duration: dur / 2, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
              Animated.timing(a.o, { toValue: 1.0, duration: dur / 2, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
            ]),
          ]),
          // reset to 0 for next loop
          Animated.parallel([
            Animated.timing(a.t, { toValue: 0, duration: 10, useNativeDriver: true }),
            Animated.timing(a.r, { toValue: 0, duration: 10, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
    });

    // logo reveal sequence: staggered pieces + wrap spring + slight tilt jitter
    const revealStaggers = logoPiecesCount === 1 ? [0] : logoPiecesCount === 2 ? [0, 90] : Array.from({ length: logoPiecesCount }, (_, i) => i * 70);
    const pieceAnims = logoPiecesCount === 1
      ? [
          // single logo: pop with overshoot + quick wobble
          Animated.sequence([
            Animated.parallel([
              Animated.spring(logoScales[0], { toValue: 1.06, friction: 6, tension: 120, useNativeDriver: true }),
              Animated.timing(logoOpacities[0], { toValue: 1, duration: 380, useNativeDriver: true }),
            ]),
            Animated.spring(logoScales[0], { toValue: 0.98, friction: 6, tension: 90, useNativeDriver: true }),
            Animated.spring(logoScales[0], { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
          ])
        ]
      : revealStaggers.map((d, i) =>
          Animated.sequence([
            Animated.delay(d),
            Animated.parallel([
              Animated.spring(logoScales[i], { toValue: 1.08, friction: 6, tension: 120, useNativeDriver: true }),
              Animated.timing(logoOpacities[i], { toValue: 1, duration: 360, useNativeDriver: true }),
            ]),
            Animated.spring(logoScales[i], { toValue: 0.98, friction: 6, tension: 90, useNativeDriver: true }),
            Animated.spring(logoScales[i], { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
          ])
        );

    // wrap jitter (subtle rotate)
    const wrapJitter = Animated.loop(
      Animated.sequence([
        Animated.timing(logoRot, { toValue: 0.18, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(logoRot, { toValue: -0.14, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(logoRot, { toValue: 0.03, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );

    // run piece animations, then start jitter
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoWrapScale, { toValue: 1.03, duration: 260, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.stagger(90, pieceAnims),
      ]),
      Animated.parallel([
        // small settle
        Animated.timing(logoWrapScale, { toValue: 1, duration: 240, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]),
    ]).start(() => {
      wrapJitter.start();
    });

    // routing after wait with exit animation
    (async () => {
      try {
        const storedUserRaw = await AsyncStorage.getItem('user');
        const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
        if (storedUser && storedUser.profileCompleted) {
          dispatch(loginSuccess(storedUser));
        }
        const introSeen = (await AsyncStorage.getItem('introSeen')) === 'true';

        setTimeout(() => {
          // final exit: fade out & scale up slightly
          Animated.parallel([
            Animated.timing(exitOpacity, { toValue: 0, duration: EXIT_DURATION, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
            Animated.timing(logoWrapScale, { toValue: 1.12, duration: EXIT_DURATION, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          ]).start(() => {
            if (!mountedRef.current) return;
            if (storedUser && storedUser.profileCompleted) {
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              return;
            }
            if (introSeen) navigation.replace('Auth', { screen: 'Login' });
            else navigation.replace('Auth', { screen: 'Intro' });
          });
        }, SPLASH_WAIT);
      } catch (err) {
        if (!mountedRef.current) return;
        navigation.replace('Auth', { screen: 'Intro' });
      }
    })();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helpers: confetti style mapping
  const confettiStyle = (i: number, def: typeof confettiDefs[number]) => {
    const a = confettiAnim[i];
    // translate path: small circular/orbital movement
    const tx = a.t.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.sin(i + 1) * 18) + def.left * 0.025] });
    const ty = a.t.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.cos(i + 2) * 18) + def.top * 0.025] });
    const rot = a.r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${def.rotate ?? 24}deg`] });

    return {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      marginLeft: def.left,
      marginTop: def.top,
      width: def.size,
      height: def.size,
      transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }, { scale: a.s }],
      opacity: a.o,
      borderRadius: def.size / 6,
      backgroundColor: def.color,
    };
  };

  const appTitle = common?.FULL_NAME ?? 'AppName';

  return (
    <LinearGradient colors={colors.gradientPrimary} style={styles.safe}>
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} translucent={Platform.OS === 'android'} />
      <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
        {/* confetti / geometric background shapes */}
        {confettiDefs.map((def, i) => (
          <Animated.View key={def.id} style={confettiStyle(i, def)} />
        ))}

        {/* center animated logo (pieces or single) */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              transform: [
                { perspective: 1200 },
                {
                  rotateY: logoRot.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-8deg', '8deg'],
                  }) as any,
                },
                { scale: logoWrapScale },
              ],
            },
          ]}
        >
          {hasLogoParts
            ? logoParts.map((src, idx) => (
                <Animated.Image
                  key={`part-${idx}`}
                  source={src}
                  style={{
                    width: 160,
                    height: 160,
                    position: 'absolute',
                    opacity: logoOpacities[idx],
                    transform: [{ scale: logoScales[idx] }],
                  }}
                  resizeMode="contain"
                />
              ))
            : (
                <Animated.Image
                  source={Images.logo}
                  style={{
                    width: 170,
                    height: 170,
                    opacity: logoOpacities[0],
                    transform: [{ scale: logoScales[0] }],
                  }}
                  resizeMode="contain"
                />
              )}
        </Animated.View>

        {/* title below */}
        <Animated.View style={{ marginTop: 12, opacity: logoOpacities[0] }}>
          <CustomText variant='designTitle' color={colors.white}>{appTitle}</CustomText>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1},
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', width: 220, height: 220, zIndex: 20 },
  title: { marginTop: 12, color: colors.onPrimary, fontSize: 18, fontWeight: '700' },
});

export default SplashScreen;
