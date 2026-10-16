import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { feeText } from '../../../components/ProCard';
import { Body, Button, Card, Heading, Loading, Notice, Screen, Small, callNumber } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

export default function SupportProfile() {
  const { id } = useLocalSearchParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`/support/${id}/`).then(setP).catch((e) => setErr(e.message));
  }, [id]);

  if (!p && !err) return <Loading />;
  if (!p) return <Screen edges={[]}><Notice style={{ marginTop: space(4) }}>{err}</Notice></Screen>;

  return (
    <Screen edges={[]}>
      <View style={{ marginTop: space(4) }}>
        <Heading style={{ fontSize: 26 }}>{p.display_name}</Heading>
        <Body muted>{p.profession_label}{p.practice_name ? ` · ${p.practice_name}` : ''}</Body>
      </View>

      <View style={s.verified}>
        <Ionicons name="shield-checkmark" size={18} color={colors.sageDark} />
        <Text style={s.verifiedText}>
          Verified by MindSpace. Registered with the {p.regulator}, number {p.registration_number}. You can also check this on the {p.regulator} public register.
        </Text>
      </View>

      <Card style={{ marginTop: space(4) }}>
        <Row icon="cash-outline" text={`${feeText(p)}${p.accepts_medical_aid ? ' · accepts medical aid' : ''}`} />
        {p.offers_in_person ? <Row icon="business-outline" text={`In person: ${[p.address, p.city, p.province].filter(Boolean).join(', ')}`} /> : null}
        {p.offers_online ? <Row icon="videocam-outline" text="Online sessions available" /> : null}
        <Row icon="chatbubbles-outline" text={`Languages: ${p.languages.join(', ')}`} />
        <Row icon="school-outline" text={`${p.qualifications}${p.years_experience ? ` · ${p.years_experience} years' experience` : ''}`} />
      </Card>

      <Text style={s.label}>Works with</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {p.specialties.map((x) => (
          <View key={x.value} style={s.tag}><Text style={s.tagText}>{x.label}</Text></View>
        ))}
      </View>

      {p.bio ? (
        <>
          <Text style={s.label}>About</Text>
          <Body>{p.bio}</Body>
        </>
      ) : null}

      <View style={{ gap: space(3), marginTop: space(7) }}>
        <Button title="Request a consultation" icon="calendar-outline" onPress={() => router.push(`/request/${p.id}`)} />
        <Small style={{ textAlign: 'center' }}>Free to ask. They reply with a quote and times, and you decide.</Small>
        {p.contact_phone ? <Button title={`Call the practice: ${p.contact_phone}`} icon="call-outline" variant="outline" onPress={() => callNumber(p.contact_phone)} /> : null}
      </View>
    </Screen>
  );
}

function Row({ icon, text }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 7 }}>
      <Ionicons name={icon} size={18} color={colors.sageDark} style={{ marginTop: 2 }} />
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.charcoal }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  verified: { flexDirection: 'row', gap: 10, marginTop: space(4), padding: 14, borderRadius: radius.md, backgroundColor: colors.sageWash },
  verifiedText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.sageDark },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.charcoal, marginTop: space(6), marginBottom: space(2) },
  tag: { backgroundColor: colors.sageWash, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
});
