import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { StatTile } from '../../components/AdminBits';
import DateField from '../../components/DateField';
import { Body, Button, Card, Chip, Loading, Notice, Screen, Small, styles as ui } from '../../components/ui';
import { api, getAuthToken } from '../../lib/api';
import { API_URL } from '../../lib/config';
import { space } from '../../lib/theme';
import { toISODate } from '../../lib/validate';

const KINDS = [['users', 'Users'], ['professionals', 'Professionals'], ['consultations', 'Consultations'], ['usage', 'App usage']];
const PRESETS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['month', 'This month'], ['last_month', 'Last month'], ['custom', 'Custom']];
const ABOUT = {
  users: 'New and existing accounts, by country and type, with a list of everyone who joined in the period.',
  professionals: 'Approved professionals available now, by profession and province, plus applications in the period.',
  consultations: 'Requests and accepted bookings over time, and who booked with whom. Never includes topics, messages or mood details.',
  usage: 'Active users, mood check-ins, chat messages and average mood over the period.',
};

export default function Reports() {
  const [kind, setKind] = useState('users');
  const [preset, setPreset] = useState('30');
  const today = new Date();
  const [start, setStart] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [end, setEnd] = useState(today);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const query = preset === 'custom' ? `start=${toISODate(start)}&end=${toISODate(end)}` : `preset=${preset}`;

  const load = useCallback(async () => {
    setPreview(null);
    setErr('');
    try {
      setPreview(await api(`/admin/reports/${kind}/preview/?${query}`));
    } catch (e) {
      setErr(e.message);
    }
  }, [kind, query]);
  useEffect(() => { load(); }, [load]);

  async function download(fmt) {
    setBusy(fmt);
    setErr('');
    try {
      const name = `mindspace-${kind}-report.${fmt}`;
      const dest = new File(Paths.cache, name);
      const file = await File.downloadFileAsync(`${API_URL}/admin/reports/${kind}.${fmt}?${query}&download=1`, dest, {
        headers: { Authorization: `Token ${getAuthToken()}` },
        idempotent: true,
      });
      await Sharing.shareAsync(file.uri, {
        mimeType: fmt === 'pdf' ? 'application/pdf' : 'text/csv',
        dialogTitle: 'Save, print or share the report',
        UTI: fmt === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
      });
    } catch {
      setErr("Couldn't create the report. Check your connection and try again.");
    } finally {
      setBusy('');
    }
  }

  return (
    <Screen edges={[]}>
      <Text style={[ui.label, { marginTop: space(4) }]}>Report</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {KINDS.map(([v, l]) => <Chip key={v} label={l} selected={kind === v} onPress={() => setKind(v)} />)}
      </View>
      <Small style={{ marginTop: space(2) }}>{ABOUT[kind]}</Small>

      <Text style={[ui.label, { marginTop: space(5) }]}>Period</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space(3) }}>
        {PRESETS.map(([v, l]) => <Chip key={v} label={l} selected={preset === v} onPress={() => setPreset(v)} />)}
      </View>
      {preset === 'custom' ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <DateField label="From" value={start} onChange={setStart} maximumDate={end} minimumDate={new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="To" value={end} onChange={setEnd} minimumDate={start} maximumDate={today} />
          </View>
        </View>
      ) : null}

      {err ? <Notice>{err}</Notice> : null}
      {!preview && !err ? <Loading /> : null}
      {preview ? (
        <Card style={{ marginTop: space(2) }}>
          <Small>{new Date(preview.start).toLocaleDateString()} to {new Date(preview.end).toLocaleDateString()}</Small>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: space(3) }}>
            {preview.kpis.map((k) => <StatTile key={k.label} value={k.value} label={k.label} />)}
          </View>
          <Body muted style={{ marginTop: space(3) }}>The PDF adds charts and a table of {preview.rows} row{preview.rows === 1 ? '' : 's'}.</Body>
          <View style={{ gap: space(3), marginTop: space(4) }}>
            <Button title="Download PDF (print or share)" icon="document-text-outline" onPress={() => download('pdf')} loading={busy === 'pdf'} />
            <Button title="Download CSV (for Excel)" icon="grid-outline" variant="outline" onPress={() => download('csv')} loading={busy === 'csv'} />
          </View>
        </Card>
      ) : null}
      <Small style={{ marginTop: space(4) }}>Reports contain personal information. Each report you create is recorded in the audit log.</Small>
    </Screen>
  );
}
