import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import GameFrame from '../../../components/GameFrame';
import { play, reduceMotion, tap } from '../../../lib/games';

let nextId = 1;
const RING_COLORS = ['rgba(190,214,232,0.9)', 'rgba(181,206,191,0.85)', 'rgba(214,200,232,0.85)'];

function Ripple({ r, onDone }) {
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(260, rings.map((v) => Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }))).start(() => onDone(r.id));
  }, [r, rings, onDone]);
  return rings.map((v, i) => (
    <Animated.View
      key={i}
      pointerEvents="none"
      style={[s.ring, {
        left: r.x - 60, top: r.y - 60, borderColor: r.color,
        opacity: v.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.9, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 2.6 - i * 0.35] }) }],
      }]}
    />
  ));
}

function Firefly({ w, h, still }) {
  const x = useRef(new Animated.Value(Math.random() * w)).current;
  const y = useRef(new Animated.Value(Math.random() * h * 0.7)).current;
  const glow = useRef(new Animated.Value(Math.random())).current;
  useEffect(() => {
    let alive = true;
    const drift = () => {
      if (!alive || still) return;
      Animated.parallel([
        Animated.timing(x, { toValue: Math.random() * w, duration: 7000 + Math.random() * 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(y, { toValue: Math.random() * h * 0.75, duration: 7000 + Math.random() * 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]).start(drift);
    };
    drift();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1400 + Math.random() * 1200, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.15, duration: 1400 + Math.random() * 1200, useNativeDriver: true }),
    ])).start();
    return () => { alive = false; };
  }, [x, y, glow, w, h, still]);
  return <Animated.View pointerEvents="none" style={[s.fly, { opacity: glow, transform: [{ translateX: x }, { translateY: y }] }]} />;
}

export default function RipplePond() {
  const { width, height } = useWindowDimensions();
  const [ripples, setRipples] = useState([]);
  const [still, setStill] = useState(false);
  useEffect(() => { reduceMotion().then(setStill); }, []);

  function touch(e) {
    const { locationX: x, locationY: y } = e.nativeEvent;
    tap('soft');
    play('drop');
    setRipples((cur) => [...cur.slice(-10), { id: nextId++, x, y, color: RING_COLORS[nextId % RING_COLORS.length] }]);
  }

  return (
    <GameFrame dark background="#14202B" hint="Touch the water. Watch the rings spread, then settle.">
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="pond" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1B2A3A" />
            <Stop offset="0.55" stopColor="#1C3440" />
            <Stop offset="1" stopColor="#1F3F3E" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#pond)" />
      </Svg>
      {Array.from({ length: 9 }).map((_, i) => <Firefly key={i} w={width} h={height} still={still} />)}
      <Pressable style={StyleSheet.absoluteFill} onPressIn={touch} accessibilityLabel="Pond. Touch to make ripples">
        <View style={StyleSheet.absoluteFill}>
          {ripples.map((r) => <Ripple key={r.id} r={r} onDone={(id) => setRipples((cur) => cur.filter((x) => x.id !== id))} />)}
        </View>
      </Pressable>
    </GameFrame>
  );
}

const s = StyleSheet.create({
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1.5 },
  fly: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#F4E7A1', shadowColor: '#F4E7A1', shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
});
