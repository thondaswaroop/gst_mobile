// src/screens/auth/Intro.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Swiper from 'react-native-swiper';
import { useNavigation } from '@react-navigation/native';

import colors from '../../constants/colors';
import { CustomText, Button } from '../../utils/libraryAssets';
import { Images } from '../../utils/resources';
import { spacing, fontSizes } from '../../styles/default';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Search routes & pick your trip',
    subtitle:
      'Enter origin, destination and travel date — compare available buses and schedules to choose the best option for you.',
    image: Images.onboarding1,
  },
  {
    key: '2',
    title: 'Choose seats and service',
    subtitle:
      'Select your preferred seat and choose the service either a relay or direct service.',
    image: Images.onboarding2,
  },
  {
    key: '3',
    title: 'Pay & get e-ticket instantly',
    subtitle:
      'Secure payment and instant e-ticket generation. Track your bus in real time and receive status updates during the trip.',
    image: Images.onboarding3,
  },
];

type Nav = { navigate: (screen: string, params?: any) => void; replace: (s: string, p?: any) => void };

const TOP_SPACER = Platform.OS === 'ios' ? 100 : 70;
const BOTTOM_SAFE = Platform.OS === 'ios' ? 60 : 50;

const Intro: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const swiperRef = useRef<any>(null);
  const [index, setIndex] = useState<number>(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Animated values for image fade per slide
  const fadeAnims = useRef(slides.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Preload images for smoother transitions; if no remote URIs, mark loaded
    setImagesLoaded(true);
  }, []);

  useEffect(() => {
    fadeAnims.forEach((a, i) => {
      a.setValue(i === index ? 0.85 : 0.6);
    });
    Animated.timing(fadeAnims[index], {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [index, fadeAnims]);

  const goLogin = () => navigation.navigate('Login');
  const goRegister = () => navigation.navigate('Login');

  const jumpTo = (i: number) => {
    if (swiperRef.current && typeof swiperRef.current.scrollBy === 'function') {
      swiperRef.current.scrollBy(i - index, true);
    } else {
      setIndex(i);
    }
  };

  const onContinue = async () => {
    if (index < slides.length - 1) {
      jumpTo(index + 1);
    } else {
      // mark intro seen before leaving
      try {
        await AsyncStorage.setItem('introSeen', 'true');
      } catch (e) {
        // ignore write errors
      }
      navigation.replace('Login');
    }
  };

  if (!imagesLoaded) {
    return (
      <View style={[styles.loadingWrap]}>
        <ActivityIndicator size="large" color={colors.highlightYellow} />
      </View>
    );
  }

  return (
    <LinearGradient colors={colors.gradientPrimary} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

        <View style={styles.progressWrapper}>
          <View style={styles.progressRow}>
            {slides.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => jumpTo(i)} activeOpacity={0.85}>
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.swiperContainer}>
          <Swiper
            ref={swiperRef}
            loop={false}
            showsPagination={false}
            onIndexChanged={(idx: number) => setIndex(idx)}
            index={index}
            containerStyle={{ flex: 1 }}
            scrollEnabled
            loadMinimal={false as any}
            removeClippedSubviews={false as any}
          >
            {slides.map((s, idx) => (
              <View key={s.key} style={styles.slide}>
                <View style={styles.textBlock}>
                  <CustomText variant="title" style={styles.heading}>
                    {s.title}
                  </CustomText>
                  <CustomText variant="subtitle" style={styles.subheading}>
                    {s.subtitle}
                  </CustomText>
                </View>

                <Animated.View style={{ opacity: fadeAnims[idx], alignSelf: 'center' }}>
                  <Image source={s.image} style={styles.image} resizeMode="contain" />
                </Animated.View>

                <View style={styles.bottomBlock}>
                  <Button
                    title={idx < slides.length - 1 ? 'Continue' : 'Get Started'}
                    onPress={onContinue}
                    fullWidth
                    size="custom"
                  />

                  <View style={styles.footerRow}>
                    <CustomText variant="small" style={styles.footerText}>
                      Don't have an account?
                    </CustomText>

                    <TouchableOpacity onPress={goRegister} activeOpacity={0.85}>
                      <CustomText variant="caption" style={styles.registerLink}>
                        {' '}
                        Register Account
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </Swiper>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.brandNavy },

  progressWrapper: {
    paddingTop: TOP_SPACER,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  progressRow: {
    width: '55%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dot: {
    width: 60,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.textLight,
    opacity: 0.22,
  },
  dotActive: {
    width: 70,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.onPrimary,
    opacity: 1,
  },

  swiperContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  textBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    color: colors.onPrimary,
    marginBottom: 8,
  },
  subheading: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textLight,
    maxWidth: width * 0.84,
  },

  image: {
    width: width * 0.90,
    height: height * 0.42,
    marginVertical: spacing.xl,
    borderRadius: 12,
  },

  bottomBlock: {
    width: '95%',
    alignItems: 'center',
    marginBottom: BOTTOM_SAFE,
  },

  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textLight,
  },
  registerLink: {
    color: colors.onPrimary,
    marginLeft: 2,
  },
});

export default Intro;
