import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Screen, Small } from '../../../components/ui';
import { loadPrefs, play, savePrefs } from '../../../lib/games';
import { colors, fonts, radius, space } from '../../../lib/theme';

const GAMES = [
  { href: '/games/bubbles', icon: 'ellipse-outline', tint: '#DCEBF2', title: 'Worry bubbles', text: 'Put a worry in a bubble, then pop it and let it go.' },
  { href: '/games/leaves', icon: 'leaf-outline', tint: '#F3E4D2', title: 'Leaves on a stream', text: 'Place thoughts on leaves and watch them drift away.' },
  { href: '/games/ripples', icon: 'water-outline', tint: '#D9E0EE', title: 'Ripple pond', text: 'Touch the water and watch soft rings spread and fade.' },
  { href: '/games/mandala', icon: 'color-palette-outline', tint: '#EFE0EC', title: 'Colour a mandala', text: 'Fill in a gentle pattern, one tap at a time.' },
  { href: '/games/sand', icon: 'brush-outline', tint: '#EFE6D4', title: 'Zen sand garden', text: 'Draw lines in the sand, place stones, rake it smooth.' },
  { href: '/games/garden', icon: 'flower-outline', tint: colors.sageWash, title: 'My calm garden', text: 'A plant that grows as you look after yourself. It never wilts.' },
];

export default function Games() {
  const [prefs, setPrefs] = useState({ sound: false, vibration: true });
  useEffect(() => { loadPrefs().then((p) => setPrefs({ ...p })); }, []);

  async function change(k, v) {
    const p = await savePrefs({ [k]: v });
    setPrefs({ ...p });
    if (k === 'sound' && v) play('chime');
  }

  return (
    <Screen edges={[]}>
      <Small style={{ marginTop: space(4), marginBottom: space(4) }}>No scores, no timers, nothing to win or lose. Stay as long as you like.</Small>
      <View style={{ gap: space(3) }}>
        {GAMES.map((g) => (
          <Pressable key={g.href} onPress={() => router.push(g.href)} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <View style={[s.icon, { backgroundColor: g.tint }]}><Ionicons name={g.icon} size={24} color={colors.sageDark} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{g.title}</Text>
              <Text style={s.text}>{g.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
          </Pressable>
        ))}
      </View>
      <Card tone="cream" style={{ marginTop: space(6) }}>
        <View style={s.row}>
          <View style={{ flex: 1 }}><Text style={s.title}>Soft sounds</Text><Small>Off by default. Follows your phone's silent switch.</Small></View>
          <Switch value={prefs.sound} onValueChange={(v) => change('sound', v)} trackColor={{ true: colors.sage, false: colors.lightGray }} thumbColor={colors.white} />
        </View>
        <View style={[s.row, { marginTop: space(4) }]}>
          <View style={{ flex: 1 }}><Text style={s.title}>Gentle vibration</Text><Small>A light tap when you touch things.</Small></View>
          <Switch value={prefs.vibration} onValueChange={(v) => change('vibration', v)} trackColor={{ true: colors.sage, false: colors.lightGray }} thumbColor={colors.white} />
        </View>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: space(4), borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.charcoal },
  text: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.midGray, marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
