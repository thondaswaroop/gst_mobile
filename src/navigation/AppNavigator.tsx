// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useNavigation } from '@react-navigation/native';
import { CustomIcon, colors } from '../utils/libraryAssets';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import RecordsList from '../screens/RecordsList';
import SeatLayout from '../screens/SeatLayout';
import SplashScreen from '../screens/auth/SplashScreen';

const Stack = createNativeStackNavigator();

const CustomHeader = ({
  title,
  subtitle,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}) => {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={colors.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerContainer}
    >
      <View style={styles.headerRow}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <CustomIcon iconName="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        <View style={{ width: 36 }} />
      </View>
    </LinearGradient>
  );
};

const AppNavigator = () => {
  // keep Redux available if you need it elsewhere (not required for registration)
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const isAuthed = isAuthenticated;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Splash is always available at root so it can decide where to go */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Auth stack (Intro, Login) */}
      <Stack.Screen name="Auth" component={AuthStack} />

      {/* Main app */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* App screens that live above tabs */}
      <Stack.Screen
        name="Records"
        component={RecordsList}
        options={{
          header: () => (
            <CustomHeader
              title="Available Vehicles"
              subtitle="Choose from buses, cabs, or helicopters"
            />
          ),
        }}
      />

      <Stack.Screen
        name="SeatLayout"
        component={SeatLayout}
        options={{
          header: () => (
            <CustomHeader
              title="Choose Your Seat"
              subtitle="Select your preferred seat to continue"
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 52 : 26,
    paddingBottom: 16,
    paddingHorizontal: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#f5f5f5',
    opacity: 0.85,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 2,
  },
});
