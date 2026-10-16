import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AdminOnly, StatusPill } from '../../components/AdminBits';
import { Button, Card, Field, Notice, Screen, Small } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, fonts, space } from '../../lib/theme';
import { emailError } from '../../lib/validate';

function Admins() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api('/admin/admins/').then(setRows).catch((e) => setMsg({ tone: 'error', text: e.message }));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    const ee = emailError(email);
    if (ee) return setMsg({ tone: 'error', text: ee });
    setBusy(true);
    setMsg(null);
    try {
      setRows(await api('/admin/admins/', { method: 'POST', body: { email } }));
      setMsg({ tone: 'success', text: `${email.trim()} is now an admin.` });
      setEmail('');
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  function remove(u) {
    Alert.alert('Remove admin?', `${u.email} will lose access to the admin panel.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/admin/users/${u.id}/remove-admin/`, { method: 'POST' });
            load();
          } catch (e) {
            setMsg({ tone: 'error', text: e.message });
          }
        },
      },
    ]);
  }

  return (
    <Screen edges={[]}>
      <Card style={{ marginTop: space(3), marginBottom: space(4) }}>
        <Field label="Add an admin" value={email} onChangeText={setEmail} placeholder="Their MindSpace account email" keyboardType="email-address" autoCapitalize="none" />
        <Button title="Make admin" onPress={add} loading={busy} disabled={!email.trim()} />
        <Small style={{ marginTop: space(3) }}>They need a MindSpace account first. Only add people you trust.</Small>
      </Card>
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      {(rows || []).map((u) => (
        <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.creamDark }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal }}>{u.name || u.email}</Text>
            <Small>{u.email}</Small>
          </View>
          {!u.is_owner && u.id !== me?.id ? (
            <Pressable onPress={() => remove(u)} hitSlop={8}>
              <Text style={{ fontFamily: fonts.medium, color: colors.error, fontSize: 13.5 }}>Remove</Text>
            </Pressable>
          ) : (
            <StatusPill u={u} />
          )}
        </View>
      ))}
    </Screen>
  );
}

export default function AdminAdmins() {
  return (
    <AdminOnly>
      <Admins />
    </AdminOnly>
  );
}
