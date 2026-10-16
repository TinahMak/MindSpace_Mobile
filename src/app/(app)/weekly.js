import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, Loading, Notice, Screen, Small } from '../../components/ui';
import { api } from '../../lib/api';
import { colors, fonts, space } from '../../lib/theme';

function fmt(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function Weekly() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api('/insights/weekly/'));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function generate() {
    setBusy(true);
    setError('');
    try {
      await api('/insights/weekly/generate/', { method: 'POST' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={[]}>
      <Body muted style={{ marginTop: space(2), marginBottom: space(4) }}>
        A summary of each week is created every Monday. You can also create one for the past 7 days right now.
      </Body>
      <Button title="Create this week's insight" onPress={generate} loading={busy} />
      {error ? <Notice style={{ marginTop: space(4) }}>{error}</Notice> : null}
      {!items && !error ? <Loading /> : null}
      {items && items.length === 0 ? (
        <Small style={{ marginTop: space(6), textAlign: 'center' }}>No weekly insights yet.</Small>
      ) : null}
      <View style={{ gap: space(3), marginTop: space(5) }}>
        {(items || []).map((w) => (
          <Card key={w.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal }}>
                {fmt(w.period_start)} to {fmt(w.period_end)}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  color: w.concern_level === 'elevated' ? colors.terra : colors.sageDark,
                }}
              >
                {w.concern_level === 'elevated' ? 'Worth a closer look' : 'Steady'}
              </Text>
            </View>
            <Small style={{ marginTop: 2 }}>
              {w.total_entries} check-ins{w.avg_mood != null ? `, average ${w.avg_mood.toFixed(1)}` : ''}
              {w.emailed_at ? ', emailed to you' : ''}
            </Small>
            {w.summary_text ? <Body style={{ marginTop: space(3) }}>{w.summary_text}</Body> : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
