import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { View } from 'react-native';

import ProFields, { toPayload, validatePro } from '../../../components/ProFields';
import { Button, Card, Field, Heading, Loading, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { preciseLocation } from '../../../lib/location';
import { space } from '../../../lib/theme';
import { useProMeta } from '../../../lib/useProMeta';
import { nameError } from '../../../lib/validate';

const ALL = ['profession', 'practice', 'about'];

export default function ProProfile() {
  const meta = useProMeta();
  const [v, setV] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);

  async function setPracticeLocation() {
    setLocBusy(true);
    try {
      const loc = await preciseLocation();
      const p = await api('/pro/me/', { method: 'PATCH', body: loc });
      setV((cur) => ({ ...cur, latitude: p.latitude, longitude: p.longitude }));
      setMsg({ tone: 'success', text: 'Practice location saved. Clients nearby will now see an accurate distance.' });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    } finally {
      setLocBusy(false);
    }
  }

  function askLocation() {
    Alert.alert('Use this spot as your practice?', 'Only do this while you are at your practice. Clients see the distance, not your exact coordinates.', [
      { text: 'Cancel', style: 'cancel' },
      { text: "I'm at my practice", onPress: setPracticeLocation },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      api('/pro/me/').then((p) => setV({ ...p, years_experience: String(p.years_experience ?? '') })).catch((e) => setMsg({ tone: 'error', text: e.message }));
    }, []),
  );

  async function save() {
    const e = validatePro(v, ALL);
    const fe = nameError(v.first_name, 'First name');
    const le = nameError(v.last_name, 'Last name');
    if (fe) e.first_name = fe;
    if (le) e.last_name = le;
    setErrors(e);
    if (Object.keys(e).length) return setMsg({ tone: 'error', text: 'Please fix the highlighted fields.' });
    setBusy(true);
    setMsg(null);
    try {
      const { documents, ...rest } = toPayload(v);
      const p = await api('/pro/me/', { method: 'PATCH', body: rest });
      setV({ ...p, years_experience: String(p.years_experience ?? '') });
      setMsg(
        p.sent_for_review
          ? { tone: 'info', text: 'Saved. Because your registration details changed, your profile is being reviewed again.' }
          : { tone: 'success', text: 'Profile saved.' },
      );
    } catch (err) {
      setErrors(err.fields || {});
      setMsg({ tone: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (!meta || !v) return msg ? <Screen edges={[]}><Notice>{msg.text}</Notice></Screen> : <Loading />;
  const suspended = v.status === 'suspended';

  return (
    <Screen edges={[]}>
      <View style={{ height: space(4) }} />
      {suspended ? <Notice>Your profile is suspended, so it can't be edited.</Notice> : null}
      <Heading style={{ fontSize: 19, marginBottom: space(3) }}>Name</Heading>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field style={{ flex: 1 }} label="First name" value={v.first_name || ''} onChangeText={(t) => setV({ ...v, first_name: t })} error={errors.first_name} />
        <Field style={{ flex: 1 }} label="Last name" value={v.last_name || ''} onChangeText={(t) => setV({ ...v, last_name: t })} error={errors.last_name} />
      </View>
      {v.status === 'approved' ? (
        <Notice tone="info">Changing your profession, registering body or registration number sends your profile back for review.</Notice>
      ) : null}
      <ProFields meta={meta} sections={ALL} value={v} onChange={setV} errors={errors} />
      {v.offers_in_person !== false ? (
        <Card tone="cream" style={{ marginBottom: space(4) }}>
          <Heading style={{ fontSize: 17 }}>Practice location</Heading>
          <Small style={{ marginVertical: space(2) }}>
            {v.latitude != null ? 'Set. Clients see an accurate distance to your practice.' : `Not set. Clients see an approximate distance based on ${v.city || 'your city'}.`}
          </Small>
          <Button title={v.latitude != null ? 'Update to where I am now' : "Set to where I am now"} icon="location-outline" variant="outline" onPress={askLocation} loading={locBusy} disabled={suspended} />
        </Card>
      ) : null}
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      <Button title="Save profile" onPress={save} loading={busy} disabled={suspended} />
    </Screen>
  );
}
