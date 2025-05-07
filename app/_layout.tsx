import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebaseConfig';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <AuthProvider>
      <AccessibilityProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </GestureHandlerRootView>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
