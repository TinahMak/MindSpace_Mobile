import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { AdminOnly } from '../../../components/AdminBits';
import { Card, Chip, Heading, Loading, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

function Ratings() {
  const [data, setData] = useState(null);
  const [only, setOnly] = useState(false);
  const [err, setErr] = useState('');

  useFocusEffect(
    useCallback(() => {
      api(`/admin/ratings/${only ? '?comments=1' : ''}`).then(setData).catch((e) => setErr(e.message));
    }, [only]),
  );

  if (!data && !err) return <Loading />;
  const s = data?.summary;
  const top = Math.max(1, ...(s?.distribution || []).map((d) => d.count));

  return (
    <Screen edges={[]}>
      {err ? <Notice>{err}</Notice> : null}
      {s ? (
        <>
          <Card style={{ marginTop: space(3) }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 36, color: colors.sageDark }}>{s.average ? `${s.average}★` : '–'}</Text>
            <Small>from {s.count} rating{s.count === 1 ? '' : 's'}</Small>
            <View style={{ marginTop: space(3) }}>
              {s.distribution.map((d) => (
                <View key={d.stars} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
                  <Small style={{ width: 26 }}>{d.stars}★</Small>
                  <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.cream, overflow: 'hidden' }}>
                    <View style={{ width: `${(d.count / top) * 100}%`, height: '100%', backgroundColor: colors.sage, borderRadius: 5 }} />
                  </View>
                  <Small style={{ width: 24, textAlign: 'right' }}>{d.count}</Small>
                </View>
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: space(4) }}>
            <Heading style={{ fontSize: 18, marginBottom: space(3) }}>Weekly average</Heading>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 }}>
              {s.trend.map((w) => (
                <View key={w.week_start} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <View style={{ width: '100%', borderRadius: 5, height: w.avg ? (w.avg / 5) * 95 : 4, backgroundColor: w.avg ? colors.sage : colors.creamDark }} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: colors.midGray, marginTop: 3 }}>
                    {new Date(w.week_start).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: space(5), marginBottom: space(2) }}>
            <Chip label="All" selected={!only} onPress={() => setOnly(false)} />
            <Chip label="With comments" selected={only} onPress={() => setOnly(true)} />
          </View>
          {data.recent.length === 0 ? <Small style={{ marginTop: space(3) }}>No ratings yet.</Small> : null}
          {data.recent.map((r, i) => (
            <View key={i} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.creamDark }}>
              <Text style={{ color: '#C9973A', letterSpacing: 1 }}>{'★'.repeat(r.stars)}<Text style={{ color: colors.lightGray }}>{'★'.repeat(5 - r.stars)}</Text></Text>
              {r.comment ? <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.charcoal, marginTop: 4 }}>{r.comment}</Text> : null}
              <Small style={{ marginTop: 3 }}>{r.email} · {r.platform || 'unknown'} · {new Date(r.updated_at).toLocaleDateString()}</Small>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

export default function AdminRatings() {
  return (
    <AdminOnly>
      <Ratings />
    </AdminOnly>
  );
}
