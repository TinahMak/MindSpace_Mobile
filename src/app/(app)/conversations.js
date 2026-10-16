import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Loading, Notice, Small } from '../../components/ui';
import { api } from '../../lib/api';
import { colors, fonts, space } from '../../lib/theme';

export default function Conversations() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await api('/chat/conversations/'));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function remove(c) {
    Alert.alert('Delete this conversation?', 'This permanently removes it from the app and the website.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/chat/conversations/${c.id}/`, { method: 'DELETE' });
            load();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  }

  if (!items && !error) return <Loading />;

  return (
    <FlatList
      style={{ backgroundColor: colors.warmWhite }}
      data={items || []}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={{ padding: space(4) }}
      ListHeaderComponent={error ? <Notice>{error}</Notice> : null}
      ListEmptyComponent={<Small style={{ textAlign: 'center', marginTop: space(10) }}>No conversations yet.</Small>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.navigate({ pathname: '/chat', params: { id: String(item.id) } })}
          onLongPress={() => remove(item)}
          style={s.row}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.preview} numberOfLines={1}>
              {item.preview}
            </Text>
            <Small>
              {new Date(item.updated_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
              {`, ${item.message_count} messages`}
            </Small>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
        </Pressable>
      )}
      ListFooterComponent={
        items?.length ? <Small style={{ textAlign: 'center', marginTop: space(4) }}>Press and hold to delete.</Small> : null
      }
    />
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamDark,
  },
  preview: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal, marginBottom: 2 },
});
