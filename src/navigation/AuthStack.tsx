// src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Intro from '../screens/auth/Intro';
import Login from '../screens/auth/Login';
import ProfileRegistration from '../screens/auth/ProfileRegistration';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator>

      {/* Intro has no header */}
      <Stack.Screen
        name="Intro"
        component={Intro}
        options={{ headerShown: false }}
      />

      {/* Login has no header */}
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />

      {/* Profile Registration SHOULD show the default toolbar */}
      <Stack.Screen
        name="ProfileRegistration"
        component={ProfileRegistration}
        options={{
          title: "Complete Profile",
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />

    </Stack.Navigator>
  );
};

export default AuthStack;
