import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import DateField from '../../components/DateField';
import Select from '../../components/Select';
import FocusPicker, { validateFocus } from '../../components/FocusPicker';
import { Body, Button, Check, Chip, Field, Notice, Screen, Small, Title, styles as ui } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { SITE_URL } from '../../lib/config';
import { colors, fonts, radius, space } from '../../lib/theme';
import { useMeta } from '../../lib/useMeta';
import { MIN_AGE, checkPhone, emailError, nameError, phoneHint, toISODate } from '../../lib/validate';


function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { pct: 25, color: '#E74C3C', text: 'Weak: add numbers and symbols' };
  if (score <= 2) return { pct: 50, color: '#E67E22', text: 'Fair: add uppercase and special characters' };
  if (score <= 3) return { pct: 75, color: '#B7860B', text: 'Good: almost there' };
  return { pct: 100, color: colors.sageDark, text: 'Strong password' };
}

export default function Signup() {
  const { signup } = useAuth();
  const meta = useMeta();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    first_name: '',
    last_name: '',
    email: '',
    dob: null,
    country: 'ZA',
    password: '',
    confirm: '',
    focus: [],
    focus_other: '',
    phone: '',
    terms: false,
    marketing: false,
    age: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const today = new Date();
  const maxDob = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
  const minDob = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  function validate(n) {
    const e = {};
    if (n === 1) {
      const fe = nameError(f.first_name, 'First name');
      const le = nameError(f.last_name, 'Last name');
      const ee = emailError(f.email);
      if (fe) e.first_name = fe;
      if (le) e.last_name = le;
      if (ee) e.email = ee;
      if (!f.dob) e.dob = 'Choose your date of birth.';
    }
    if (n === 2) {
      if (f.password.length < 8) e.password = 'Use at least 8 characters.';
      if (!f.confirm) e.confirm = 'Confirm your password.';
      else if (f.confirm !== f.password) e.confirm = "Passwords don't match.";
    }
    if (n === 3) {
      Object.assign(e, validateFocus(f.focus, f.focus_other));
      const ph = checkPhone(f.phone, f.country);
      if (ph.error) e.phone = ph.error;
      if (!f.terms) e.terms = 'You must agree to continue.';
      if (!f.age) e.age = `You must confirm you are ${meta.min_age} or older.`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    setFormError('');
    if (validate(step)) setStep(step + 1);
  }

  async function submit() {
    setFormError('');
    if (!validate(3)) return;
    setBusy(true);
    try {
      await signup({
        first_name: f.first_name.trim(),
        last_name: f.last_name.trim(),
        email: f.email.trim(),
        date_of_birth: toISODate(f.dob),
        country: f.country,
        password: f.password,
        focus: f.focus,
        focus_other: f.focus.includes('other') ? f.focus_other.trim() : '',
        phone: checkPhone(f.phone, f.country).e164,
        marketing_opt_in: f.marketing,
        terms_accepted: f.terms,
        age_confirmed: f.age,
      });
      router.replace('/today');
    } catch (err) {
      // Send the person back to the step that holds the problem field.
      const map = { first_name: 1, last_name: 1, email: 1, date_of_birth: 1, password: 2, focus: 3, focus_other: 3, phone: 3, country: 3 };
      const field = Object.keys(err.fields || {}).find((k) => map[k]);
      if (field) {
        setStep(map[field]);
        setErrors({ [field === 'date_of_birth' ? 'dob' : field]: err.fields[field] });
      } else {
        setFormError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  const pw = f.password ? strength(f.password) : null;

  return (
      <Screen>
        <View style={s.head}>
          <Pressable onPress={() => (step > 1 ? setStep(step - 1) : router.back())} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
          </Pressable>
          <View style={s.progress} accessibilityLabel={`Step ${step} of 3`}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[s.bar, i < step && { backgroundColor: colors.sageLight }, i === step && s.barOn]}
              />
            ))}
            <Small style={{ marginLeft: 6 }}>Step {step} of 3</Small>
          </View>
        </View>

        <Title>{step === 1 ? 'Create your account' : step === 2 ? 'Choose a password' : 'A little about you'}</Title>
        <Body muted style={{ marginTop: 6, marginBottom: space(6) }}>
          {step === 1
            ? 'Your account works on the app and the website.'
            : step === 2
              ? 'At least 8 characters. A mix of letters, numbers and symbols is strongest.'
              : 'This helps MindSpace fit what you need. You can change it later.'}
        </Body>

        {formError ? <Notice>{formError}</Notice> : null}

        {step === 1 && (
          <>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Field
                style={{ flex: 1 }}
                label="First name"
                value={f.first_name}
                onChangeText={set('first_name')}
                placeholder="John"
                autoComplete="given-name"
                error={errors.first_name}
              />
              <Field
                style={{ flex: 1 }}
                label="Last name"
                value={f.last_name}
                onChangeText={set('last_name')}
                placeholder="Doe"
                autoComplete="family-name"
                error={errors.last_name}
              />
            </View>
            <Field
              label="Email address"
              value={f.email}
              onChangeText={set('email')}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <DateField
              label="Date of birth"
              value={f.dob}
              onChange={set('dob')}
              maximumDate={maxDob}
              minimumDate={minDob}
              initial={new Date(today.getFullYear() - 25, 0, 1)}
              placeholder="Choose your date of birth"
              error={errors.dob}
              hint={`You must be ${MIN_AGE} or older to use MindSpace.`}
            />
            <Button title="Continue" onPress={next} style={{ marginTop: space(7) }} />
          </>
        )}

        {step === 2 && (
          <>
            <Field
              label="Create a password"
              value={f.password}
              onChangeText={set('password')}
              placeholder="Min. 8 characters"
              secure
              autoComplete="new-password"
              textContentType="newPassword"
              error={errors.password}
              style={{ marginBottom: pw ? space(2) : space(4) }}
            />
            {pw ? (
              <View style={{ marginBottom: space(4) }}>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${pw.pct}%`, backgroundColor: pw.color }]} />
                </View>
                <Small style={{ color: pw.color, marginTop: 4 }}>{pw.text}</Small>
              </View>
            ) : null}
            <Field
              label="Confirm password"
              value={f.confirm}
              onChangeText={set('confirm')}
              placeholder="Repeat your password"
              secure
              autoComplete="new-password"
              error={errors.confirm}
              hint={f.confirm && f.confirm === f.password ? 'Passwords match' : undefined}
            />
            <Button title="Continue" onPress={next} style={{ marginTop: space(3) }} />
          </>
        )}

        {step === 3 && (
          <>
            <FocusPicker
              choices={meta.focus_choices}
              value={f.focus}
              onChange={set('focus')}
              otherText={f.focus_other}
              onOtherText={set('focus_other')}
              error={errors.focus}
              otherError={errors.focus_other}
            />

            <Select label="Country" value={f.country} options={meta.countries} onChange={set('country')} />
            <Field
              label="Phone number"
              value={f.phone}
              onChangeText={set('phone')}
              placeholder={phoneHint(f.country)}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
              hint={f.country === 'OTHER' ? 'Include your country code, starting with +.' : undefined}
            />

            <Check checked={f.terms} onChange={set('terms')} error={errors.terms}>
              I agree to the Terms of Service and{' '}
              <Text
                style={{ color: colors.sageDark, textDecorationLine: 'underline' }}
                onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy/`)}
              >
                Privacy Policy
              </Text>
            </Check>
            <Check checked={f.marketing} onChange={set('marketing')}>
              Send me occasional wellness tips and product updates. You can unsubscribe any time.
            </Check>
            <Check checked={f.age} onChange={set('age')} error={errors.age}>
              I confirm that I am {meta.min_age} years of age or older
            </Check>

            <Button title="Create my account" onPress={submit} loading={busy} style={{ marginTop: space(3) }} />
          </>
        )}

        <Small style={{ textAlign: 'center', marginTop: space(6) }}>
          MindSpace is not a substitute for professional mental health treatment.
        </Small>
      </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space(3) },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { width: 24, height: 4, borderRadius: 2, backgroundColor: colors.lightGray },
  barOn: { width: 36, backgroundColor: colors.sage },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.lightGray, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
