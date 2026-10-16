import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth';
import { homeFor, roleOf } from '../../lib/home';
import { colors, fonts } from '../../lib/theme';

export default function ProLayout() {
  const { token, user } = useAuth();
  if (!token) return <Redirect href="/welcome" />;
  if (roleOf(user) !== 'professional') return <Redirect href={homeFor(user)} />;
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.warmWhite },
        headerTintColor: colors.charcoal,
        headerTitleStyle: { fontFamily: fonts.medium, fontSize: 16 },
        contentStyle: { backgroundColor: colors.warmWhite },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="quote/[id]" options={{ title: 'Consultation request' }} />
    </Stack>
  );
}
