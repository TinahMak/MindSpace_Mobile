import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { StatusTag, fmtDate, fmtSlot } from '../../../components/ConsultBits';
import DateField from '../../../components/DateField';
import { Body, Button, Card, Chip, Field, Heading, Loading, Notice, Screen, Small, callNumber, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

const DURATIONS = [30, 45, 50, 60, 90];
const VALID = [3, 7, 14];

export default function QuoteRequest() {
  const { id } = useLocalSearchParams();
  const [r, setR] = useState(null);
  const [me, setMe] = useState(null);
  const [q, setQ] = useState({ fee: '', duration_min: 50, quote_mode: '', slots: [null, null, null], quote_note: '', valid_days: 7 });
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    Promise.all([api(`/pro/consultations/${id}/`), api('/pro/me/')])
      .then(([req, prof]) => {
        setR(req);
        setMe(prof);
        const mode = req.mode !== 'either' ? req.mode : prof.offers_in_person ? 'in_person' : 'online';
        setQ((cur) => ({
          ...cur,
          fee: req.quote ? String(req.quote.fee) : prof.fee_min ? String(prof.fee_min) : '',
          duration_min: req.quote?.duration_min || cur.duration_min,
          quote_mode: req.quote?.mode || mode,
          slots: req.quote
            ? [...req.quote.slots.map((x) => { const d = new Date(x); return Number.isNaN(d.getTime()) || d <= new Date() ? null : d; }), null, null, null].slice(0, 3)
            : cur.slots,
          quote_note: req.quote?.note || '',
        }));
      })
      .catch((e) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  const set = (k) => (v) => setQ((cur) => ({ ...cur, [k]: v }));

  async function send() {
    const e = {};
    if (!q.fee || Number.isNaN(Number(q.fee))) e.fee = 'Enter your fee in rand.';
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    const chosen = q.slots.filter(Boolean);
    if (!chosen.length) e.slots = 'Offer at least one time.';
    else if (chosen.some((d) => d < soon)) e.slots = 'Times must be at least an hour from now. Pick again.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy('quote');
    setErr('');
    try {
      setR(await api(`/pro/consultations/${id}/quote/`, { method: 'POST', body: { ...q, fee: Number(q.fee), slots: chosen.map((d) => d.toISOString()) } }));
      Alert.alert('Quote sent', "We've emailed the client. You'll see here when they accept.");
    } catch (x) {
      setErrors(x.fields || {});
      setErr(x.message);
    } finally {
      setBusy('');
    }
  }

  async function decline() {
    setBusy('decline');
    try {
      setR(await api(`/pro/consultations/${id}/decline/`, { method: 'POST', body: { reason } }));
      setDeclining(false);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy('');
    }
  }

  if (!r && !err) return <Loading />;
  if (!r) return <Screen edges={[]}><Notice style={{ marginTop: space(4) }}>{err}</Notice></Screen>;
  const c = r.client;
  const open = r.status === 'requested' || r.status === 'quoted';
  const modes = [me?.offers_in_person && ['in_person', 'In person'], me?.offers_online && ['online', 'Online']].filter(Boolean);

  return (
    <Screen edges={[]}>
      <View style={{ marginTop: space(4), gap: 6 }}>
        <Heading>{c.revealed ? c.full_name : c.first_name}</Heading>
        <Small>Requested {fmtDate(r.created_at)}</Small>
        <StatusTag status={r.status} />
      </View>
      {err ? <Notice style={{ marginTop: space(3) }}>{err}</Notice> : null}

      {c.revealed ? (
        <Card tone="sage" style={{ marginTop: space(4) }}>
          <Heading style={{ fontSize: 18 }}>Accepted: {fmtSlot(r.chosen_slot)}</Heading>
          <Body style={{ marginTop: 4 }}>Please contact {c.first_name} to confirm the session.</Body>
          <View style={{ gap: space(2), marginTop: space(3) }}>
            <Button title={`Email ${c.email}`} icon="mail-outline" variant="outline" onPress={() => Linking.openURL(`mailto:${c.email}`)} />
            {c.phone ? <Button title={`Call ${c.phone}`} icon="call-outline" variant="outline" onPress={() => callNumber(c.phone)} /> : null}
          </View>
        </Card>
      ) : (
        <Notice tone="info" style={{ marginTop: space(4) }}>
          For privacy you see the client's first name only. Their full name and contact details appear if they accept your quote.
        </Notice>
      )}

      <Card style={{ marginTop: space(4) }}>
        <Small>Would like</Small>
        <Body>{r.mode_label}{r.topics.length ? ` · ${r.topics.map((t) => t.label).join(', ')}` : ''}</Body>
        {r.message ? (<><Small style={{ marginTop: space(3) }}>Message</Small><Body>{r.message}</Body></>) : null}
        {r.preferred_times ? (<><Small style={{ marginTop: space(3) }}>Preferred times</Small><Body>{r.preferred_times}</Body></>) : null}
        {r.mood_summary ? (<><Small style={{ marginTop: space(3) }}>Mood summary (shared with consent)</Small><Body>{r.mood_summary}</Body></>) : null}
      </Card>

      {r.response_note && r.status !== 'accepted' ? <Card tone="cream" style={{ marginTop: space(4) }}><Small>Note</Small><Body>{r.response_note}</Body></Card> : null}

      {open ? (
        <Card style={{ marginTop: space(5) }}>
          <Heading style={{ fontSize: 19, marginBottom: space(3) }}>{r.status === 'quoted' ? 'Update your quote' : 'Send a quote'}</Heading>
          <Field label="Fee for the session (R)" value={q.fee} onChangeText={(t) => set('fee')(t.replace(/\D/g, ''))} keyboardType="number-pad" error={errors.fee} />
          <Text style={ui.label}>Session length</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space(4) }}>
            {DURATIONS.map((d) => <Chip key={d} label={`${d} min`} selected={q.duration_min === d} onPress={() => set('duration_min')(d)} />)}
          </View>
          <Text style={ui.label}>Session type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: space(4) }}>
            {modes.map(([v, l]) => <Chip key={v} label={l} selected={q.quote_mode === v} onPress={() => set('quote_mode')(v)} />)}
          </View>
          <Text style={ui.label}>Times you can offer (up to 3)</Text>
          {q.slots.map((sl, i) => (
            <DateField
              key={i}
              mode="datetime"
              value={sl}
              onChange={(d) => set('slots')(q.slots.map((x, j) => (j === i ? d : x)))}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 180 * 24 * 3600 * 1000)}
              placeholder={i === 0 ? 'Pick a date and time' : 'Another option (optional)'}
            />
          ))}
          <Small style={{ marginTop: -space(2), marginBottom: space(3) }}>Past times can't be chosen, and each time must be at least an hour away.</Small>
          {errors.slots ? <Text style={[ui.fieldError, { marginBottom: space(3) }]}>{errors.slots}</Text> : null}
          <Text style={[ui.label, { marginTop: space(2) }]}>Note to the client (optional)</Text>
          <TextInput style={[ui.input, { minHeight: 80, textAlignVertical: 'top' }]} value={q.quote_note} onChangeText={(t) => set('quote_note')(t.slice(0, 1000))} multiline placeholder="e.g. how the first session works, payment options" placeholderTextColor="#A19C94" />
          <Text style={[ui.label, { marginTop: space(4) }]}>Quote valid for</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: space(5) }}>
            {VALID.map((d) => <Chip key={d} label={`${d} days`} selected={q.valid_days === d} onPress={() => set('valid_days')(d)} />)}
          </View>
          <Button title={r.status === 'quoted' ? 'Update quote' : 'Send quote'} onPress={send} loading={busy === 'quote'} />
          <Button title="Decline request" variant="ghost" onPress={() => setDeclining(true)} style={{ marginTop: 6 }} />
        </Card>
      ) : null}

      <Modal visible={declining} transparent animationType="fade" onRequestClose={() => setDeclining(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: 'rgba(44,44,44,0.45)', justifyContent: 'center', padding: space(5) }}>
          <View style={{ backgroundColor: colors.warmWhite, borderRadius: radius.lg, padding: space(6) }}>
            <Heading>Decline this request?</Heading>
            <Body muted style={{ marginVertical: space(3) }}>The client sees your reason and is pointed to other professionals.</Body>
            <TextInput style={[ui.input, { minHeight: 80, textAlignVertical: 'top' }]} value={reason} onChangeText={setReason} multiline placeholder="e.g. I'm fully booked this month" placeholderTextColor="#A19C94" />
            <Button title="Decline" variant="dark" onPress={decline} loading={busy === 'decline'} style={{ marginTop: space(4) }} />
            <Button title="Cancel" variant="ghost" onPress={() => setDeclining(false)} style={{ marginTop: 6 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
