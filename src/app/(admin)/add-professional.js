import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import ProFields, { toPayload, validatePro } from '../../components/ProFields';
import { Body, Button, Chip, Field, Loading, Notice, Screen, styles as ui } from '../../components/ui';
import { api } from '../../lib/api';
import { space } from '../../lib/theme';
import { useProMeta } from '../../lib/useProMeta';
import { emailError, nameError } from '../../lib/validate';

const ALL = ['profession', 'practice', 'about'];

export default function AddProfessional() {
  const meta = useProMeta();
  const [v, setV] = useState({ offers_in_person: true, specialties: [], languages: ['English'] });
  const [acct, setAcct] = useState({ title: '', first_name: '', last_name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!meta) return <Loading />;
  const setA = (k) => (t) => setAcct((a) => ({ ...a, [k]: t }));

  async function submit() {
    const e = validatePro(v, ALL);
    const fe = nameError(acct.first_name, 'First name');
    const le = nameError(acct.last_name, 'Last name');
    const ee = emailError(acct.email);
    if (fe) e.first_name = fe;
    if (le) e.last_name = le;
    if (ee) e.email = ee;
    setErrors(e);
    if (Object.keys(e).length) return setErr('Please fix the highlighted fields.');
    setBusy(true);
    setErr('');
    try {
      const p = await api('/admin/professionals/', { method: 'POST', body: { ...toPayload(v), ...acct, email: acct.email.trim() } });
      router.replace(`/professional/${p.id}`);
    } catch (x) {
      setErrors(x.fields || {});
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={[]}>
      <Body muted style={{ marginVertical: space(4) }}>
        For professionals you've already verified. They're approved straight away and emailed a link to set their own password.
      </Body>
      <Text style={ui.label}>Title (optional)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space(4) }}>
        {meta.titles.map((t) => <Chip key={t} label={t} selected={acct.title === t} onPress={() => setA('title')(acct.title === t ? '' : t)} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field style={{ flex: 1 }} label="First name" value={acct.first_name} onChangeText={setA('first_name')} placeholder="John" error={errors.first_name} />
        <Field style={{ flex: 1 }} label="Last name" value={acct.last_name} onChangeText={setA('last_name')} placeholder="Doe" error={errors.last_name} />
      </View>
      <Field label="Email" value={acct.email} onChangeText={setA('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <ProFields meta={meta} sections={ALL} value={v} onChange={setV} errors={errors} />
      {err ? <Notice>{err}</Notice> : null}
      <Button title="Add and approve" onPress={submit} loading={busy} />
    </Screen>
  );
}
