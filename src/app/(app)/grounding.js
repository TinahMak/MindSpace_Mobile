import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Screen, Small } from '../../components/ui';
import { addCalmPoint } from '../../lib/games';
import { colors, fonts, radius, space } from '../../lib/theme';

const STEPS = [
  { n: 5, sense: 'see', text: 'Look around and name five things you can see. Take your time: a colour, a shape, a small detail.' },
  { n: 4, sense: 'feel', text: 'Notice four things you can feel. Your feet on the floor, your clothes, the air on your skin.' },
  { n: 3, sense: 'hear', text: 'Listen for three things you can hear. Near or far, loud or very quiet.' },
  { n: 2, sense: 'smell', text: "Find two things you can smell. If nothing comes, think of two smells you like." },
  { n: 1, sense: 'taste', text: 'Notice one thing you can taste, or take a sip of water and notice that.' },
];

export default function Grounding() {
  const [i, setI] = useState(0);
  const done = i >= STEPS.length;
  const S = STEPS[i];

  return (
    <Screen edges={[]}>
      <Body muted style={{ marginTop: space(4) }}>When worry or panic takes over, this brings your attention back to right here, right now.</Body>
      <View style={s.dots}>{STEPS.map((_, j) => <View key={j} style={[s.dot, j < i && { backgroundColor: colors.sageLight }, j === i && s.dotOn]} />)}</View>
      {!done ? (
        <View style={s.card}>
          <Text style={s.big}>{S.n}</Text>
          <Text style={s.title}>things you can {S.sense}</Text>
          <Body style={{ textAlign: 'center', marginTop: space(3), fontSize: 16, lineHeight: 25 }}>{S.text}</Body>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.title}>You're here, right now</Text>
          <Body style={{ textAlign: 'center', marginTop: space(3) }}>Take one slow breath. If you still feel overwhelmed, a breathing exercise or talking to someone can help.</Body>
        </View>
      )}
      {!done ? (
        <>
          <Button title={i === STEPS.length - 1 ? 'Finish' : 'Next'} onPress={() => { if (i === STEPS.length - 1) addCalmPoint('grounding'); setI(i + 1); }} style={{ marginTop: space(6) }} />
          {i > 0 ? <Button title="Back" variant="ghost" onPress={() => setI(i - 1)} style={{ marginTop: 4 }} /> : null}
          <Small style={{ textAlign: 'center', marginTop: space(3) }}>No need to rush. Move on when you're ready.</Small>
        </>
      ) : (
        <View style={{ gap: space(3), marginTop: space(6) }}>
          <Button title="Do it again" variant="outline" onPress={() => setI(0)} />
          <Button title="Try a breathing exercise" onPress={() => router.replace('/breathing')} />
          <Button title="Get help now" variant="ghost" onPress={() => router.push('/help')} />
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: space(6) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lightGray },
  dotOn: { backgroundColor: colors.sage, width: 26 },
  card: { marginTop: space(6), padding: space(7), borderRadius: radius.lg, backgroundColor: colors.sageWash, alignItems: 'center' },
  big: { fontFamily: fonts.display, fontSize: 72, lineHeight: 80, color: colors.sageDark },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, textAlign: 'center' },
});
