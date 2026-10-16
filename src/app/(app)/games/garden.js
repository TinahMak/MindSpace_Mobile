import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import GameFrame from '../../../components/GameFrame';
import { getCalmPoints, reduceMotion } from '../../../lib/games';
import { colors, fonts, radius, space } from '../../../lib/theme';

const STAGES = [
  'A seed, resting in the soil.', 'A first little sprout.', 'Two small leaves.', 'Growing steadily.', 'Reaching for the light.',
  'Strong and green.', 'A first bud appears.', 'Your first flower.', 'Flowers opening.', 'In full bloom.', 'A butterfly visits.', 'A flourishing garden.',
];

function Plant({ stage }) {
  const H = 300;
  const stemTop = H - 60 - Math.min(stage, 9) * 21;
  const leaves = Math.min(stage, 8);
  const flowers = Math.max(0, Math.min(stage - 6, 5));
  const stem = `M 150 ${H - 60} C 144 ${(H - 60 + stemTop) / 2 + 20}, 158 ${(H - 60 + stemTop) / 2 - 20}, 150 ${stemTop}`;
  const petals = (cx, cy, r, c) =>
    [0, 72, 144, 216, 288].map((a) => {
      const rad = (a * Math.PI) / 180;
      return <Ellipse key={a} cx={cx + Math.cos(rad) * r} cy={cy + Math.sin(rad) * r} rx={r * 0.9} ry={r * 0.6} fill={c} transform={`rotate(${a} ${cx + Math.cos(rad) * r} ${cy + Math.sin(rad) * r})`} />;
    });
  const flowerSpots = [[150, stemTop - 6], [128, stemTop + 34], [172, stemTop + 52], [124, stemTop + 90], [176, stemTop + 110]];
  const FLOWER_COLORS = ['#E8B49A', '#C9B6DB', '#F2C6C2', '#EFD9A0', '#9DB4D6'];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 300 ${H}`}>
      <Ellipse cx="150" cy={H - 44} rx="120" ry="20" fill="#CDBB98" />
      <Ellipse cx="150" cy={H - 48} rx="112" ry="15" fill="#B69F7A" />
      {stage === 0 ? <Ellipse cx="150" cy={H - 58} rx="8" ry="5" fill="#7A5C3E" /> : (
        <G>
          <Path d={stem} stroke="#5E8A68" strokeWidth={4 + Math.min(stage, 8) * 0.4} fill="none" strokeLinecap="round" />
          {Array.from({ length: leaves }).map((_, i) => {
            const y = H - 76 - i * ((H - 76 - stemTop) / Math.max(leaves, 1));
            const left = i % 2 === 0;
            const sz = 14 + Math.min(stage, 8) * 1.4;
            return <Path key={i} d={left ? `M 149 ${y} C ${149 - sz} ${y - sz}, ${149 - sz * 2.2} ${y - 2}, 149 ${y} Z` : `M 151 ${y} C ${151 + sz} ${y - sz}, ${151 + sz * 2.2} ${y - 2}, 151 ${y} Z`} fill={i % 3 === 0 ? '#7A9E87' : '#8DB39A'} />;
          })}
          {stage === 6 ? <Ellipse cx="150" cy={stemTop - 4} rx="6" ry="9" fill="#E8B49A" /> : null}
          {flowerSpots.slice(0, flowers).map(([x, y], i) => (
            <G key={i}>{petals(x, y, 9, FLOWER_COLORS[i])}<Circle cx={x} cy={y} r={5} fill="#F4D58D" /></G>
          ))}
        </G>
      )}
    </Svg>
  );
}

function Butterfly({ still }) {
  const t = useRef(new Animated.Value(0)).current;
  const flap = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    Animated.loop(Animated.timing(t, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([Animated.timing(flap, { toValue: 1, duration: 260, useNativeDriver: true }), Animated.timing(flap, { toValue: 0, duration: 260, useNativeDriver: true })])).start();
  }, [t, flap, still]);
  const tx = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [40, 180, 250, 120, 40] });
  const ty = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [60, 20, 90, 130, 60] });
  const sx = flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', transform: [{ translateX: tx }, { translateY: ty }] }}>
      <Animated.View style={{ transform: [{ scaleX: sx }] }}>
        <Svg width={30} height={22} viewBox="0 0 30 22"><Ellipse cx="9" cy="9" rx="8" ry="7" fill="#C9B6DB" /><Ellipse cx="21" cy="9" rx="8" ry="7" fill="#C9B6DB" /><Ellipse cx="10" cy="17" rx="5" ry="4" fill="#E8B49A" /><Ellipse cx="20" cy="17" rx="5" ry="4" fill="#E8B49A" /><Rect x="14" y="4" width="2" height="16" rx="1" fill="#5A4E61" /></Svg>
      </Animated.View>
    </Animated.View>
  );
}

export default function CalmGarden() {
  const { width } = useWindowDimensions();
  const [points, setPoints] = useState(0);
  const [still, setStill] = useState(false);
  const sway = useRef(new Animated.Value(0)).current;
  useFocusEffect(useCallback(() => { getCalmPoints().then(setPoints); }, []));
  useEffect(() => {
    reduceMotion().then((r) => {
      setStill(r);
      if (r) return;
      Animated.loop(Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    });
  }, [sway]);

  const stage = Math.min(11, Math.floor(points / 2));
  const H = 300;
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-1.6deg', '1.6deg'] });

  return (
    <GameFrame background="#F4F1E8" noPoint>
      <ScrollView contentContainerStyle={{ paddingTop: space(6), paddingBottom: 110, paddingHorizontal: space(5) }}>
        <View style={{ height: H, overflow: 'hidden' }}>
          {/* rotate around the base of the plant */}
          <Animated.View style={{ transform: [{ translateY: H / 2 - 50 }, { rotate }, { translateY: -(H / 2 - 50) }] }}>
            <Plant stage={stage} />
          </Animated.View>
          {stage >= 10 ? <Butterfly still={still} /> : null}
          {stage >= 11 ? <View style={{ position: 'absolute', left: width * 0.1, top: 40 }}><Butterfly still={still} /></View> : null}
        </View>
        <Text style={s.stage}>{STAGES[stage]}</Text>
        <Text style={s.count}>{points} calm moment{points === 1 ? '' : 's'}</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>How your garden grows</Text>
          <Text style={s.cardText}>Each check-in, journal entry, breathing or grounding exercise, and calming game helps it grow a little. It never wilts, and there's no need to come back every day. It will be here whenever you are.</Text>
        </View>
      </ScrollView>
    </GameFrame>
  );
}

const s = StyleSheet.create({
  stage: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, textAlign: 'center', marginTop: space(3) },
  count: { fontFamily: fonts.body, fontSize: 13.5, color: colors.midGray, textAlign: 'center', marginTop: 4 },
  card: { marginTop: space(6), padding: space(5), borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark },
  cardTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
  cardText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.midGray, marginTop: 6 },
});
