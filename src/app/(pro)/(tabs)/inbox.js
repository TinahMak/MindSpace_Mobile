import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { StatusTag, fmtDate } from '../../../components/ConsultBits';
import { Chip, Notice, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, space } from '../../../lib/theme';

const TABS = [['open', 'Open'], ['accepted', 'Accepted'], ['closed', 'Closed']];

export default function Inbox() {
  const [tab, setTab] = useState('open');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (t = tab) => {
    try {
      setData(await api(`/pro/consultations/?status=${t}`));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, [tab]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      style={{ backgroundColor: colors.warmWhite }}
      contentContainerStyle={{ padding: space(4) }}
      data={data?.results || []}
      keyExtractor={(r) => String(r.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.sage} />}
      ListHeaderComponent={
        <View style={{ gap: space(3), marginBottom: space(2) }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TABS.map(([v, l]) => (
              <Chip key={v} label={v === 'open' && data?.new ? `${l} (${data.new} new)` : l} selected={tab === v} onPress={() => { setTab(v); load(v); }} />
            ))}
          </View>
          {err ? <Notice>{err}</Notice> : null}
        </View>
      }
      ListEmptyComponent={data ? <Small style={{ textAlign: 'center', marginTop: space(10) }}>Nothing here yet. Clients who find you in MindSpace can send you requests.</Small> : null}
      renderItem={({ item: r }) => (
        <Pressable onPress={() => router.push(`/quote/${r.id}`)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.creamDark, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal }}>
              {r.client.revealed ? r.client.full_name : r.client.first_name}
            </Text>
            <StatusTag status={r.status} label={r.status === 'requested' ? 'New request' : undefined} />
          </View>
          <Small>{r.mode_label}{r.topics.length ? ` · ${r.topics.map((t) => t.label).join(', ')}` : ''} · {fmtDate(r.created_at)}</Small>
        </Pressable>
      )}
    />
  );
}
