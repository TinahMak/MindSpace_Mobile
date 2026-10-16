import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Chip, Heading, Loading, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';
import { uploadFile } from '../../../lib/upload';
import { useProMeta } from '../../../lib/useProMeta';

const STATUS = {
  pending: { icon: 'time-outline', tone: colors.terra, bg: colors.terraWash, title: 'Under review', text: "An admin is checking your registration and documents. We'll email you when it's done." },
  approved: { icon: 'checkmark-circle', tone: colors.sageDark, bg: colors.sageWash, title: 'Approved', text: "You're a verified MindSpace professional. Clients can now find you and send requests, which appear in the Requests tab." },
  rejected: { icon: 'alert-circle-outline', tone: colors.error, bg: colors.errorBg, title: 'Changes needed', text: 'Please fix the issue below, then resubmit.' },
  suspended: { icon: 'pause-circle-outline', tone: colors.charcoal, bg: colors.creamDark, title: 'Suspended', text: 'Your profile is suspended. Contact MindSpace support.' },
};

export default function Application() {
  const meta = useProMeta();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [kind, setKind] = useState('registration');
  const [busy, setBusy] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setP(await api('/pro/me/'));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pickAndUpload() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if (a.size && a.size > (meta?.max_doc_mb || 10) * 1024 * 1024) {
      setErr(`That file is larger than ${meta?.max_doc_mb || 10} MB.`);
      return;
    }
    setBusy('upload');
    setErr('');
    try {
      setP(await uploadFile('/pro/documents/', a.uri, { mimeType: a.mimeType || 'application/pdf', parameters: { kind } }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  }

  function remove(doc) {
    Alert.alert('Remove this document?', doc.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setP(await api(`/pro/documents/${doc.id}/`, { method: 'DELETE' }));
          } catch (e) {
            setErr(e.message);
          }
        },
      },
    ]);
  }

  async function resubmit() {
    setBusy('resubmit');
    try {
      setP(await api('/pro/me/resubmit/', { method: 'POST' }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  }

  if (!p && !err) return <Loading />;
  const st = p ? STATUS[p.status] : null;
  const docs = p?.documents || [];
  const locked = p && (p.status === 'approved' || p.status === 'suspended');

  return (
    <Screen edges={[]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.sage} />}>
      {err ? <Notice style={{ marginTop: space(4) }}>{err}</Notice> : null}
      {p ? (
        <>
          <Heading style={{ marginTop: space(4) }}>{p.display_name}</Heading>
          <Small style={{ marginBottom: space(4) }}>{p.profession_label} · {p.regulator_label} {p.registration_number}</Small>

          <View style={[s.status, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={26} color={st.tone} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTitle, { color: st.tone }]}>{st.title}</Text>
              <Text style={s.statusText}>{st.text}</Text>
            </View>
          </View>
          {p.status_reason ? (
            <Card tone="cream" style={{ marginTop: space(3) }}>
              <Small>Note from MindSpace</Small>
              <Body style={{ marginTop: 4 }}>{p.status_reason}</Body>
            </Card>
          ) : null}
          {p.status === 'pending' && !docs.length ? (
            <Notice tone="info" style={{ marginTop: space(3) }}>
              Upload at least one document below. Applications without documents can't be approved.
            </Notice>
          ) : null}

          <Heading style={{ fontSize: 19, marginTop: space(6) }}>Documents</Heading>
          <Small style={{ marginBottom: space(3) }}>PDF, JPG or PNG, up to {meta?.max_doc_mb || 10} MB each. Only you and MindSpace admins can see them.</Small>
          {docs.map((d) => (
            <View key={d.id} style={s.doc}>
              <Ionicons name={d.content_type === 'application/pdf' ? 'document-outline' : 'image-outline'} size={22} color={colors.sageDark} />
              <View style={{ flex: 1 }}>
                <Text style={s.docName} numberOfLines={1}>{d.name}</Text>
                <Small>{d.kind_label} · {Math.max(1, Math.round(d.size / 1024))} KB</Small>
              </View>
              {!locked ? (
                <Pressable onPress={() => remove(d)} hitSlop={8} accessibilityLabel={`Remove ${d.name}`}>
                  <Ionicons name="trash-outline" size={20} color={colors.midGray} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {!locked ? (
            <Card style={{ marginTop: space(3) }}>
              <Text style={s.docName}>Add a document</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: space(3) }}>
                {(meta?.doc_kinds || []).map((k) => (
                  <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />
                ))}
              </View>
              <Button title="Choose file" icon="cloud-upload-outline" variant="outline" onPress={pickAndUpload} loading={busy === 'upload'} />
            </Card>
          ) : null}

          {p.status === 'rejected' ? (
            <Button title="Resubmit for review" onPress={resubmit} loading={busy === 'resubmit'} style={{ marginTop: space(6) }} />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  status: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.md, alignItems: 'flex-start' },
  statusTitle: { fontFamily: fonts.bold, fontSize: 16 },
  statusText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.charcoal, marginTop: 2 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  docName: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.charcoal },
});
