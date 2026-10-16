import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '../lib/theme';

// The website shows "Get help now" on every page. The app does the same:
// this pill sits in the top corner of every main screen.
export default function HelpButton({ style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get help now"
      onPress={() => router.push('/help')}
      style={({ pressed }) => [s.pill, pressed && { opacity: 0.85 }, style]}
      hitSlop={6}
    >
      <Ionicons name="heart" size={13} color={colors.white} />
      <Text style={s.text}>Get help now</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.terra,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.white },
});
