import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addCalmPoint, loadPrefs } from '../lib/games';
import { fonts, radius, space } from '../lib/theme';

/**
 * Full-screen wrapper for a calming game: a quiet hint at the top and a
 * gentle "How do you feel now?" at the bottom. Never a score or timer.
 */
export default function GameFrame({ children, hint, dark, background, footer, noPoint }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    loadPrefs();
    if (!noPoint) addCalmPoint('game');
  }, [noPoint]);
  const fg = dark ? 'rgba(255,255,255,0.85)' : 'rgba(44,44,44,0.75)';
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: background }]}>
      {children}
      {hint ? (
        <View pointerEvents="none" style={[s.hint, { top: space(3) }]}>
          <Text style={[s.hintText, { color: fg }]}>{hint}</Text>
        </View>
      ) : null}
      <View style={[s.bottom, { paddingBottom: insets.bottom + space(3) }]} pointerEvents="box-none">
        {footer}
        <Pressable onPress={() => router.navigate('/today')} style={[s.feel, { backgroundColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)' }]} accessibilityRole="button">
          <Text style={[s.feelText, { color: fg }]}>How do you feel now? Check in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hint: { position: 'absolute', left: space(5), right: space(5), alignItems: 'center' },
  hintText: { fontFamily: fonts.body, fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: space(3), paddingHorizontal: space(4) },
  feel: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill },
  feelText: { fontFamily: fonts.medium, fontSize: 13 },
});
