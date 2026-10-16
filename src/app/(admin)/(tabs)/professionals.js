import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, Notice, Small, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, radius, space } from '../../../lib/theme';

const TABS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['suspended', 'Suspended'], ['all', 'All']];
export const STATUS_STYLE = {
  pending: [colors.terraWash, colors.terra, 'Pending'],
  approved: [colors.sageWash, colors.sageDark, 'Approved'],
  rejected: [colors.creamDark, colors.charcoal, 'Rejected'],
  suspended: [colors.charcoal, colors.white, 'Suspended'],
};

export default function Professionals() {
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async (st = status, query = q) => {
    try {
      setData(await api(`/admin/professionals/?status=${st}&q=${encodeURIComponent(query)}`));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, [status, q]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      style={{ backgroundColor: colors.warmWhite }}
      contentContainerStyle={{ padding: space(4) }}
      data={data?.results || []}
      keyExtractor={(p) => String(p.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ marginBottom: space(3), gap: space(3) }}>
          <Button title="Add a professional" icon="add" variant="outline" onPress={() => router.push('/add-professional')} />
          <TextInput
            style={ui.input}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => load(status, q)}
            placeholder="Name, email, registration no. or city"
            placeholderTextColor="#A19C94"
            returnKeyType="search"
            autoCapitalize="none"
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TABS.map(([v, l]) => (
              <Chip key={v} label={v !== 'all' && data ? `${l} (${data.counts[v]})` : l} selected={status === v} onPress={() => { setStatus(v); load(v, q); }} />
            ))}
          </View>
          {err ? <Notice>{err}</Notice> : null}
        </View>
      }
      renderItem={({ item: p }) => {
        const [bg, fg, label] = STATUS_STYLE[p.status];
        return (
          <Pressable onPress={() => router.push(`/professional/${p.id}`)} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{p.display_name}</Text>
              <Small>{p.profession_label} · {p.city}</Small>
              <Small>{p.regulator} {p.registration_number}</Small>
            </View>
            <View style={[s.pill, { backgroundColor: bg }]}><Text style={[s.pillText, { color: fg }]}>{label}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
          </Pressable>
        );
      }}
      ListEmptyComponent={data ? <Small style={{ textAlign: 'center', marginTop: space(8) }}>Nothing here.</Small> : null}
    />
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.medium, fontSize: 11.5 },
});
