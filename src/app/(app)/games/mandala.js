import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import GameFrame from '../../../components/GameFrame';
import { play, tap } from '../../../lib/games';
import { colors, fonts, radius } from '../../../lib/theme';

const PALETTE = ['#7A9E87', '#B5CEBF', '#4A6B57', '#C4714A', '#E8B49A', '#9DB4D6', '#C9B6DB', '#EFD9A0', '#F2C6C2', '#FFFFFF'];

// Each design: rings from the centre outwards.
const DESIGNS = [
  [{ n: 1, r1: 0, r2: 22, t: 'circle' }, { n: 8, r1: 22, r2: 55, t: 'petal' }, { n: 16, r1: 55, r2: 78, t: 'wedge' }, { n: 12, r1: 78, r2: 112, t: 'petal' }, { n: 24, r1: 112, r2: 128, t: 'wedge' }, { n: 16, r1: 128, r2: 146, t: 'dots' }],
  [{ n: 1, r1: 0, r2: 18, t: 'circle' }, { n: 6, r1: 18, r2: 60, t: 'petal' }, { n: 6, r1: 30, r2: 72, t: 'petal', rot: 30 }, { n: 18, r1: 72, r2: 96, t: 'wedge' }, { n: 9, r1: 96, r2: 142, t: 'petal' }, { n: 9, r1: 104, r2: 146, t: 'petal', rot: 20 }],
  [{ n: 1, r1: 0, r2: 26, t: 'circle' }, { n: 12, r1: 26, r2: 48, t: 'wedge' }, { n: 12, r1: 48, r2: 84, t: 'petal' }, { n: 24, r1: 84, r2: 100, t: 'wedge' }, { n: 10, r1: 100, r2: 140, t: 'petal' }, { n: 20, r1: 140, r2: 148, t: 'dots' }],
];

const P = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [150 + r * Math.cos(a), 150 + r * Math.sin(a)];
};
const f = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

function shapes(design) {
  const out = [];
  design.forEach((ring, ri) => {
    const step = 360 / ring.n;
    for (let i = 0; i < ring.n; i++) {
      const a1 = i * step + (ring.rot || 0);
      const a2 = a1 + step;
      const mid = (a1 + a2) / 2;
      const key = `${ri}-${i}`;
      if (ring.t === 'circle') out.push({ key, circle: { cx: 150, cy: 150, r: ring.r2 } });
      else if (ring.t === 'dots') { const c = P((ring.r1 + ring.r2) / 2, mid); out.push({ key, circle: { cx: c[0], cy: c[1], r: (ring.r2 - ring.r1) / 2 } }); }
      else if (ring.t === 'wedge') {
        out.push({ key, d: `M ${f(P(ring.r1, a1))} L ${f(P(ring.r2, a1))} A ${ring.r2} ${ring.r2} 0 0 1 ${f(P(ring.r2, a2))} L ${f(P(ring.r1, a2))} A ${ring.r1} ${ring.r1} 0 0 0 ${f(P(ring.r1, a1))} Z` });
      } else {
        const rm = (ring.r1 + ring.r2) / 2;
        out.push({ key, d: `M ${f(P(ring.r1, mid))} Q ${f(P(rm + 6, a1 - step * 0.05))} ${f(P(ring.r2, mid))} Q ${f(P(rm + 6, a2 + step * 0.05))} ${f(P(ring.r1, mid))} Z` });
      }
    }
  });
  return out;
}

export default function Mandala() {
  const { width } = useWindowDimensions();
  const [design, setDesign] = useState(0);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState({});
  const art = useRef(null);
  const items = useMemo(() => shapes(DESIGNS[design]), [design]);
  const size = Math.min(width - 32, 420);

  function fill(key) {
    tap('soft');
    play('pop');
    setFills((cur) => ({ ...cur, [key]: color }));
  }

  async function save() {
    try {
      const uri = await captureRef(art, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Save or share your mandala' });
    } catch {
      Alert.alert("Couldn't save", 'Please try again.');
    }
  }

  return (
    <GameFrame background="#FBF7F1" hint="Pick a colour, then tap any shape. There are no mistakes here.">
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: 70, paddingBottom: 140 }}>
        <View ref={art} collapsable={false} style={{ backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 8 }}>
          <Svg width={size} height={size} viewBox="0 0 300 300">
            <G stroke="#8C8579" strokeWidth={0.9} strokeLinejoin="round">
              {items.map((it) =>
                it.circle ? (
                  <Circle key={it.key} {...it.circle} fill={fills[it.key] || '#FFFFFF'} onPress={() => fill(it.key)} />
                ) : (
                  <Path key={it.key} d={it.d} fill={fills[it.key] || '#FFFFFF'} onPress={() => fill(it.key)} />
                ),
              )}
            </G>
          </Svg>
        </View>

        <View style={s.palette}>
          {PALETTE.map((c) => (
            <Pressable key={c} onPress={() => { setColor(c); tap(); }} style={[s.swatch, { backgroundColor: c }, color === c && s.swatchOn]} accessibilityLabel={c === '#FFFFFF' ? 'Eraser (white)' : `Colour ${c}`}>
              {c === '#FFFFFF' ? <Ionicons name="remove-outline" size={16} color={colors.midGray} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={s.actions}>
          <Pressable onPress={() => { setDesign((design + 1) % DESIGNS.length); setFills({}); }} style={s.action}><Ionicons name="shuffle-outline" size={18} color={colors.sageDark} /><Text style={s.actionText}>New pattern</Text></Pressable>
          <Pressable onPress={() => setFills({})} style={s.action}><Ionicons name="refresh-outline" size={18} color={colors.sageDark} /><Text style={s.actionText}>Start over</Text></Pressable>
          <Pressable onPress={save} style={s.action}><Ionicons name="download-outline" size={18} color={colors.sageDark} /><Text style={s.actionText}>Save</Text></Pressable>
        </View>
      </ScrollView>
    </GameFrame>
  );
}

const s = StyleSheet.create({
  palette: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 18, paddingHorizontal: 20 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderWidth: 3, borderColor: colors.charcoal, transform: [{ scale: 1.1 }] },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark },
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
});
