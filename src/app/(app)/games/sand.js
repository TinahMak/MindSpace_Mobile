import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import GameFrame from '../../../components/GameFrame';
import { play, tap } from '../../../lib/games';
import { colors, fonts, radius } from '../../../lib/theme';

const STONES = ['#8E8A82', '#A29C92', '#7D7A74', '#B3ADA3'];

// A rake line: layered strokes give the look of grooves in sand.
function Groove({ d }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} stroke="#D8C7A3" strokeWidth={26} />
      <Path d={d} stroke="#E9DCBF" strokeWidth={19} />
      <Path d={d} stroke="#D3C19B" strokeWidth={12} />
      <Path d={d} stroke="#EDE2C8" strokeWidth={6} />
      <Path d={d} stroke="#D6C49F" strokeWidth={1.6} />
    </G>
  );
}

const toD = (pts) => (pts.length ? `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ') : '');

export default function SandGarden() {
  const { width, height } = useWindowDimensions();
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState([]);
  const [stones, setStones] = useState([]);
  const fade = useRef(new Animated.Value(1)).current;
  const pts = useRef([]);
  const lastSound = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        pts.current = [[Math.round(x), Math.round(y)]];
        setCurrent(pts.current);
        tap('soft');
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const last = pts.current[pts.current.length - 1];
        if (Math.hypot(x - last[0], y - last[1]) < 5) return; // keep it smooth and light
        pts.current = [...pts.current, [Math.round(x), Math.round(y)]];
        setCurrent(pts.current);
        if (Date.now() - lastSound.current > 700) { lastSound.current = Date.now(); play('sand'); }
      },
      onPanResponderRelease: () => {
        if (pts.current.length > 1) setLines((cur) => [...cur.slice(-30), toD(pts.current)]);
        pts.current = [];
        setCurrent([]);
      },
    }),
  ).current;

  function addStone() {
    tap();
    const r = 18 + Math.random() * 22;
    setStones((cur) => [...cur.slice(-7), { x: 40 + Math.random() * (width - 80), y: 120 + Math.random() * (height - 320), rx: r, ry: r * (0.7 + Math.random() * 0.2), c: STONES[cur.length % STONES.length] }]);
  }

  function rake() {
    play('sand');
    Animated.timing(fade, { toValue: 0, duration: 900, useNativeDriver: true }).start(() => {
      setLines([]);
      fade.setValue(1);
    });
  }

  return (
    <GameFrame
      background="#EFE6D4"
      hint="Draw slowly with your finger. Add a stone or two. Rake it smooth whenever you like."
      footer={
        <View style={s.tools}>
          <Pressable onPress={addStone} style={s.tool}><Ionicons name="ellipse" size={14} color="#8E8A82" /><Text style={s.toolText}>Add a stone</Text></Pressable>
          <Pressable onPress={() => { setStones([]); tap(); }} style={s.tool}><Ionicons name="close-outline" size={16} color={colors.sageDark} /><Text style={s.toolText}>Clear stones</Text></Pressable>
          <Pressable onPress={rake} style={s.tool}><Ionicons name="reorder-three-outline" size={18} color={colors.sageDark} /><Text style={s.toolText}>Rake smooth</Text></Pressable>
        </View>
      }
    >
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        <Svg width={width} height={height} pointerEvents="none">
          <Rect x="0" y="0" width={width} height={height} fill="#EFE6D4" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="none">
          <Svg width={width} height={height}>
            {lines.map((d, i) => <Groove key={i} d={d} />)}
            {current.length > 1 ? <Groove d={toD(current)} /> : null}
          </Svg>
        </Animated.View>
        <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
          {stones.map((st, i) => (
            <G key={i}>
              <Ellipse cx={st.x} cy={st.y} rx={st.rx + 18} ry={st.ry + 14} fill="none" stroke="#DCCCA8" strokeWidth={3} />
              <Ellipse cx={st.x} cy={st.y} rx={st.rx + 9} ry={st.ry + 7} fill="none" stroke="#DCCCA8" strokeWidth={3} />
              <Ellipse cx={st.x + 3} cy={st.y + 5} rx={st.rx} ry={st.ry} fill="rgba(0,0,0,0.12)" />
              <Ellipse cx={st.x} cy={st.y} rx={st.rx} ry={st.ry} fill={st.c} />
              <Ellipse cx={st.x - st.rx * 0.3} cy={st.y - st.ry * 0.35} rx={st.rx * 0.35} ry={st.ry * 0.18} fill="rgba(255,255,255,0.28)" />
            </G>
          ))}
        </Svg>
      </View>
    </GameFrame>
  );
}

const s = StyleSheet.create({
  tools: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.85)' },
  toolText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
});
