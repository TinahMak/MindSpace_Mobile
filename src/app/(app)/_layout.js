import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth';
import { homeFor, roleOf } from '../../lib/home';
import { colors, fonts } from '../../lib/theme';

export default function AppLayout() {
  const { token, user } = useAuth();
  if (!token) return <Redirect href="/welcome" />;
  // Admin accounts only use the admin area.
  if (roleOf(user) !== 'user') return <Redirect href={homeFor(user)} />;
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
      <Stack.Screen name="conversations" options={{ title: 'Past conversations' }} />
      <Stack.Screen name="weekly" options={{ title: 'Weekly insights' }} />
      <Stack.Screen name="insights" options={{ title: 'Insights' }} />
      <Stack.Screen name="journal/index" options={{ title: 'Journal' }} />
      <Stack.Screen name="journal/edit" options={{ title: 'Journal entry' }} />
      <Stack.Screen name="safety-plan/index" options={{ title: 'My safety plan' }} />
      <Stack.Screen name="safety-plan/edit" options={{ title: 'My safety plan' }} />
      <Stack.Screen name="breathing" options={{ title: 'Breathing' }} />
      <Stack.Screen name="grounding" options={{ title: 'Grounding' }} />
      <Stack.Screen name="games/index" options={{ title: 'Calming games' }} />
      <Stack.Screen name="games/bubbles" options={{ title: 'Worry bubbles' }} />
      <Stack.Screen name="games/leaves" options={{ title: 'Leaves on a stream' }} />
      <Stack.Screen name="games/ripples" options={{ title: 'Ripple pond', headerStyle: { backgroundColor: '#14202B' }, headerTintColor: '#FFFFFF' }} />
      <Stack.Screen name="games/mandala" options={{ title: 'Colour a mandala' }} />
      <Stack.Screen name="games/sand" options={{ title: 'Zen sand garden' }} />
      <Stack.Screen name="games/garden" options={{ title: 'My calm garden' }} />
      <Stack.Screen name="support/[id]" options={{ title: 'Professional' }} />
      <Stack.Screen name="request/[proId]" options={{ title: 'Request a consultation' }} />
      <Stack.Screen name="requests/index" options={{ title: 'My requests' }} />
      <Stack.Screen name="requests/[id]" options={{ title: 'Request' }} />
    </Stack>
  );
}
