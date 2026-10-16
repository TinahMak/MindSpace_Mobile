import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display/400Regular';
import { DMSerifDisplay_400Regular_Italic } from '@expo-google-fonts/dm-serif-display/400Regular_Italic';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppLockGate from '../components/AppLockGate';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { ready } = useAuth();
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });
  const done = ready && fontsLoaded;

  useEffect(() => {
    if (done) SplashScreen.hideAsync().catch(() => {});
  }, [done]);

  if (!done) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.warmWhite } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="help" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="breathe"
        options={{
          headerShown: true,
          title: 'Breathe with me',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.warmWhite },
          headerTintColor: colors.charcoal,
          headerTitleStyle: { fontFamily: 'DMSans_500Medium', fontSize: 16 },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppLockGate>
            <RootStack />
          </AppLockGate>
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
