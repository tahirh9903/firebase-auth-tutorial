import { useEffect, useState } from 'react';
import { Slot, Stack } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricAuth from './components/BiometricAuth';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if biometric is enabled in settings
        const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
        if (biometricEnabled === 'true') {
          setShowBiometric(true);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBiometricSuccess = async () => {
    setIsAuthenticated(true);
    setShowBiometric(false);
  };

  const handleBiometricSkip = async () => {
    setIsAuthenticated(true);
    setShowBiometric(false);
  };

  if (initializing) {
    return null;
  }

  if (showBiometric) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <BiometricAuth
            onAuthenticate={handleBiometricSuccess}
            onSkip={handleBiometricSkip}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="tabs" />
      </Stack>
    </GestureHandlerRootView>
  );
}
