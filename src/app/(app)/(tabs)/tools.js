import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import TopBar from '../../../components/TopBar';
import { Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

// Grouped by what you need right now, so it's easy to find the right thing.
function Group({ title, sub, children }) {
  return (
    <View style={{ marginBottom: space(6) }}>
      <Text style={s.group}>{title}</Text>
      {sub ? <Small style={{ marginBottom: space(3) }}>{sub}</Small> : null}
      <View style={{ gap: space(3) }}>{children}</View>
    </View>
  );
}

function Tool({ icon, tint, title, text, onPress, badge }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.tool, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <View style={[s.icon, { backgroundColor: tint }]}><Ionicons name={icon} size={22} color={colors.sageDark} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.text}>{text}</Text>
      </View>
      {badge ? <Text style={s.badge}>{badge}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
    </Pressable>
  );
}

export default function Tools() {
  const [plan, setPlan] = useState(null);
  const [journal, setJournal] = useState(null);
  useFocusEffect(useCallback(() => {
    api('/safety-plan/').then(setPlan).catch(() => {});
    api('/journal/').then((j) => setJournal(j.count)).catch(() => {});
  }, []));

  return (
    <Screen>
      <TopBar title="Tools" />
      <Group title="Calm down now" sub="For when things feel like too much.">
        <Tool icon="leaf-outline" tint={colors.sageWash} title="Breathing" text="Slow your breathing with gentle guidance" onPress={() => router.push('/breathing')} />
        <Tool icon="hand-left-outline" tint={colors.sageWash} title="Grounding (5-4-3-2-1)" text="Come back to the present, one sense at a time" onPress={() => router.push('/grounding')} />
        <Tool icon="play-circle-outline" tint={colors.sageWash} title="Guided breath video" text="A 15-second breathing break with sound" onPress={() => router.push('/breathe')} />
      </Group>
      <Group title="Play" sub="Gentle games with no scores, timers or losing.">
        <Tool icon="game-controller-outline" tint="#E6EEF3" title="Calming games" text="Worry bubbles, a ripple pond, a mandala and more" badge="6" onPress={() => router.push('/games')} />
        <Tool icon="flower-outline" tint={colors.sageWash} title="My calm garden" text="Grows as you look after yourself. It never wilts." onPress={() => router.push('/games/garden')} />
      </Group>
      <Group title="Reflect" sub="Private to you. Nobody else can read it.">
        <Tool icon="book-outline" tint={colors.cream} title="Journal" text="Write freely, or start from a gentle prompt" badge={journal ? `${journal}` : null} onPress={() => router.push('/journal')} />
      </Group>
      <Group title="Stay safe" sub="Prepare on a good day, use on a hard one.">
        <Tool
          icon="shield-checkmark-outline"
          tint={colors.terraWash}
          title="My safety plan"
          text={plan?.filled_steps ? `${plan.filled_steps} of 6 steps filled in` : 'Takes about 5 minutes. Tap-to-add suggestions help.'}
          onPress={() => router.push('/safety-plan')}
        />
        <Tool icon="heart-outline" tint={colors.terraWash} title="Get help now" text="Crisis lines and your trusted contact" onPress={() => router.push('/help')} />
      </Group>
    </Screen>
  );
}

const s = StyleSheet.create({
  group: { fontFamily: fonts.display, fontSize: 21, color: colors.charcoal, marginBottom: 2 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: space(4), borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.charcoal },
  text: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.midGray, marginTop: 1 },
  badge: { fontFamily: fonts.medium, fontSize: 12, color: colors.midGray, backgroundColor: colors.cream, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
});
