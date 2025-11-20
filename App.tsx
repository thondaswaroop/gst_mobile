// App.tsx
import React from 'react';
import { StatusBar, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-toast-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { SnackbarProvider } from './src/components/ui/SnackbarProvider';

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        {/* <SafeAreaView style={{ flex: 1 }} edges={['top']}> */}
        <ToastProvider>
          <SnackbarProvider>
            <SafeAreaView style={{ flex: 1 }} edges={[]}>
              <StatusBar barStyle="light-content" translucent />
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </SafeAreaView>
          </SnackbarProvider>
        </ToastProvider>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
