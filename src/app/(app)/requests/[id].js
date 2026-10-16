import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusTag, fmtDate, fmtSlot, slotPassed } from '../../../components/ConsultBits';
import { Body, Button, Card, Heading, Loading, Notice, Screen, Small, callNumber } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

export default function RequestDetail() {
  const { id } = useLocalSearchParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  const [slot, setSlot] = useState(0);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => { api(`/consultations/${id}/`).then(setR).catch((e) => setErr(e.message)); }, [id]);
  useEffect(load, [load]);

  async function act(action, body) {
    setBusy(action);
    setErr('');
    try {
      setR(await api(`/consultations/${id}/${action}/`, { method: 'POST', body }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  }

  function confirmAccept() {
    Alert.alert(
      'Accept this quote?',
      `${r.professional.display_name} will see your full name and email${r.shared_phone ? ' and phone number' : ''} so they can confirm the session.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Accept', onPress: () => act('accept', { slot_index: slot }) }],
    );
  }

  if (!r && !err) return <Loading />;
  if (!r) return <Screen edges={[]}><Notice style={{ marginTop: space(4) }}>{err}</Notice></Screen>;
  const q = r.quote;
  const pro = r.professional;

  return (
    <Screen edges={[]}>
      <View style={{ marginTop: space(4), gap: 6 }}>
        <Heading>{pro.display_name}</Heading>
        <Small>{pro.profession_label} · requested {fmtDate(r.created_at)}</Small>
        <StatusTag status={r.status} />
      </View>
      {err ? <Notice style={{ marginTop: space(3) }}>{err}</Notice> : null}

      {r.status === 'requested' ? (
        <Notice tone="info" style={{ marginTop: space(4) }}>Waiting for {pro.display_name} to reply with a quote. We'll email you when they do.</Notice>
      ) : null}
      {r.response_note && r.status === 'pro_declined' ? (
        <Card tone="cream" style={{ marginTop: space(4) }}>
          <Small>Their reply</Small>
          <Body>{r.response_note}</Body>
          <Button title="Find another professional" variant="outline" onPress={() => router.navigate('/find-support')} style={{ marginTop: space(3) }} />
        </Card>
      ) : null}

      {q ? (
        <Card style={{ marginTop: space(4) }}>
          <Text style={s.fee}>R{q.fee}</Text>
          <Small>{q.duration_min}-minute session · {q.mode_label}</Small>
          {q.note ? <Body style={{ marginTop: space(3) }}>{q.note}</Body> : null}
          <Text style={s.label}>{r.status === 'accepted' ? 'Agreed time' : 'Choose a time'}</Text>
          {r.status === 'accepted' ? (
            <Body style={{ fontFamily: fonts.medium }}>{fmtSlot(r.chosen_slot)}</Body>
          ) : (
            q.slots.map((t, i) => (
              <Pressable key={i} onPress={() => setSlot(i)} disabled={r.status !== 'quoted' || slotPassed(t)} style={[s.slot, slot === i && r.status === 'quoted' && s.slotOn, slotPassed(t) && { opacity: 0.45 }]} accessibilityRole="radio" accessibilityState={{ selected: slot === i }}>
                <Ionicons name={slot === i ? 'radio-button-on' : 'radio-button-off'} size={18} color={colors.sageDark} />
                <Text style={s.slotText}>{fmtSlot(t)}{slotPassed(t) ? ' (passed)' : ''}</Text>
              </Pressable>
            ))
          )}
          {r.status === 'quoted' ? <Small style={{ marginTop: space(3) }}>Quote valid until {fmtDate(q.valid_until)}. Payment is arranged directly with the professional.</Small> : null}
        </Card>
      ) : null}

      {r.status === 'accepted' ? (
        <Card tone="sage" style={{ marginTop: space(4) }}>
          <Heading style={{ fontSize: 18 }}>You're booked in</Heading>
          <Body style={{ marginTop: 4 }}>{pro.display_name} has your details and will be in touch to confirm. You can also contact them:</Body>
          <View style={{ gap: space(2), marginTop: space(3) }}>
            {pro.contact_phone ? <Button title={`Call ${pro.contact_phone}`} icon="call-outline" variant="outline" onPress={() => callNumber(pro.contact_phone)} /> : null}
            {pro.email ? <Button title={`Email ${pro.email}`} icon="mail-outline" variant="outline" onPress={() => Linking.openURL(`mailto:${pro.email}`)} /> : null}
            {pro.address ? <Small>Address: {pro.address}, {pro.city}</Small> : null}
          </View>
        </Card>
      ) : null}

      <Card tone="cream" style={{ marginTop: space(4) }}>
        <Small>Your request</Small>
        <Body>{r.mode_label}{r.topics.length ? ` · ${r.topics.map((t) => t.label).join(', ')}` : ''}</Body>
        {r.message ? <Body muted style={{ marginTop: 4 }}>“{r.message}”</Body> : null}
        {r.preferred_times ? <Small style={{ marginTop: 4 }}>Preferred: {r.preferred_times}</Small> : null}
        <Small style={{ marginTop: 4 }}>
          Shared: {[r.mood_summary && 'mood summary', r.shared_phone && 'phone number (after accepting)'].filter(Boolean).join(', ') || 'first name only until you accept'}
        </Small>
      </Card>

      <View style={{ gap: space(3), marginTop: space(6) }}>
        {r.status === 'quoted' ? (
          <>
            <Button title="Accept quote" onPress={confirmAccept} loading={busy === 'accept'} />
            <Button title="Decline" variant="outline" loading={busy === 'decline'} onPress={() => Alert.alert('Decline this quote?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Decline', style: 'destructive', onPress: () => act('decline') }])} />
          </>
        ) : null}
        {r.status === 'requested' || r.status === 'quoted' ? (
          <Button title="Cancel request" variant="ghost" loading={busy === 'cancel'} onPress={() => Alert.alert('Cancel this request?', '', [{ text: 'Keep it', style: 'cancel' }, { text: 'Cancel request', style: 'destructive', onPress: () => act('cancel') }])} />
        ) : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  fee: { fontFamily: fonts.display, fontSize: 34, color: colors.sageDark },
  label: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.charcoal, marginTop: space(4), marginBottom: space(2) },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.lightGray, marginBottom: 8, backgroundColor: colors.white },
  slotOn: { borderColor: colors.sage, backgroundColor: colors.sageWash },
  slotText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.charcoal },
});
