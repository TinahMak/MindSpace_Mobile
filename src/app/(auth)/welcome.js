import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HelpButton from '../../components/HelpButton';
import { Button } from '../../components/ui';
import { colors, fonts, radius, space } from '../../lib/theme';

const BG = require('../../../assets/media/welcome-bg.jpg');

export default function Welcome() {
  return (
    <ImageBackground source={BG} style={{ flex: 1, backgroundColor: '#1B2A22' }} resizeMode="cover">
      <StatusBar style="light" />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.top}>
          <Text style={s.logo}>MindSpace</Text>
          <HelpButton />
        </View>

        <View style={s.center}>
          <Pressable
            onPress={() => router.push('/breathe')}
            style={({ pressed }) => [s.play, pressed && { transform: [{ scale: 0.97 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Watch a 15-second guided breath"
          >
            <View style={s.playCircle}>
              <Ionicons name="play" size={26} color={colors.sageDark} style={{ marginLeft: 3 }} />
            </View>
            <Text style={s.playText}>Take a 15-second breath</Text>
          </Pressable>
        </View>

        <View>
          <Text style={s.headline}>A quiet place to check in with yourself.</Text>
          <Text style={s.sub}>
            Log how you feel in seconds, talk things through with an AI companion, and see your patterns over time.
          </Text>
          <View style={{ gap: space(3), marginTop: space(7) }}>
            <Button title="Create a free account" onPress={() => router.push('/signup')} />
            <Button title="Log in" variant="light" onPress={() => router.push('/login')} />
          </View>
          <Pressable onPress={() => router.push('/pro-signup')} style={{ alignSelf: 'center', marginTop: space(4) }} hitSlop={8}>
            <Text style={s.proLink}>Are you a mental health professional? <Text style={{ textDecorationLine: 'underline' }}>Join here</Text></Text>
          </Pressable>
          <Text style={s.foot}>MindSpace is a wellness companion, not a substitute for professional care.</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: space(5), paddingBottom: space(3) },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space(3) },
  logo: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: { alignItems: 'center', gap: space(3) },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.white,
    backgroundColor: 'rgba(16,26,20,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  headline: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42, color: colors.white },
  sub: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, color: 'rgba(255,255,255,0.82)', marginTop: space(3) },
  proLink: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.white },
  foot: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: space(4),
  },
});
