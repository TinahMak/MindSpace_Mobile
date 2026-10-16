import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminOnly, StatusPill } from '../../../components/AdminBits';
import { Chip, Notice, Small, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, space } from '../../../lib/theme';

const FILTERS = [
  ['all', 'All'],
  ['active', 'Active'],
  ['suspended', 'Suspended'],
  ['admins', 'Admins'],
];

function Users() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(
    async (query = q, st = status) => {
      try {
        setData(await api(`/admin/users/?q=${encodeURIComponent(query)}&status=${st}`));
        setErr('');
      } catch (e) {
        setErr(e.message);
      }
    },
    [q, status],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.warmWhite }}
      contentContainerStyle={{ padding: space(4) }}
      data={data?.results || []}
      keyExtractor={(u) => String(u.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ marginBottom: space(3) }}>
          <TextInput
            style={ui.input}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => load(q, status)}
            placeholder="Search name or email"
            placeholderTextColor="#A19C94"
            returnKeyType="search"
            autoCapitalize="none"
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: space(3), flexWrap: 'wrap' }}>
            {FILTERS.map(([v, l]) => (
              <Chip key={v} label={l} selected={status === v} onPress={() => { setStatus(v); load(q, v); }} />
            ))}
          </View>
          {err ? <Notice style={{ marginTop: space(3) }}>{err}</Notice> : null}
          {data ? <Small style={{ marginTop: space(3) }}>{data.total} account{data.total === 1 ? '' : 's'}</Small> : null}
        </View>
      }
      renderItem={({ item: u }) => (
        <Pressable onPress={() => router.push(`/user/${u.id}`)} style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{u.name || u.email}</Text>
            <Small>{u.email}</Small>
          </View>
          <StatusPill u={u} />
        </Pressable>
      )}
      ListEmptyComponent={data ? <Small style={{ textAlign: 'center', marginTop: space(8) }}>No users match.</Small> : null}
    />
  );
}

export default function AdminUsers() {
  return (
    <AdminOnly>
      <Users />
    </AdminOnly>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
});
