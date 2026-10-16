import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import GameFrame from '../../../components/GameFrame';
import { play, reduceMotion, tap } from '../../../lib/games';
import { colors, fonts, radius } from '../../../lib/theme';

const TINTS = ['rgba(181,206,191,0.55)', 'rgba(190,214,232,0.55)', 'rgba(232,196,172,0.5)', 'rgba(214,200,232,0.5)'];
let nextId = 1;

function Bubble({ b, height, onGone }) {
  const rise = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const popV = useRef(new Animated.Value(0)).current;
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: b.duration, easing: Easing.linear, useNativeDriver: true }).start(({ finished }) => finished && onGone(b.id));
    if (!b.still) {
      Animated.loop(Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }
  }, [b, rise, sway, onGone]);

  function pop() {
    if (popped) return;
    setPopped(true);
    tap('soft');
    play('pop');
    Animated.timing(popV, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => onGone(b.id));
  }

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [height + b.size, -b.size * 1.5] });
  const translateX = sway.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const scale = popV.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const opacity = Animated.multiply(
    popV.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    rise.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
  );

  return (
    <Animated.View style={[s.bubbleWrap, { left: b.x, width: b.size, height: b.size, opacity, transform: [{ translateY }, { translateX }, { scale }] }]}>
      <Pressable onPress={pop} style={[s.bubble, { borderRadius: b.size / 2, backgroundColor: b.tint }]} accessibilityRole="button" accessibilityLabel={b.text ? `Bubble: ${b.text}. Tap to pop` : 'Bubble. Tap to pop'}>
        <View style={[s.shine, { width: b.size * 0.22, height: b.size * 0.14, top: b.size * 0.16, left: b.size * 0.22 }]} />
        {b.text ? <Text style={s.worry} numberOfLines={3}>{b.text}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

export default function WorryBubbles() {
  const { width, height } = useWindowDimensions();
  const [bubbles, setBubbles] = useState([]);
  const [text, setText] = useState('');
  const still = useRef(false);

  const add = (worry = '') => {
    const size = worry ? 150 : 56 + Math.random() * 60;
    setBubbles((cur) => [...cur.slice(-11), {
      id: nextId++, text: worry.slice(0, 60), size, x: Math.max(8, Math.random() * (width - size - 16)),
      tint: TINTS[Math.floor(Math.random() * TINTS.length)], duration: worry ? 16000 : 11000 + Math.random() * 6000, still: still.current,
    }]);
  };

  useEffect(() => {
    reduceMotion().then((r) => { still.current = r; });
    const t = setInterval(() => add(), 2600);
    add();
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gone = (id) => setBubbles((cur) => cur.filter((b) => b.id !== id));

  function release() {
    const w = text.trim();
    if (!w) return;
    add(w);
    setText('');
    tap();
  }

  return (
    <GameFrame
      background="#EEF4F6"
      hint="Tap a bubble to pop it. Or type a worry below and let it float away. Nothing you type is saved."
      footer={
        <View style={s.bar}>
          <TextInput style={s.input} value={text} onChangeText={setText} placeholder="A worry to let go of…" placeholderTextColor="#8FA3A8" onSubmitEditing={release} returnKeyType="send" maxLength={60} />
          <Pressable onPress={release} style={s.release} accessibilityRole="button"><Text style={s.releaseText}>Let it go</Text></Pressable>
        </View>
      }
    >
      {bubbles.map((b) => <Bubble key={b.id} b={b} height={height} onGone={gone} />)}
    </GameFrame>
  );
}

const s = StyleSheet.create({
  bubbleWrap: { position: 'absolute', top: 0 },
  bubble: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', padding: 14 },
  shine: { position: 'absolute', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', transform: [{ rotate: '-30deg' }] },
  worry: { fontFamily: fonts.medium, fontSize: 14, color: '#3F5A60', textAlign: 'center' },
  bar: { flexDirection: 'row', alignSelf: 'stretch', gap: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.pill, padding: 5 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.charcoal, paddingHorizontal: 14 },
  release: { backgroundColor: colors.sage, borderRadius: radius.pill, paddingHorizontal: 16, justifyContent: 'center' },
  releaseText: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
});
