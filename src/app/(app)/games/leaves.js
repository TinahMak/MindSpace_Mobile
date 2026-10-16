import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import GameFrame from '../../../components/GameFrame';
import { play, reduceMotion, tap } from '../../../lib/games';
import { colors, fonts, radius } from '../../../lib/theme';

const LEAF_COLORS = ['#C98F5A', '#D9A66B', '#9DB58A', '#C7824F', '#B7C48A', '#D6B26E'];
let nextId = 1;

function LeafShape({ color, size }) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 100 62">
      <Path d="M4 31 C 22 2, 70 -2, 96 31 C 70 64, 22 60, 4 31 Z" fill={color} />
      <Path d="M8 31 L 92 31 M 30 31 L 44 18 M 30 31 L 44 44 M 55 31 L 68 19 M 55 31 L 68 43" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none" />
    </Svg>
  );
}

function Leaf({ leaf, height, streamX, onGone }) {
  const flow = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flow, { toValue: 1, duration: leaf.duration, easing: Easing.linear, useNativeDriver: true }).start(({ finished }) => finished && onGone(leaf.id));
    if (!leaf.still) {
      Animated.loop(Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }
  }, [leaf, flow, wobble, onGone]);

  function nudge() {
    tap('soft');
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }

  const w = leaf.text ? 150 : 70;
  const translateY = flow.interpolate({ inputRange: [0, 1], outputRange: [-120, height + 60] });
  const translateX = wobble.interpolate({ inputRange: [0, 1], outputRange: [streamX + leaf.offset - 26, streamX + leaf.offset + 26] });
  const rotate = Animated.add(wobble, spin).interpolate({ inputRange: [0, 1, 2], outputRange: [`${leaf.angle - 12}deg`, `${leaf.angle + 12}deg`, `${leaf.angle + 372}deg`] });

  return (
    <Animated.View style={[s.leaf, { transform: [{ translateX }, { translateY }] }]}>
      <Pressable onPress={nudge} accessibilityRole="button" accessibilityLabel={leaf.text ? `Leaf carrying: ${leaf.text}` : 'A leaf'}>
        <Animated.View style={{ transform: [{ rotate }], marginLeft: -w / 2 }}>
          <LeafShape color={leaf.color} size={w} />
        </Animated.View>
        {leaf.text ? (
          <View style={[s.textWrap, { width: w, marginLeft: -w / 2 }]} pointerEvents="none">
            <Text style={s.thought} numberOfLines={2}>{leaf.text}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function FlowLine({ x, height, delay, still }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    Animated.loop(Animated.timing(v, { toValue: 1, duration: 5200, delay, easing: Easing.linear, useNativeDriver: true })).start();
  }, [v, delay, still]);
  return (
    <Animated.View pointerEvents="none" style={[s.flow, { left: x, opacity: 0.35, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-80, height] }) }] }]} />
  );
}

export default function LeavesOnAStream() {
  const { width, height } = useWindowDimensions();
  const [leaves, setLeaves] = useState([]);
  const [text, setText] = useState('');
  const [still, setStill] = useState(false);
  const streamX = width / 2;

  const add = (thought = '') => {
    setLeaves((cur) => [...cur.slice(-9), {
      id: nextId++, text: thought.slice(0, 50), color: LEAF_COLORS[nextId % LEAF_COLORS.length],
      offset: (Math.random() - 0.5) * width * 0.28, angle: Math.random() * 60 - 30,
      duration: thought ? 20000 : 15000 + Math.random() * 6000, still,
    }]);
  };

  useEffect(() => {
    reduceMotion().then(setStill);
    add();
    const t = setInterval(() => add(), 3400);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function place() {
    const t = text.trim();
    if (!t) return;
    add(t);
    setText('');
    tap();
    play('chime');
  }

  const bank = width * 0.14;
  return (
    <GameFrame
      background="#DCE6D2"
      hint="Notice a thought, place it on a leaf, and let the stream carry it away. You don't have to hold on to it."
      footer={
        <View style={s.bar}>
          <TextInput style={s.input} value={text} onChangeText={setText} placeholder="A thought to place on a leaf…" placeholderTextColor="#7E8F79" onSubmitEditing={place} returnKeyType="done" maxLength={50} />
          <Pressable onPress={place} style={s.go} accessibilityRole="button"><Text style={s.goText}>Place</Text></Pressable>
        </View>
      }
    >
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="water" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#8FB7BF" />
            <Stop offset="0.5" stopColor="#A9CDD2" />
            <Stop offset="1" stopColor="#8FB7BF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="#DCE6D2" />
        <Path
          d={`M ${bank} 0 C ${bank - 30} ${height * 0.3}, ${bank + 40} ${height * 0.6}, ${bank} ${height} L ${width - bank} ${height} C ${width - bank + 40} ${height * 0.6}, ${width - bank - 30} ${height * 0.3}, ${width - bank} 0 Z`}
          fill="url(#water)"
        />
      </Svg>
      {[0.3, 0.45, 0.55, 0.7].map((f, i) => <FlowLine key={i} x={width * f} height={height} delay={i * 1300} still={still} />)}
      {leaves.map((l) => <Leaf key={l.id} leaf={l} height={height} streamX={streamX} onGone={(id) => setLeaves((cur) => cur.filter((x) => x.id !== id))} />)}
    </GameFrame>
  );
}

const s = StyleSheet.create({
  leaf: { position: 'absolute', left: 0, top: 0 },
  textWrap: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 20 },
  thought: { fontFamily: fonts.medium, fontSize: 12.5, color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 3 },
  flow: { position: 'absolute', top: 0, width: 2, height: 60, borderRadius: 1, backgroundColor: '#FFFFFF' },
  bar: { flexDirection: 'row', alignSelf: 'stretch', gap: 8, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radius.pill, padding: 5 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.charcoal, paddingHorizontal: 14 },
  go: { backgroundColor: colors.sageDark, borderRadius: radius.pill, paddingHorizontal: 18, justifyContent: 'center' },
  goText: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
});
