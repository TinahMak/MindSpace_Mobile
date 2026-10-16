import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Select from '../../../components/Select';
import { Body, Button, Chip, Field, Loading, Notice, Screen, Small, Title } from '../../../components/ui';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { colors, fonts, radius, space } from '../../../lib/theme';
import { checkPhone, nameError, phoneHint } from '../../../lib/validate';

export default function SafetyPlanEdit() {
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [plan, setPlan] = useState(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState('');
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [trusted, setTrusted] = useState({ name: '', relationship: null, phone: '' });
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api('/selfcare/meta/'), api('/safety-plan/')]).then(([m, p]) => {
      setMeta(m);
      setPlan(p);
      if (p.trusted) setTrusted({ name: p.trusted.name, relationship: p.trusted.relationship || null, phone: p.trusted.phone });
    }).catch((e) => setErr(e.message));
  }, []);

  if (!meta || !plan) return err ? <Screen edges={[]}><Notice>{err}</Notice></Screen> : <Loading />;
  const steps = [...meta.safety_steps, { key: 'trusted', title: 'My trusted contact', help: 'One person you can call with a single tap from Get help. They are not contacted by MindSpace.' }];
  const S = steps[step];
  const isContacts = S.key === 'people' || S.key === 'professionals';
  const items = plan[S.key] || [];
  const country = user?.country || 'ZA';

  const setItems = (list) => setPlan((p) => ({ ...p, [S.key]: list }));
  const toggle = (text) => setItems(items.includes(text) ? items.filter((x) => x !== text) : [...items, text]);

  function addDraft() {
    const t = draft.trim();
    if (!t) return;
    if (!items.includes(t)) setItems([...items, t]);
    setDraft('');
  }

  function addContact() {
    const e = {};
    const ne = nameError(contact.name, 'Name');
    if (ne) e.cname = ne;
    const ph = checkPhone(contact.phone, country, { required: false });
    if (ph.error) e.cphone = ph.error;
    setErrors(e);
    if (Object.keys(e).length) return;
    setItems([...items, { name: contact.name.trim(), phone: ph.e164 }]);
    setContact({ name: '', phone: '' });
  }

  async function saveAndGo(next) {
    setErr('');
    const body = {};
    if (S.key === 'trusted') {
      if (trusted.phone.trim() || trusted.name.trim()) {
        const e = {};
        const ne = nameError(trusted.name, 'Name');
        if (ne) e.tname = ne;
        const ph = checkPhone(trusted.phone, country);
        if (ph.error) e.tphone = ph.error;
        setErrors(e);
        if (Object.keys(e).length) return;
        body.trusted = { ...trusted, phone: ph.e164 };
      } else body.trusted = {};
    } else {
      body[S.key] = items;
    }
    setBusy(true);
    try {
      setPlan(await api('/safety-plan/', { method: 'PUT', body }));
      if (next >= steps.length) router.back();
      else setStep(next);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={[]}>
      <View style={s.progress}>
        {steps.map((_, i) => <View key={i} style={[s.bar, i < step && { backgroundColor: colors.sageLight }, i === step && s.barOn]} />)}
      </View>
      <Small>Step {step + 1} of {steps.length}</Small>
      <Title style={{ marginTop: space(2), fontSize: 26, lineHeight: 32 }}>{S.title}</Title>
      <Body muted style={{ marginTop: 4, marginBottom: space(5) }}>{S.help}</Body>

      {S.key === 'trusted' ? (
        <>
          <Field label="Name" value={trusted.name} onChangeText={(t) => setTrusted({ ...trusted, name: t })} error={errors.tname} />
          <Select label="Relationship (optional)" value={trusted.relationship} options={meta.relationships} onChange={(v) => setTrusted({ ...trusted, relationship: v })} allowClear />
          <Field label="Phone number" value={trusted.phone} onChangeText={(t) => setTrusted({ ...trusted, phone: t })} keyboardType="phone-pad" placeholder={phoneHint(country)} error={errors.tphone} />
          <Small>Leave empty if you'd rather not add anyone yet.</Small>
        </>
      ) : isContacts ? (
        <>
          {items.map((c, i) => (
            <View key={i} style={s.row}>
              <View style={{ flex: 1 }}><Text style={s.rowText}>{c.name}</Text>{c.phone ? <Small>{c.phone}</Small> : null}</View>
              <Pressable onPress={() => setItems(items.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel={`Remove ${c.name}`}>
                <Ionicons name="close-circle" size={22} color={colors.midGray} />
              </Pressable>
            </View>
          ))}
          <View style={s.addBox}>
            <Field label="Name" value={contact.name} onChangeText={(t) => setContact({ ...contact, name: t })} placeholder={S.key === 'people' ? 'e.g. Sis Zodwa' : 'e.g. Ms Mtsweni (social worker)'} error={errors.cname} />
            <Field label="Phone (optional)" value={contact.phone} onChangeText={(t) => setContact({ ...contact, phone: t })} keyboardType="phone-pad" placeholder={phoneHint(country)} error={errors.cphone} />
            <Button title="Add" icon="add" variant="outline" onPress={addContact} />
          </View>
        </>
      ) : (
        <>
          {S.suggestions.length ? <Small style={{ marginBottom: space(2) }}>Tap any that fit you:</Small> : null}
          <View style={s.wrap}>
            {S.suggestions.map((x) => <Chip key={x} label={x} selected={items.includes(x)} onPress={() => toggle(x)} />)}
            {items.filter((x) => !S.suggestions.includes(x)).map((x) => <Chip key={x} label={`${x}  ✕`} selected onPress={() => toggle(x)} />)}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: space(4) }}>
            <Field style={{ flex: 1, marginBottom: 0 }} value={draft} onChangeText={setDraft} placeholder="Add your own" onSubmitEditing={addDraft} returnKeyType="done" />
            <Button title="Add" variant="outline" onPress={addDraft} style={{ minHeight: 48 }} />
          </View>
        </>
      )}

      {err ? <Notice style={{ marginTop: space(4) }}>{err}</Notice> : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: space(7) }}>
        {step > 0 ? <Button title="Back" variant="outline" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
        <Button title={step === steps.length - 1 ? 'Save plan' : 'Next'} onPress={() => saveAndGo(step + 1)} loading={busy} style={{ flex: 2 }} />
      </View>
      {step < steps.length - 1 ? <Button title="Skip this step" variant="ghost" onPress={() => setStep(step + 1)} style={{ marginTop: 4 }} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 5, marginTop: space(4), marginBottom: space(2) },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.lightGray },
  barOn: { backgroundColor: colors.sage },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  rowText: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
  addBox: { marginTop: space(4), padding: space(4), borderRadius: radius.md, backgroundColor: colors.cream },
});
