import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import Select from '../../components/Select';
import { Body, Button, Screen, Small } from '../../components/ui';
import { addCalmPoint } from '../../lib/games';
import { colors, fonts, space } from '../../lib/theme';

// Each pattern: list of [phase label, seconds, target scale]
const PATTERNS = {
  calm: { label: 'Calm breathing (4 in, 6 out)', about: 'A longer out-breath helps your body relax. Good for any time.', steps: [['Breathe in', 4, 1], ['Breathe out', 6, 0.55]] },
  box: { label: 'Box breathing (4-4-4-4)', about: 'Steady and even. Helpful when you feel anxious or before something stressful.', steps: [['Breathe in', 4, 1], ['Hold', 4, 1], ['Breathe out', 4, 0.55], ['Hold', 4, 0.55]] },
  478: { label: '4-7-8 breathing', about: 'In for 4, hold for 7, out for 8. Many people use it to wind down before sleep.', steps: [['Breathe in', 4, 1], ['Hold', 7, 1], ['Breathe out', 8, 0.55]] },
};
const ROUNDS = [['3', '3 rounds (about 1 minute)'], ['5', '5 rounds'], ['8', '8 rounds']];

export default function Breathing() {
  const [pattern, setPattern] = useState('calm');
  const [rounds, setRounds] = useState('5');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState({ label: 'Ready when you are', secs: 0, round: 0 });
  const [done, setDone] = useState(false);
  const scale = useRef(new Animated.Value(0.55)).current;
  const stop = useRef(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); return () => { stop.current = true; }; }, []);

  async function run() {
    stop.current = false;
    setDone(false);
    setRunning(true);
    const P = PATTERNS[pattern].steps;
    for (let r = 1; r <= Number(rounds) && !stop.current; r++) {
      for (const [label, secs, to] of P) {
        if (stop.current) break;
        Haptics.selectionAsync().catch(() => {});
        if (!reduce) Animated.timing(scale, { toValue: to, duration: secs * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
        for (let t = secs; t > 0 && !stop.current; t--) {
          setPhase({ label, secs: t, round: r });
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }
    setRunning(false);
    if (!stop.current) { setDone(true); setPhase({ label: 'Well done', secs: 0, round: 0 }); addCalmPoint('breathing'); }
    Animated.timing(scale, { toValue: 0.55, duration: 800, useNativeDriver: true }).start();
  }

  function halt() {
    stop.current = true;
    setRunning(false);
    setPhase({ label: 'Paused', secs: 0, round: 0 });
  }

  return (
    <Screen edges={[]}>
      {!running ? (
        <View style={{ marginTop: space(4) }}>
          <Select label="Exercise" value={pattern} options={Object.entries(PATTERNS).map(([v, p]) => ({ value: v, label: p.label }))} onChange={setPattern} />
          <Small style={{ marginTop: -space(2), marginBottom: space(4) }}>{PATTERNS[pattern].about}</Small>
          <Select label="Length" value={rounds} options={ROUNDS.map(([v, l]) => ({ value: v, label: l }))} onChange={setRounds} />
        </View>
      ) : null}

      <View style={s.stage}>
        <Animated.View style={[s.circle, { transform: [{ scale }] }]} />
        <View style={s.center}>
          <Text style={s.phase} accessibilityLiveRegion="polite">{phase.label}</Text>
          {phase.secs ? <Text style={s.secs}>{phase.secs}</Text> : null}
        </View>
      </View>
      {running ? <Small style={{ textAlign: 'center' }}>Round {phase.round} of {rounds}</Small> : null}
      {done ? <Body muted style={{ textAlign: 'center' }}>Notice how you feel now. You can repeat this any time.</Body> : null}

      <Button title={running ? 'Stop' : done ? 'Go again' : 'Start'} variant={running ? 'outline' : 'primary'} onPress={running ? halt : run} style={{ marginTop: space(6) }} />
      {!running ? <Small style={{ textAlign: 'center', marginTop: space(3) }}>If you feel dizzy, stop and breathe normally.</Small> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  stage: { height: 280, alignItems: 'center', justifyContent: 'center', marginTop: space(4) },
  circle: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: colors.sageLight, opacity: 0.55 },
  center: { alignItems: 'center' },
  phase: { fontFamily: fonts.display, fontSize: 28, color: colors.sageDark, textAlign: 'center' },
  secs: { fontFamily: fonts.body, fontSize: 40, color: colors.charcoal, marginTop: 4 },
});
