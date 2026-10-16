import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { StatusTag, fmtDate } from '../../../components/ConsultBits';
import { Loading, Notice, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, space } from '../../../lib/theme';

export default function MyRequests() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  useFocusEffect(useCallback(() => { api('/consultations/').then(setItems).catch((e) => setErr(e.message)); }, []));

  if (!items && !err) return <Loading />;
  return (
    <FlatList
      style={{ backgroundColor: colors.warmWhite }}
      contentContainerStyle={{ padding: space(4) }}
      data={items || []}
      keyExtractor={(r) => String(r.id)}
      ListHeaderComponent={err ? <Notice>{err}</Notice> : null}
      ListEmptyComponent={<Small style={{ textAlign: 'center', marginTop: space(10) }}>You haven't requested a consultation yet. Find a professional in the Support tab.</Small>}
      renderItem={({ item: r }) => (
        <Pressable onPress={() => router.push(`/requests/${r.id}`)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.creamDark, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal }}>{r.professional.display_name}</Text>
            <StatusTag status={r.status} />
          </View>
          <Small>
            {r.professional.profession_label} · requested {fmtDate(r.created_at)}
            {r.quote ? ` · R${r.quote.fee} for ${r.quote.duration_min} min` : ''}
          </Small>
        </Pressable>
      )}
    />
  );
}
