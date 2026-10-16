import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Body, Button, Card, Heading, Loading, Notice, Screen, Small, styles as ui } from '../../../components/ui';
import { api, getAuthToken } from '../../../lib/api';
import { API_URL } from '../../../lib/config';
import { colors, fonts, radius, space } from '../../../lib/theme';
import { useProMeta } from '../../../lib/useProMeta';
import { STATUS_STYLE } from '../(tabs)/professionals';

export default function ProfessionalReview() {
  const { id } = useLocalSearchParams();
  const meta = useProMeta();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [opening, setOpening] = useState(null);
  const [ask, setAsk] = useState(null); // 'reject' | 'suspend'
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    api(`/admin/professionals/${id}/`).then(setP).catch((e) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function act(action, why = '') {
    setBusy(action);
    setErr('');
    try {
      setP(await api(`/admin/professionals/${id}/${action}/`, { method: 'POST', body: { reason: why } }));
      setAsk(null);
      setReason('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  }

  async function openDoc(d) {
    setOpening(d.id);
    try {
      const ext = d.content_type === 'application/pdf' ? 'pdf' : d.content_type === 'image/png' ? 'png' : 'jpg';
      const dest = new File(Paths.cache, `mindspace-doc-${d.id}.${ext}`);
      const file = await File.downloadFileAsync(`${API_URL}/documents/${d.id}/file/`, dest, {
        headers: { Authorization: `Token ${getAuthToken()}` },
        idempotent: true,
      });
      await Sharing.shareAsync(file.uri, { mimeType: d.content_type, dialogTitle: d.name });
    } catch {
      Alert.alert("Couldn't open the document", 'Check your connection and try again.');
    } finally {
      setOpening(null);
    }
  }

  if (!p && !err) return <Loading />;
  if (!p) return <Screen edges={[]}><Notice style={{ marginTop: space(4) }}>{err}</Notice></Screen>;
  const [bg, fg, label] = STATUS_STYLE[p.status];
  const specs = Object.fromEntries((meta?.specialties || []).map((x) => [x.value, x.label]));
  const fee = p.fee_min || p.fee_max ? `R${p.fee_min ?? '?'} to R${p.fee_max ?? '?'}` : 'Not given';

  return (
    <Screen edges={[]}>
      <View style={{ marginTop: space(4), gap: 6 }}>
        <Heading>{p.display_name}</Heading>
        <Body muted>{p.profession_label} · {p.email}</Body>
        <View style={[s.pill, { backgroundColor: bg }]}><Text style={[s.pillText, { color: fg }]}>{label}{p.created_by_admin ? ' · added by admin' : ''}</Text></View>
      </View>
      {err ? <Notice style={{ marginTop: space(3) }}>{err}</Notice> : null}
      {p.status_reason ? <Card tone="cream" style={{ marginTop: space(3) }}><Small>Reason on file</Small><Body>{p.status_reason}</Body></Card> : null}

      <Card style={{ marginTop: space(4) }}>
        <Row k="Registered with" v={p.regulator_label} />
        <Row k="Registration no." v={p.registration_number} bold />
        <Row k="Qualifications" v={p.qualifications} />
        <Row k="Experience" v={`${p.years_experience} years`} />
        <Notice tone="info" style={{ marginTop: space(3), marginBottom: 0 }}>
          Check this number on the {p.regulator} public register, and that the name and profession match the documents, before approving.
        </Notice>
      </Card>

      <Heading style={{ fontSize: 18, marginTop: space(5), marginBottom: space(2) }}>Documents ({p.documents.length})</Heading>
      {p.documents.length === 0 ? <Small>No documents uploaded yet.</Small> : null}
      {p.documents.map((d) => (
        <Pressable key={d.id} onPress={() => openDoc(d)} style={s.doc}>
          <Ionicons name={d.content_type === 'application/pdf' ? 'document-outline' : 'image-outline'} size={22} color={colors.sageDark} />
          <View style={{ flex: 1 }}>
            <Text style={s.docName} numberOfLines={1}>{d.name}</Text>
            <Small>{d.kind_label}</Small>
          </View>
          {opening === d.id ? <ActivityIndicator color={colors.sage} /> : <Ionicons name="open-outline" size={18} color={colors.midGray} />}
        </Pressable>
      ))}

      <Card style={{ marginTop: space(5) }}>
        <Row k="Practice" v={p.practice_name || '–'} />
        <Row k="Location" v={[p.address, p.city, p.province].filter(Boolean).join(', ')} />
        <Row k="Sessions" v={[p.offers_in_person && 'In person', p.offers_online && 'Online'].filter(Boolean).join(' and ')} />
        <Row k="Fees" v={`${fee}${p.accepts_medical_aid ? ' · medical aid' : ''}`} />
        <Row k="Focus areas" v={p.specialties.map((x) => specs[x] || x).join(', ')} />
        <Row k="Languages" v={p.languages.join(', ')} />
        {p.bio ? <Row k="Bio" v={p.bio} /> : null}
      </Card>

      <View style={{ gap: space(3), marginTop: space(6) }}>
        {(p.status === 'pending' || p.status === 'rejected') && (
          <Button title="Approve" loading={busy === 'approve'} onPress={() => Alert.alert('Approve?', `Only approve ${p.display_name} after checking the register.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Approve', onPress: () => act('approve') }])} />
        )}
        {p.status === 'pending' && <Button title="Reject with reason" variant="outline" onPress={() => setAsk('reject')} />}
        {p.status === 'approved' && <Button title="Suspend" variant="help" onPress={() => setAsk('suspend')} />}
        {p.status === 'suspended' && <Button title="Reinstate" loading={busy === 'reinstate'} onPress={() => act('reinstate')} />}
      </View>

      <Modal visible={!!ask} transparent animationType="fade" onRequestClose={() => setAsk(null)}>
        <KeyboardAvoidingView behavior="padding" style={s.backdrop}>
          <View style={s.sheet}>
            <Heading>{ask === 'reject' ? 'Reject application' : 'Suspend professional'}</Heading>
            <Body muted style={{ marginVertical: space(3) }}>
              {ask === 'reject' ? 'They will see this reason and can fix it and resubmit.' : 'Give a short reason. It is saved in the audit log.'}
            </Body>
            <TextInput
              style={[ui.input, { minHeight: 90, textAlignVertical: 'top' }]}
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder={ask === 'reject' ? 'e.g. Registration number not found on the HPCSA register' : 'Reason'}
              placeholderTextColor="#A19C94"
            />
            <Button title={ask === 'reject' ? 'Reject' : 'Suspend'} variant={ask === 'reject' ? 'dark' : 'help'} onPress={() => act(ask, reason)} loading={busy === ask} style={{ marginTop: space(4) }} />
            <Button title="Cancel" variant="ghost" onPress={() => { setAsk(null); setReason(''); }} style={{ marginTop: 6 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function Row({ k, v, bold }) {
  return (
    <View style={{ paddingVertical: 6 }}>
      <Small>{k}</Small>
      <Text style={{ fontFamily: bold ? fonts.bold : fonts.body, fontSize: 14.5, color: colors.charcoal }}>{v || '–'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.medium, fontSize: 11.5 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  docName: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.charcoal },
  backdrop: { flex: 1, backgroundColor: 'rgba(44,44,44,0.45)', justifyContent: 'center', padding: space(5) },
  sheet: { backgroundColor: colors.warmWhite, borderRadius: radius.lg, padding: space(6) },
});
