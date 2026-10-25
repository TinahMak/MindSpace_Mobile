import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth';
import { homeFor, roleOf } from '../../lib/home';
import { colors, fonts } from '../../lib/theme';

// Admin-only area. Anyone who isn't an admin (as the server says) is sent away.
export default function AdminLayout() {
  const { token, user } = useAuth();
  if (!token) return <Redirect href="/welcome" />;
  if (roleOf(user) !== 'admin') return <Redirect href={homeFor(user)} />;
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
      <Stack.Screen name="user/[id]" options={{ title: 'User' }} />
      <Stack.Screen name="professional/[id]" options={{ title: 'Professional' }} />
      <Stack.Screen name="add-professional" options={{ title: 'Add a professional' }} />
      <Stack.Screen name="admins" options={{ title: 'Admins' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="backup" options={{ title: 'Backups' }} />
    </Stack>
  );
}
