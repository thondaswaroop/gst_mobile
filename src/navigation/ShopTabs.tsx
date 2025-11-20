import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomIcon, colors } from '../utils/libraryAssets';

import ShopHome from '../screens/Shop/ShopHome';
import Cart from '../screens/Shop/Cart';
import ShopProfile from '../screens/Shop/ShopProfile';

const Tab = createBottomTabNavigator();

/** ----------- Custom pill tab bar (like your screenshot) ----------- */
const PillTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: Math.max(insets.bottom - 4, 8) },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // label
        const label =
          options.tabBarLabel !== undefined
            ? (options.tabBarLabel as string)
            : options.title !== undefined
            ? (options.title as string)
            : route.name;

        // icon mapping
        const iconName = (() => {
          switch (route.name) {
            case 'ShopHome':
              return isFocused ? 'bag' : 'bag-outline';
            case 'Cart':
              return isFocused ? 'cart' : 'cart-outline';
            default:
              return isFocused ? 'person' : 'person-outline';
          }
        })();

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.pill, isFocused && styles.pillActive]}
          >
            <CustomIcon
              iconName={iconName as any}
              size={18}
              color={isFocused ? colors.white : '#d2d2d7'}
            />
            {isFocused && <Text style={styles.pillText}>{label}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ShopTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        // Header like screenshot: dark, centered, with a back button
        headerShown: true,
        headerTitle: 'Shop',
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#0b0b0f' },
        headerTintColor: '#fff',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CustomIcon iconName="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        ),
        // Use our custom pill tabbar
        tabBarShowLabel: false,
        tabBarStyle: { display: 'none' }, // hidden because we render our own
      })}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tab.Screen
        name="ShopHome"
        component={ShopHome}
        options={{ title: 'Shop' }}
      />
      <Tab.Screen
        name="Cart"
        component={Cart}
        options={{ title: 'Cart' }}
      />
      <Tab.Screen
        name="ShopProfile"
        component={ShopProfile}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default ShopTabs;

const styles = StyleSheet.create({
  // pill container
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 8,
    height: 74,
    backgroundColor: '#0b0b0f',
    borderRadius: 28,
    borderTopWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  pillActive: {
    backgroundColor: '#1b1b22',
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  backBtn: {
    marginLeft: Platform.select({ ios: 6, android: 10 }),
    backgroundColor: '#1b1b22',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
