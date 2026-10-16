import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { Body, Button, Field, Notice, Screen, Small, Title } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { homeFor } from '../../lib/home';
import { colors, space } from '../../lib/theme';
import { emailError } from '../../lib/validate';


export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const e = {};
    const ee = emailError(email);
    if (ee) e.email = ee;
    if (!password) e.password = 'Enter your password.';
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const u = await login(email.trim(), password, remember);
      router.replace(homeFor(u));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
      <Screen>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingVertical: space(3) }}>
          <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
        </Pressable>
        <Title>Welcome back</Title>
        <Body muted style={{ marginTop: 6, marginBottom: space(6) }}>
          Log in with the same account you use on the website.
        </Body>

        {formError ? <Notice>{formError}</Notice> : null}

        <Field
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secure
          autoComplete="current-password"
          textContentType="password"
          error={errors.password}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(5) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ true: colors.sage, false: colors.lightGray }}
              thumbColor={colors.white}
            />
            <Small style={{ color: colors.charcoal }}>Keep me logged in</Small>
          </View>
          <Link href="/forgot-password">
            <Small style={{ color: colors.sageDark }}>Forgot password?</Small>
          </Link>
        </View>

        <Button title="Log in" onPress={submit} loading={busy} />
        <View style={{ alignItems: 'center', marginTop: space(6) }}>
          <Link href="/signup" replace>
            <Body muted>
              New to MindSpace? <Body style={{ color: colors.sageDark }}>Create an account</Body>
            </Body>
          </Link>
        </View>
      </Screen>
  );
}
