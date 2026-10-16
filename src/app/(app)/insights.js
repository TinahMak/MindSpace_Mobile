import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Heading, Loading, Notice, Screen, Small } from '../../components/ui';
import { api, getAuthToken } from '../../lib/api';
import { API_URL } from '../../lib/config';
import { colors, fonts, radius, space } from '../../lib/theme';

const TREND = {
  improving: { icon: 'trending-up', text: 'Improving' },
  declining: { icon: 'trending-down', text: 'Dipping' },
  steady: { icon: 'remove', text: 'Steady' },
};

export default function Insights() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const load = useCallback(async (d) => {
    setData(null);
    try {
      setData(await api(`/insights/?days=${d}`));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(days);
    }, [load, days]),
  );

  async function sharePdf() {
    setPdfBusy(true);
    setPdfError('');
    try {
      const dest = new File(Paths.cache, `mindspace-mood-report-${days}days.pdf`);
      const file = await File.downloadFileAsync(`${API_URL}/insights/report.pdf?days=${days}`, dest, {
        headers: { Authorization: `Token ${getAuthToken()}` },
        idempotent: true,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share your mood report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        setPdfError('Sharing is not available on this device.');
      }
    } catch (e) {
      setPdfError("Couldn't create the report. Check your connection and try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  const st = data?.stats;
  const elevated = st?.concern_level === 'elevated';
  const trend = TREND[st?.trend] || TREND.steady;

  return (
    <Screen edges={[]}>
      <View style={{ height: space(4) }} />

      <View style={s.periods}>
        {[7, 14, 30].map((p) => (
          <Pressable
            key={p}
            onPress={() => setDays(p)}
            style={[s.period, days === p && s.periodOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: days === p }}
          >
            <Text style={[s.periodText, days === p && { color: colors.white }]}>{p} days</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Notice>{error}</Notice> : null}
      {!data && !error ? <Loading label="Looking at your check-ins" /> : null}

      {st ? (
        st.total_entries === 0 ? (
          <Card tone="cream">
            <Heading>No check-ins in the last {days} days</Heading>
            <Body muted style={{ marginTop: 6 }}>
              Log a few moods on the Today tab and your patterns will show up here.
            </Body>
            <Button title="Check in now" onPress={() => router.navigate('/today')} style={{ marginTop: space(4) }} />
          </Card>
        ) : (
          <>
            <View style={[s.badge, elevated ? s.badgeWarm : s.badgeCalm]}>
              <Ionicons
                name={elevated ? 'leaf-outline' : 'checkmark-circle-outline'}
                size={18}
                color={elevated ? colors.terra : colors.sageDark}
              />
              <Text style={[s.badgeText, { color: elevated ? colors.terra : colors.sageDark }]}>
                {elevated ? 'Worth a closer look' : 'Steady'}
              </Text>
            </View>

            <Card style={{ marginBottom: space(4) }}>
              <Text style={s.reflection}>{st.reflection}</Text>
              <Small style={{ marginTop: space(3) }}>
                Written from your check-in numbers only. It isn't a diagnosis.
              </Small>
            </Card>

            {elevated ? (
              <Card tone="terra" style={{ marginBottom: space(4) }}>
                <Body>
                  Talking to someone you trust, or a professional, can really help. Support is available any time.
                </Body>
                <Button title="Find a professional" onPress={() => router.push('/find-support')} style={{ marginTop: space(3) }} />
                <Button title="See support lines" variant="outline" onPress={() => router.push('/help')} style={{ marginTop: space(3) }} />
              </Card>
            ) : null}

            <View style={s.grid}>
              <Tile label="Check-ins" value={st.total_entries} />
              <Tile label="Average mood" value={st.avg_mood ?? '–'} note="out of 5" />
              <Tile label="Trend" value={<Ionicons name={trend.icon} size={26} color={colors.sageDark} />} note={trend.text} />
              <Tile label="Low days" value={`${Math.round((st.low_ratio || 0) * 100)}%`} note="of check-ins" />
            </View>

            {st.top_emotions_labeled?.length ? (
              <Card style={{ marginTop: space(4) }}>
                <Heading style={{ fontSize: 18 }}>What came up most</Heading>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space(3) }}>
                  {st.top_emotions_labeled.map((e) => (
                    <View key={e.value} style={s.tag}>
                      <Text style={s.tagText}>{e.label}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}
          </>
        )
      ) : null}

      <Card tone="cream" style={{ marginTop: space(6) }}>
        <Heading style={{ fontSize: 19 }}>Share with a professional</Heading>
        <Body muted style={{ marginTop: 6 }}>
          Download a factual PDF log of your last {days} days. MindSpace never sends it to anyone; you choose who sees it.
        </Body>
        {pdfError ? <Notice style={{ marginTop: space(3), marginBottom: 0 }}>{pdfError}</Notice> : null}
        <Button
          title="Download PDF report"
          icon="document-text-outline"
          variant="dark"
          onPress={sharePdf}
          loading={pdfBusy}
          style={{ marginTop: space(4) }}
        />
      </Card>

      <Pressable onPress={() => router.push('/weekly')} style={s.link}>
        <View style={{ flex: 1 }}>
          <Text style={s.linkTitle}>Weekly insights</Text>
          <Small>Your saved weekly summaries, or create one now</Small>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.midGray} />
      </Pressable>
    </Screen>
  );
}

function Tile({ label, value, note }) {
  return (
    <View style={s.tile}>
      <Small>{label}</Small>
      <View style={{ minHeight: 36, justifyContent: 'center' }}>
        {typeof value === 'object' ? value : <Text style={s.tileValue}>{value}</Text>}
      </View>
      {note ? <Small>{note}</Small> : null}
    </View>
  );
}

const s = StyleSheet.create({
  periods: { flexDirection: 'row', backgroundColor: colors.cream, borderRadius: radius.pill, padding: 4, marginBottom: space(5) },
  period: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  periodOn: { backgroundColor: colors.sageDark },
  periodText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.charcoal },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: space(3),
  },
  badgeCalm: { backgroundColor: colors.sageWash },
  badgeWarm: { backgroundColor: colors.terraWash },
  badgeText: { fontFamily: fonts.medium, fontSize: 13.5 },
  reflection: { fontFamily: fonts.display, fontSize: 19, lineHeight: 28, color: colors.charcoal },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.creamDark, padding: 14 },
  tileValue: { fontFamily: fonts.display, fontSize: 28, color: colors.sageDark },
  tag: { backgroundColor: colors.sageWash, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space(4),
    paddingVertical: space(4),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.creamDark,
  },
  linkTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
});
