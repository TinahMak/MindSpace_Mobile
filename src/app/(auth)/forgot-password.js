import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Body, Button, Field, Notice, Screen, Title } from '../../components/ui';
import { api } from '../../lib/api';
import { colors, space } from '../../lib/theme';
import { emailError } from '../../lib/validate';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    const ee = emailError(email);
    if (ee) {
      setErr(ee);
      return;
    }
    setBusy(true);
    try {
      const r = await api('/auth/password-reset/', { method: 'POST', body: { email: email.trim() }, auth: false });
      setMsg(r.detail);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingVertical: space(3) }}>
        <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
      </Pressable>
      <Title>Reset your password</Title>
      <Body muted style={{ marginTop: 6, marginBottom: space(6) }}>
        We'll email you a link. You'll set the new password on the MindSpace website, then log in here.
      </Body>
      {msg ? <Notice tone="success">{msg}</Notice> : null}
      {err ? <Notice>{err}</Notice> : null}
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Send reset link" onPress={submit} loading={busy} />
    </Screen>
  );
}
