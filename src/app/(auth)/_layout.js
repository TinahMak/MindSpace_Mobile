import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth';
import { homeFor } from '../../lib/home';
import { colors } from '../../lib/theme';

export default function AuthLayout() {
  const { token, user } = useAuth();
  if (token) return <Redirect href={homeFor(user)} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.warmWhite } }} />;
}
