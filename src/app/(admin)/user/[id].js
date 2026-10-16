import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { AdminOnly, StatTile, StatusPill } from '../../../components/AdminBits';
import { Body, Button, Card, Field, Heading, Loading, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { colors, fonts, radius, space } from '../../../lib/theme';

function Detail() {
  const { id } = useLocalSearchParams();
  const { user: me } = useAuth();
  const [u, setU] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [delOpen, setDelOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [delErr, setDelErr] = useState('');

  const load = useCallback(() => {
    api(`/admin/users/${id}/`).then(setU).catch((e) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function act(action, confirmText) {
    const go = async () => {
      setBusy(action);
      setErr('');
      try {
        setU(await api(`/admin/users/${id}/${action}/`, { method: 'POST' }));
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy('');
      }
    };
    if (confirmText) Alert.alert('Are you sure?', confirmText, [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes', onPress: go }]);
    else go();
  }

  async function del() {
    setBusy('delete');
    setDelErr('');
    try {
      await api(`/admin/users/${id}/delete/`, { method: 'POST', body: { confirm_email: confirm } });
      setDelOpen(false);
      router.back();
    } catch (e) {
      setDelErr(e.message);
    } finally {
      setBusy('');
    }
  }

  if (!u && !err) return <Loading />;
  const self = u && me && u.id === me.id;

  return (
    <Screen edges={[]}>
      {err ? <Notice style={{ marginTop: space(3) }}>{err}</Notice> : null}
      {u ? (
        <>
          <View style={{ marginTop: space(3), marginBottom: space(4), gap: 6 }}>
            <Heading>{u.name || u.email}</Heading>
            <Body muted>{u.email}</Body>
            <StatusPill u={u} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <StatTile value={u.mood_entries} label={`Check-ins (${u.mood_entries_7d} this week)`} />
            <StatTile value={u.conversations} label="Conversations" />
            <StatTile value={u.messages} label="Messages sent" />
            <StatTile value={u.rating ? `${u.rating.stars}★` : null} label="Their app rating" />
          </View>
          <Small style={{ marginTop: space(3) }}>
            Joined {new Date(u.date_joined).toLocaleDateString()} · {u.email_verified ? 'Email verified' : 'Email not verified'}
            {'\n'}For privacy, mood notes and chats are never shown to admins.
          </Small>

          {self ? (
            <Notice tone="info" style={{ marginTop: space(5) }}>This is your own account.</Notice>
          ) : (
            <View style={{ gap: space(3), marginTop: space(5) }}>
              {u.is_active ? (
                <Button title="Suspend account" variant="help" loading={busy === 'suspend'} onPress={() => act('suspend', `${u.email} will be signed out and unable to log in.`)} />
              ) : (
                <Button title="Reactivate account" loading={busy === 'reactivate'} onPress={() => act('reactivate')} />
              )}
              {u.is_admin && !u.is_owner ? (
                <Button title="Remove admin rights" variant="outline" loading={busy === 'remove-admin'} onPress={() => act('remove-admin', `Remove admin rights from ${u.email}?`)} />
              ) : !u.is_admin && u.is_active ? (
                <Button title="Make admin" variant="outline" loading={busy === 'make-admin'} onPress={() => act('make-admin', `${u.email} will be able to manage all accounts.`)} />
              ) : null}
              {!u.is_owner ? (
                <Card style={{ borderColor: '#F0C9C4', marginTop: space(2) }}>
                  <Text style={{ fontFamily: fonts.medium, color: colors.error, fontSize: 15 }}>Delete account</Text>
                  <Small style={{ marginVertical: space(2) }}>Permanently deletes this account and all its data.</Small>
                  <Button title="Delete permanently" variant="danger" onPress={() => setDelOpen(true)} />
                </Card>
              ) : null}
            </View>
          )}

          <Modal visible={delOpen} transparent animationType="fade" onRequestClose={() => setDelOpen(false)}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: 'rgba(44,44,44,0.45)', justifyContent: 'center', padding: space(5) }}>
              <View style={{ backgroundColor: colors.warmWhite, borderRadius: radius.lg, padding: space(6) }}>
                <Heading>Delete {u.email}?</Heading>
                <Body muted style={{ marginVertical: space(3) }}>This can't be undone. Type their email to confirm.</Body>
                <Field value={confirm} onChangeText={setConfirm} placeholder={u.email} autoCapitalize="none" error={delErr} />
                <Button title="Delete permanently" variant="danger" onPress={del} loading={busy === 'delete'} />
                <Button title="Cancel" variant="ghost" onPress={() => { setDelOpen(false); setConfirm(''); setDelErr(''); }} style={{ marginTop: 6 }} />
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      ) : null}
    </Screen>
  );
}

export default function AdminUser() {
  return (
    <AdminOnly>
      <Detail />
    </AdminOnly>
  );
}
