// navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

/** DATING STACK SCREENS **/
import Inbox from '../screens/Dating/Chat/Inbox';
import ChatRoom from '../screens/Dating/Chat/ChatRoom';
import MatchesList from '../screens/Dating/Male/MatchesList';
import CompatibilityTest from '../screens/Dating/Male/CompatibilityTest';
import MyRequests from '../screens/Dating/Female/MyRequests';
import QuizBuilder from '../screens/Dating/Female/QuizBuilder';

/** SHOP STACK SCREENS **/
import ShopLanding from '../screens/Shop/ShopLanding';
import LocationSelector from '../screens/Shop/LocationSelector';
import ProductList from '../screens/Shop/ProductList';
import ProductDetail from '../screens/Shop/ProductDetail';
import Cart from '../screens/Shop/Cart';
import Checkout from '../screens/Shop/Checkout';

/** PROFILE STACK SCREENS **/
import Profile from '../screens/Common/Profile';
import Settings from '../screens/Common/Settings';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/** DISCOVER STACK (swipe + compatibility) */
const DiscoverStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="MatchesList" component={MatchesList} options={{ title: 'Discover' }} />
    <Stack.Screen name="CompatibilityTest" component={CompatibilityTest} options={{ title: 'Compatibility Test' }} />
  </Stack.Navigator>
);

/** INBOX STACK (chat flow) */
const InboxStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="Inbox" component={Inbox} options={{ title: 'Inbox' }} />
    <Stack.Screen name="ChatRoom" component={ChatRoom} options={{ title: 'Chat' }} />
    <Stack.Screen name="MyRequests" component={MyRequests} options={{ title: 'My Requests' }} />
    <Stack.Screen name="QuizBuilder" component={QuizBuilder} options={{ title: 'Quiz Builder' }} />
  </Stack.Navigator>
);

/** SHOP STACK */
const ShopStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="ShopLanding" component={ShopLanding} options={{ title: 'Shop' }} />
    <Stack.Screen name="LocationSelector" component={LocationSelector} options={{ title: 'Choose Area' }} />
    <Stack.Screen name="ProductList" component={ProductList} options={{ title: 'Products' }} />
    <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ title: 'Product' }} />
    <Stack.Screen name="Cart" component={Cart} options={{ title: 'Cart' }} />
    <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'Checkout' }} />
  </Stack.Navigator>
);

/** PROFILE STACK */
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    <Stack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
  </Stack.Navigator>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabel: ({ color, children }) => (
          <Text style={{ color, fontSize: 12 }}>{children}</Text>
        ),
      }}
    >
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="InboxTab" component={InboxStack} options={{ title: 'Inbox' }} />
      <Tab.Screen name="Shop" component={ShopStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default MainTabs;
