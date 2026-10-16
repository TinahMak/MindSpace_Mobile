import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Loading, Notice, Screen, Small, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, moodTint, radius, space } from '../../../lib/theme';
import { useMeta } from '../../../lib/useMeta';

export default function Journal() {
  const meta = useMeta();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async (query = q) => {
    try {
      setData(await api(`/journal/${query ? `?q=${encodeURIComponent(query)}` : ''}`));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, [q]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const emoji = (m) => meta.moods.find((x) => x.value === m)?.emoji;

  return (
    <Screen edges={[]}>
      <Button title="New entry" icon="create-outline" onPress={() => router.push('/journal/edit')} style={{ marginTop: space(4) }} />
      {data?.count ? (
        <View style={s.search}>
          <Ionicons name="search" size={16} color={colors.midGray} />
          <TextInput style={s.searchInput} value={q} onChangeText={setQ} onSubmitEditing={() => load(q)} placeholder="Search your entries" placeholderTextColor="#A19C94" returnKeyType="search" />
          {q ? <Pressable onPress={() => { setQ(''); load(''); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.midGray} /></Pressable> : null}
        </View>
      ) : null}
      {err ? <Notice style={{ marginTop: space(4) }}>{err}</Notice> : null}
      {!data && !err ? <Loading /> : null}
      {data && data.count === 0 ? (
        <View style={s.empty}>
          <Ionicons name="book-outline" size={30} color={colors.sage} />
          <Text style={s.emptyTitle}>{q ? 'No entries match' : 'Your journal is empty'}</Text>
          <Body muted style={{ textAlign: 'center' }}>{q ? 'Try another word.' : 'Writing things down, even a line or two, can make them feel lighter. Only you can see it.'}</Body>
        </View>
      ) : null}
      {(data?.groups || []).map((g) => (
        <View key={g.month} style={{ marginTop: space(6) }}>
          <Text style={s.month}>{g.month}</Text>
          {g.entries.map((e) => (
            <Pressable key={e.id} onPress={() => router.push({ pathname: '/journal/edit', params: { id: String(e.id) } })} style={s.entry}>
              <View style={[s.day, e.mood && { backgroundColor: moodTint[e.mood] }]}>
                <Text style={s.dayNum}>{new Date(e.created_at).getDate()}</Text>
                {e.mood ? <Text style={{ fontSize: 12 }}>{emoji(e.mood)}</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.preview} numberOfLines={1}>{e.preview}</Text>
                <Small>{new Date(e.created_at).toLocaleDateString([], { weekday: 'long' })} · {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Small>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space(4), paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.lightGray },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.charcoal, paddingVertical: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: space(12), paddingHorizontal: space(4) },
  emptyTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.charcoal },
  month: { fontFamily: fonts.medium, fontSize: 13, color: colors.midGray, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: space(2) },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  day: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontFamily: fonts.bold, fontSize: 15, color: colors.charcoal },
  preview: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
});
