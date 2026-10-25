import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Select from '../../components/Select';
import { Body, Button, Screen, Small } from '../../components/ui';
import {
  createBreathSession,
  loadBreathSoundPref,
  loadBreathVoicePref,
  saveBreathSoundPref,
  saveBreathVoicePref,
} from '../../lib/breathSound';
import { addCalmPoint } from '../../lib/games';
import { colors, fonts, radius, space } from '../../lib/theme';

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
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const scale = useRef(new Animated.Value(0.55)).current;
  const stop = useRef(false);
  const soundOnRef = useRef(true);
  const voiceOnRef = useRef(true);
  const audio = useRef(null);
  const endTimer = useRef(null);
  const runId = useRef(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    audio.current = createBreathSession();
    loadBreathSoundPref().then((on) => {
      setSoundOn(on);
      soundOnRef.current = on;
      audio.current?.setTones(on);
    });
    loadBreathVoicePref().then((on) => {
      setVoiceOn(on);
      voiceOnRef.current = on;
      audio.current?.setVoice(on);
    });
    return () => {
      stop.current = true;
      clearTimeout(endTimer.current);
      audio.current?.end();
      audio.current?.release();
    };
  }, []);

  const anySound = () => soundOnRef.current || voiceOnRef.current;

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    saveBreathSoundPref(next);
    audio.current?.setTones(next);
    if (running) (anySound() ? audio.current?.begin() : audio.current?.end());
  }

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    voiceOnRef.current = next;
    saveBreathVoicePref(next);
    audio.current?.setVoice(next);
    if (running) (anySound() ? audio.current?.begin() : audio.current?.end());
  }

  async function run() {
    // Each session gets an id, so a session that was stopped can never keep
    // ticking (or making sound) alongside a new one started right after.
    const id = ++runId.current;
    const stopped = () => stop.current || id !== runId.current;
    stop.current = false;
    clearTimeout(endTimer.current);
    setDone(false);
    setRunning(true);
    if (anySound()) await audio.current?.begin();
    const P = PATTERNS[pattern].steps;
    for (let r = 1; r <= Number(rounds) && !stopped(); r++) {
      for (const [label, secs, to] of P) {
        if (stopped()) break;
        Haptics.selectionAsync().catch(() => {});
        audio.current?.phase(label, secs);
        if (!reduce) Animated.timing(scale, { toValue: to, duration: secs * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
        for (let t = secs; t > 0 && !stopped(); t--) {
          setPhase({ label, secs: t, round: r });
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }
    if (id !== runId.current) return; // a newer session has taken over
    setRunning(false);
    if (!stopped()) {
      setDone(true);
      setPhase({ label: 'Well done', secs: 0, round: 0 });
      addCalmPoint('breathing');
      if (anySound()) {
        audio.current?.finish();
        // let the closing chime ring out before handing audio back
        endTimer.current = setTimeout(() => audio.current?.end(), 4600);
      }
    }
    Animated.timing(scale, { toValue: 0.55, duration: 800, useNativeDriver: true }).start();
  }

  function halt() {
    stop.current = true;
    clearTimeout(endTimer.current);
    audio.current?.end();
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

      <View style={s.toggles}>
        <Pressable
          onPress={toggleSound}
          accessibilityRole="switch"
          accessibilityState={{ checked: soundOn }}
          accessibilityLabel="Calm tones"
          style={[s.toggle, !soundOn && s.toggleOff]}
        >
          <Ionicons name={soundOn ? 'musical-notes-outline' : 'volume-mute-outline'} size={17} color={soundOn ? colors.sageDark : colors.midGray} />
          <Text style={[s.toggleText, !soundOn && { color: colors.midGray }]}>{soundOn ? 'Tones on' : 'Tones off'}</Text>
        </Pressable>
        <Pressable
          onPress={toggleVoice}
          accessibilityRole="switch"
          accessibilityState={{ checked: voiceOn }}
          accessibilityLabel="Voice guide"
          style={[s.toggle, !voiceOn && s.toggleOff]}
        >
          <Ionicons name={voiceOn ? 'chatbubble-ellipses-outline' : 'chatbubble-outline'} size={17} color={voiceOn ? colors.sageDark : colors.midGray} />
          <Text style={[s.toggleText, !voiceOn && { color: colors.midGray }]}>{voiceOn ? 'Voice on' : 'Voice off'}</Text>
        </Pressable>
      </View>

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
      {!running ? (
        <Small style={{ textAlign: 'center', marginTop: space(3) }}>
          {soundOn || voiceOn ? 'You can close your eyes. ' : ''}
          {soundOn ? 'Bells going up: breathe in. Bells going down: breathe out. One low bell: hold. ' : ''}
          If you feel dizzy, stop and breathe normally.
        </Small>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  toggles: { flexDirection: 'row', justifyContent: 'center', gap: space(2), marginTop: space(3) },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.sageWash,
  },
  toggleOff: { backgroundColor: colors.cream },
  toggleText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
  stage: { height: 280, alignItems: 'center', justifyContent: 'center', marginTop: space(4) },
  circle: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: colors.sageLight, opacity: 0.55 },
  center: { alignItems: 'center' },
  phase: { fontFamily: fonts.display, fontSize: 28, color: colors.sageDark, textAlign: 'center' },
  secs: { fontFamily: fonts.body, fontSize: 40, color: colors.charcoal, marginTop: 4 },
});
