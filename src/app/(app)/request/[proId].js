import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, Check, Chip, Field, Heading, Loading, Notice, Screen, Small, callNumber, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { colors, space } from '../../../lib/theme';
import { checkPhone, phoneHint } from '../../../lib/validate';

export default function RequestConsultation() {
  const { proId } = useLocalSearchParams();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [f, setF] = useState({ mode: null, topics: [], message: '', preferred_times: '', share_mood_summary: false, share_phone: false, phone: user?.phone || '' });
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/support/${proId}/`)
      .then((x) => {
        setP(x);
        setF((cur) => ({
          ...cur,
          mode: x.offers_in_person && x.offers_online ? 'either' : x.offers_online ? 'online' : 'in_person',
          topics: x.specialties.filter((sp) => x.matched_specialties?.includes(sp.label)).map((sp) => sp.value),
        }));
      })
      .catch((e) => setErr(e.message));
  }, [proId]);

  const set = (k) => (v) => setF((cur) => ({ ...cur, [k]: v }));
  const toggleTopic = (v) => set('topics')(f.topics.includes(v) ? f.topics.filter((x) => x !== v) : [...f.topics, v]);

  async function submit() {
    const e = {};
    if (!f.topics.length && f.message.trim().length < 5) e.topics = "Choose what you'd like help with, or write a short message.";
    let phone = f.phone;
    if (f.share_phone) {
      const ph = checkPhone(f.phone, user?.country || 'ZA');
      if (ph.error) e.phone = ph.error;
      else phone = ph.e164;
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setErr('');
    try {
      const r = await api('/consultations/', { method: 'POST', body: { ...f, phone, professional_id: Number(proId) } });
      if (r.crisis_line) {
        Alert.alert(
          'Please reach out now',
          `Professionals on MindSpace aren't an emergency service and may take time to reply. If you might be in danger, call ${r.crisis_line.name} on ${r.crisis_line.number}. It's free and open ${r.crisis_line.hours}.`,
          [
            { text: 'Call now', onPress: () => callNumber(r.crisis_line.number) },
            { text: 'OK', onPress: () => router.replace(`/requests/${r.id}`) },
          ],
        );
      } else {
        router.replace(`/requests/${r.id}`);
      }
    } catch (x) {
      setErrors(x.fields || {});
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  if (!p && !err) return <Loading />;
  if (!p) return <Screen edges={[]}><Notice style={{ marginTop: space(4) }}>{err}</Notice></Screen>;
  const modes = [
    p.offers_in_person && ['in_person', 'In person'],
    p.offers_online && ['online', 'Online'],
    p.offers_in_person && p.offers_online && ['either', 'Either is fine'],
  ].filter(Boolean);

  return (
    <Screen edges={[]}>
      <Heading style={{ marginTop: space(4) }}>Request a consultation</Heading>
      <Body muted style={{ marginTop: 4, marginBottom: space(5) }}>
        with {p.display_name}. They'll reply with a quote and times. You decide whether to accept.
      </Body>

      <Text style={ui.label}>How would you like to meet?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space(5) }}>
        {modes.map(([v, l]) => <Chip key={v} label={l} selected={f.mode === v} onPress={() => set('mode')(v)} />)}
      </View>

      <Text style={ui.label}>What would you like help with?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {p.specialties.map((sp) => <Chip key={sp.value} label={sp.label} selected={f.topics.includes(sp.value)} onPress={() => toggleTopic(sp.value)} />)}
      </View>
      {errors.topics ? <Text style={ui.fieldError}>{errors.topics}</Text> : null}

      <Text style={[ui.label, { marginTop: space(5) }]}>Message (optional)</Text>
      <TextInput
        style={[ui.input, { minHeight: 90, textAlignVertical: 'top' }]}
        value={f.message}
        onChangeText={(t) => set('message')(t.slice(0, 1000))}
        placeholder="Anything you'd like them to know before replying. Share only what you're comfortable with."
        placeholderTextColor="#A19C94"
        multiline
      />
      <Field label="Preferred times (optional)" value={f.preferred_times} onChangeText={set('preferred_times')} placeholder="e.g. Weekday evenings" style={{ marginTop: space(4) }} />

      <Card tone="cream" style={{ marginBottom: space(4) }}>
        <Text style={[ui.label, { marginBottom: space(3) }]}>What to share</Text>
        <Check checked={f.share_mood_summary} onChange={set('share_mood_summary')}>
          Share a summary of my last 14 days of check-ins (numbers only, like the average and most common feelings, never my notes or chats)
        </Check>
        <Check checked={f.share_phone} onChange={set('share_phone')}>
          Share my phone number once I accept a quote
        </Check>
        {f.share_phone ? <Field value={f.phone} onChangeText={set('phone')} placeholder={phoneHint(user?.country || 'ZA')} keyboardType="phone-pad" error={errors.phone} /> : null}
        <Small>Your full name and email are shared only if you accept a quote. Until then they see just your first name.</Small>
      </Card>

      {err ? <Notice>{err}</Notice> : null}
      <Button title="Send request" onPress={submit} loading={busy} />
      <Small style={{ textAlign: 'center', marginTop: space(3), color: colors.midGray }}>
        Payment is arranged directly with the professional for now.
      </Small>
    </Screen>
  );
}
