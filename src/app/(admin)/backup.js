import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { AdminOnly } from '../../components/AdminBits';
import { Body, Button, Card, Heading, Loading, Notice, Screen, Small } from '../../components/ui';
import { api } from '../../lib/api';
import { colors, fonts, radius, space } from '../../lib/theme';

function sizeLabel(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function when(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function Pill({ status }) {
  const [label, bg, fg] = {
    success: ['Done', colors.sageWash, colors.sageDark],
    running: ['Running', colors.cream, colors.charcoal],
    failed: ['Failed', colors.terraWash, colors.terra],
  }[status] || [status, colors.cream, colors.charcoal];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

function Backups() {
  const [info, setInfo] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setInfo(await api('/admin/backup/'));
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function runBackup() {
    setBusy(true);
    setMsg(null);
    try {
      // Building and uploading can take a while, so allow up to 10 minutes.
      const res = await api('/admin/backup/', { method: 'POST', timeout: 10 * 60 * 1000 });
      setMsg({ tone: 'success', text: `Backup saved to Google Drive (${res.backup.drive_account}).` });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    } finally {
      setBusy(false);
      load();
    }
  }

  function confirm() {
    Alert.alert(
      'Back up now?',
      `This copies the whole database and all uploaded files to Google Drive${info?.account ? ` (${info.account})` : ''}.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Back up', onPress: runBackup }],
    );
  }

  if (!info && !msg) return <Loading label="Loading backups" />;

  return (
    <Screen edges={[]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Card style={{ marginTop: space(4) }}>
        <Heading style={{ fontSize: 20 }}>Google Drive</Heading>
        {info?.connected ? (
          <Body muted>Connected to {info.account}</Body>
        ) : (
          <Body muted>Not connected yet</Body>
        )}
        {info?.expected_account ? <Small style={{ marginTop: 4 }}>Backups must go to {info.expected_account}</Small> : null}
        <Small style={{ marginTop: 4 }}>Folder: {info?.folder || 'MindSpace Backups'}</Small>
      </Card>

      {msg ? <Notice tone={msg.tone} style={{ marginTop: space(4) }}>{msg.text}</Notice> : null}

      {info && !info.connected ? (
        <Card tone="cream" style={{ marginTop: space(4) }}>
          <Body>One-time setup: on the computer that runs Django, open a terminal in mindspace_backend and run:</Body>
          <Text selectable style={{ fontFamily: fonts.medium, marginTop: 6, color: colors.charcoal }}>python manage.py gdrive_connect</Text>
          <Small style={{ marginTop: 6 }}>Then pull down here to refresh.</Small>
        </Card>
      ) : null}

      {info?.can_run ? (
        <Button
          title={busy ? 'Backing up… this can take a minute' : 'Back up to Google Drive now'}
          icon="cloud-upload-outline"
          loading={busy}
          disabled={busy || !info.connected}
          onPress={confirm}
          style={{ marginTop: space(4) }}
        />
      ) : info ? (
        <Small style={{ marginTop: space(4) }}>Only the owner account can start a backup, because backups contain everyone's private data.</Small>
      ) : null}

      <Heading style={{ fontSize: 18, marginTop: space(6), marginBottom: space(2) }}>History</Heading>
      {info?.backups?.length ? (
        info.backups.map((b) => (
          <Card key={b.id} style={{ marginBottom: space(3) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: fonts.medium, color: colors.charcoal, flex: 1 }}>{when(b.started_at)}</Text>
              <Pill status={b.status} />
            </View>
            {b.status === 'success' ? (
              <Small style={{ marginTop: 4 }}>
                {sizeLabel(b.size_bytes)} · {b.records} records · {b.media_files} files · by {b.started_by}
              </Small>
            ) : null}
            {b.error ? <Small style={{ marginTop: 4, color: colors.error }}>{b.error}</Small> : null}
            {b.drive_link ? (
              <Pressable onPress={() => Linking.openURL(b.drive_link)} hitSlop={6} style={{ marginTop: 6 }}>
                <Text style={{ fontFamily: fonts.medium, color: colors.sageDark, fontSize: 13.5 }}>Open in Google Drive</Text>
              </Pressable>
            ) : null}
          </Card>
        ))
      ) : (
        <Small>No backups yet.</Small>
      )}

      <Small style={{ marginTop: space(4) }}>
        Backups contain personal and health information. They are kept only in the Google Drive account above, and every backup is recorded in the audit log.
      </Small>
    </Screen>
  );
}

export default function AdminBackup() {
  return (
    <AdminOnly>
      <Backups />
    </AdminOnly>
  );
}
