// src/navigation/MainTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomIcon, CustomText, colors } from '../utils/libraryAssets';

import Home from '../screens/Home';
import Profile from '../screens/Profile';
import BookingsList from '../screens/BookingsList';

const Tab = createBottomTabNavigator();

/* Compact header */
const CompactHeader: React.FC<BottomTabHeaderProps> = ({ route, options }) => {
  const title = (options.headerTitle as string) ?? (options.title as string) ?? route.name;
  return (
    <View style={headerStyles.container}>
      {/* <Text numberOfLines={1} style={headerStyles.title}>{title}</Text> */}
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

/* Bottom bar with compact height + active circle */
const CircleTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={tabStyles.wrap}>
      <View
        style={[
          tabStyles.bar,
          {
            // minimal vertical padding; add safe-area but cap it so bar doesn’t look tall
            paddingBottom: Math.min(Math.max(insets.bottom, 6), 12),
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconName = (() => {
            switch (route.name) {
              case 'Home':     return isFocused ? 'home'     : 'home-outline';
              case 'Bookings': return isFocused ? 'calendar' : 'calendar-outline';
              case 'Profile':  return isFocused ? 'person'   : 'person-outline';
              default:         return 'ellipse-outline';
            }
          })();

          const label = (options.tabBarLabel as string) ?? (options.title as string) ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.85} style={tabStyles.item}>
              <View style={[tabStyles.circle, isFocused && tabStyles.circleActive]}>
                <CustomIcon
                  iconName={iconName as any}
                  size={18}
                  color={isFocused ? colors.primary : '#fff'}
                />
              </View>
              <CustomText
                variant="link"
                style={[tabStyles.label, { color: isFocused ? colors.highlightYellow : '#fff' }]}
              >
                {label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
  },
  bar: {
    backgroundColor: colors.primary,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,

    // subtle top shadow
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  circle: {
    width: 30, height: 30, borderRadius: '50%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleActive: {
    backgroundColor: colors.white,
    color:colors.brandGreen,
    borderRadius: '50%',
  },
  label: { fontSize: 11, fontWeight: '600',color:colors.white },
});

/* Main tabs */
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      header: (props) => <CompactHeader {...props} />,
      headerTitleAlign: 'center',
      tabBarShowLabel: false,
      tabBarStyle: { display: 'none' }, // we render custom
    }}
    tabBar={(props) => <CircleTabBar {...props} />}
  >
    <Tab.Screen name="Home" component={Home} options={{ title: 'Home' }} />
    <Tab.Screen name="Bookings" component={BookingsList} options={{ title: 'Bookings' }} />
    <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

export default MainTabs;
