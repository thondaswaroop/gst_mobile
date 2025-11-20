import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomIcon, colors } from '../utils/libraryAssets';
import EventsList from '../screens/Events/EventsList';
import EventBookings from '../screens/Events/EventBookings';
import EventProfile from '../screens/Events/EventProfile';

const Tab = createBottomTabNavigator();

const EventTabs = () => (
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
          EventsList: 'calendar-outline',
          EventBookings: 'ticket-outline',
          EventProfile: 'person-outline',
        };
        return <CustomIcon iconName={icons[route.name]} color={color} size={22} />;
      },
    })}
  >
    <Tab.Screen name="EventsList" component={EventsList} options={{ title: 'Events' }} />
    <Tab.Screen name="EventBookings" component={EventBookings} options={{ title: 'Bookings' }} />
    <Tab.Screen name="EventProfile" component={EventProfile} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

export default EventTabs;
