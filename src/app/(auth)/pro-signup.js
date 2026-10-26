import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ProFields, { toPayload, validatePro } from '../../components/ProFields';
import { Body, Button, Check, Chip, Field, Loading, Notice, Screen, Small, Title, styles as ui } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { SITE_URL } from '../../lib/config';
import { colors, space } from '../../lib/theme';
import { useProMeta } from '../../lib/useProMeta';
import { emailError, nameError } from '../../lib/validate';

const STEPS = [
  { title: 'Join as a professional', sub: 'Create your account. You will use it to manage your MindSpace profile.', sections: [] },
  { title: 'Your registration', sub: 'An admin checks these details against the public register before approving you.', sections: ['profession'] },
  { title: 'Your practice', sub: 'Where and how you see clients, and what you charge.', sections: ['practice'] },
  { title: 'About your work', sub: 'This helps MindSpace suggest you to the right people.', sections: ['about'] },
];
const FIELD_STEP = { contact_phone: 2, email: 0, first_name: 0, last_name: 0, password: 0, profession: 1, regulator: 1, regulator_other: 1, registration_number: 1, qualifications: 1, years_experience: 1, city: 2, province: 2, offers_online: 2, fee_min: 2, fee_max: 2, specialties: 3, languages: 3 };

export default function ProSignup() {
  const meta = useProMeta();
  const { proSignup } = useAuth();
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ offers_in_person: true, specialties: [], languages: ['English'] });
  const [acct, setAcct] = useState({ title: '', first_name: '', last_name: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState({ terms: false, declaration: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!meta) return <Screen><Loading /></Screen>;
  const setA = (k) => (t) => setAcct((a) => ({ ...a, [k]: t }));

  function validate(n) {
    let e = {};
    if (n === 0) {
      const fe = nameError(acct.first_name, 'First name');
      const le = nameError(acct.last_name, 'Last name');
      const ee = emailError(acct.email, { strict: true });
      if (fe) e.first_name = fe;
      if (le) e.last_name = le;
      if (ee) e.email = ee;
      if (acct.password.length < 8) e.password = 'Use at least 8 characters.';
      else if (acct.password !== acct.confirm) e.confirm = "Passwords don't match.";
    } else {
      e = validatePro(v, STEPS[n].sections);
      if (n === 3) {
        if (!agree.terms) e.terms = 'You must agree to continue.';
        if (!agree.declaration) e.declaration = 'Please confirm your details are true.';
      }
    }
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function next() {
    setFormError('');
    if (!validate(step)) return;
    if (step < 3) return setStep(step + 1);
    setBusy(true);
    try {
      await proSignup({
        ...toPayload(v),
        title: acct.title,
        first_name: acct.first_name.trim(),
        last_name: acct.last_name.trim(),
        email: acct.email.trim(),
        password: acct.password,
        terms_accepted: agree.terms,
        declaration: agree.declaration,
      });
      router.replace('/application');
    } catch (err) {
      const field = Object.keys(err.fields || {}).find((k) => k in FIELD_STEP);
      if (field) {
        setStep(FIELD_STEP[field]);
        setErrors({ [field]: err.fields[field] });
      } else setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const S = STEPS[step];
  return (
      <Screen>
        <View style={s.head}>
          <Pressable onPress={() => (step ? setStep(step - 1) : router.back())} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
          </Pressable>
          <View style={s.progress}>
            {STEPS.map((_, i) => (
              <View key={i} style={[s.bar, i < step && { backgroundColor: colors.sageLight }, i === step && s.barOn]} />
            ))}
            <Small style={{ marginLeft: 6 }}>Step {step + 1} of 4</Small>
          </View>
        </View>
        <Title>{S.title}</Title>
        <Body muted style={{ marginTop: 6, marginBottom: space(6) }}>{S.sub}</Body>
        {formError ? <Notice>{formError}</Notice> : null}

        {step === 0 ? (
          <>
            <Text style={ui.label}>Title (optional)</Text>
            <View style={[s.wrap, { marginBottom: space(4) }]}>
              {meta.titles.map((t) => (
                <Chip key={t} label={t} selected={acct.title === t} onPress={() => setA('title')(acct.title === t ? '' : t)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Field style={{ flex: 1 }} label="First name" value={acct.first_name} onChangeText={setA('first_name')} placeholder="John" error={errors.first_name} />
              <Field style={{ flex: 1 }} label="Last name" value={acct.last_name} onChangeText={setA('last_name')} placeholder="Doe" error={errors.last_name} />
            </View>
            <Field label="Work email" value={acct.email} onChangeText={setA('email')} placeholder="you@practice.co.za" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
            <Field label="Password" value={acct.password} onChangeText={setA('password')} secure placeholder="Min. 8 characters" error={errors.password} />
            <Field label="Confirm password" value={acct.confirm} onChangeText={setA('confirm')} secure error={errors.confirm} />
          </>
        ) : (
          <ProFields meta={meta} sections={S.sections} value={v} onChange={setV} errors={errors} />
        )}

        {step === 3 ? (
          <View style={{ marginTop: space(2) }}>
            <Check checked={agree.declaration} onChange={(x) => setAgree((a) => ({ ...a, declaration: x }))} error={errors.declaration}>
              I confirm these details are true and that I am currently registered to practise.
            </Check>
            <Check checked={agree.terms} onChange={(x) => setAgree((a) => ({ ...a, terms: x }))} error={errors.terms}>
              I agree to the Terms of Service and{' '}
              <Text style={{ color: colors.sageDark, textDecorationLine: 'underline' }} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy/`)}>
                Privacy Policy
              </Text>
            </Check>
          </View>
        ) : null}

        <Button title={step < 3 ? 'Continue' : 'Create my account'} onPress={next} loading={busy} style={{ marginTop: space(4) }} />
        <Small style={{ textAlign: 'center', marginTop: space(4) }}>
          After signing up you'll upload your registration certificate and qualifications.
        </Small>
      </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space(3) },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { width: 20, height: 4, borderRadius: 2, backgroundColor: colors.lightGray },
  barOn: { width: 32, backgroundColor: colors.sage },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
