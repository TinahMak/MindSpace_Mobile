import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Heading, Loading, Notice, Screen, Small, callNumber } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

const ORDER = [
  ['warning_signs', 'My warning signs', 'alert-circle-outline'],
  ['coping', 'Things I can do on my own', 'leaf-outline'],
  ['distractions', 'People and places that help', 'walk-outline'],
  ['people', 'People I can ask for help', 'people-outline'],
  ['professionals', 'Professionals I can contact', 'medkit-outline'],
  ['reasons', 'Reasons that matter to me', 'heart-outline'],
];

export default function SafetyPlan() {
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  useFocusEffect(useCallback(() => { api('/safety-plan/').then(setP).catch((e) => setErr(e.message)); }, []));

  if (!p && !err) return <Loading />;
  if (!p) return <Screen edges={[]}><Notice style={{ marginTop: space(4) }}>{err}</Notice></Screen>;

  if (!p.filled_steps && !p.trusted) {
    return (
      <Screen edges={[]}>
        <View style={s.intro}>
          <View style={s.introIcon}><Ionicons name="shield-checkmark-outline" size={30} color={colors.sageDark} /></View>
          <Heading style={{ textAlign: 'center' }}>A plan for hard moments</Heading>
          <Body muted style={{ textAlign: 'center', marginTop: space(2) }}>
            A safety plan is a short list you write on a calmer day: your warning signs, what helps, and who to call. When things feel overwhelming, you won't have to think; it's all here.
          </Body>
          <Body muted style={{ textAlign: 'center', marginTop: space(3) }}>Six short steps, about 5 minutes. You can skip any step and come back later.</Body>
          <Button title="Create my plan" onPress={() => router.push('/safety-plan/edit')} style={{ marginTop: space(6), alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Notice tone="info" style={{ marginTop: space(4) }}>If you are in danger right now, call a crisis line first. Tap Get help now at the bottom.</Notice>
      {p.trusted ? (
        <Card tone="terra" style={{ marginBottom: space(4) }}>
          <Small>My trusted contact{p.trusted.relationship ? ` (${p.trusted.relationship.toLowerCase()})` : ''}</Small>
          <Text style={s.trustedName}>{p.trusted.name}</Text>
          <Button title={`Call ${p.trusted.phone}`} icon="call" variant="help" onPress={() => callNumber(p.trusted.phone)} style={{ marginTop: space(3) }} />
        </Card>
      ) : null}
      {ORDER.map(([key, title, icon], i) => {
        const items = p[key] || [];
        return (
          <View key={key} style={s.step}>
            <View style={s.stepHead}>
              <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
              <Ionicons name={icon} size={18} color={colors.sageDark} />
              <Text style={s.stepTitle}>{title}</Text>
            </View>
            {items.length === 0 ? <Small style={{ marginLeft: 36 }}>Not filled in yet</Small> : null}
            {items.map((x, j) =>
              typeof x === 'string' ? (
                <Text key={j} style={s.item}>• {x}</Text>
              ) : (
                <Pressable key={j} onPress={() => x.phone && callNumber(x.phone)} style={s.contact}>
                  <Text style={s.item}>{x.name}</Text>
                  {x.phone ? <View style={s.call}><Ionicons name="call" size={14} color={colors.white} /><Text style={s.callText}>{x.phone}</Text></View> : null}
                </Pressable>
              ),
            )}
          </View>
        );
      })}
      <Button title="Edit my plan" variant="outline" icon="create-outline" onPress={() => router.push('/safety-plan/edit')} style={{ marginTop: space(4) }} />
      <Button title="Get help now" variant="help" icon="heart" onPress={() => router.push('/help')} style={{ marginTop: space(3) }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  intro: { alignItems: 'center', paddingTop: space(10) },
  introIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sageWash, alignItems: 'center', justifyContent: 'center', marginBottom: space(4) },
  trustedName: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginTop: 2 },
  step: { paddingVertical: space(4), borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.sageDark, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  numText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
  stepTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.charcoal, flex: 1 },
  item: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.charcoal, marginLeft: 36 },
  contact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingRight: 4 },
  call: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.sage, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  callText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.white },
});
