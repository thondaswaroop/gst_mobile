import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomIcon, colors } from '../utils/libraryAssets';
import MatchesList from '../screens/Dating/Male/MatchesList';
import Inbox from '../screens/Dating/Chat/Inbox';
import CompatibilityTest from '../screens/Dating/Male/CompatibilityTest';

const Tab = createBottomTabNavigator();

const FindMatchTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: true,
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: '#0b0b0f' },
      headerTintColor: '#fff',
      tabBarStyle: {
        backgroundColor: '#0b0b0f',
        borderTopWidth: 0,
        height: 74,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarIcon: ({ color }) => {
        const icons: Record<string, string> = {
          MatchesList: 'heart-outline',
          Inbox: 'chatbubble-ellipses-outline',
          CompatibilityTest: 'speedometer-outline',
        };
        return <CustomIcon iconName={icons[route.name]} color={color} size={22} />;
      },
    })}
  >
    <Tab.Screen name="MatchesList" component={MatchesList} options={{ title: 'Discover' }} />
    <Tab.Screen name="Inbox" component={Inbox} options={{ title: 'Inbox' }} />
    <Tab.Screen name="CompatibilityTest" component={CompatibilityTest} options={{ title: 'Compatibility' }} />
  </Tab.Navigator>
);

export default FindMatchTabs;
