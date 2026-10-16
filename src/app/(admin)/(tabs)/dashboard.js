import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { StatTile } from '../../../components/AdminBits';
import { Heading, Loading, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { colors, fonts, space } from '../../../lib/theme';

const LINKS = [
  { href: '/users', icon: 'people-outline', title: 'Manage users', sub: 'Search, suspend, reactivate or delete accounts' },
  { href: '/professionals', icon: 'medkit-outline', title: 'Professionals', sub: 'Review applications, approve or reject' },
  { href: '/reports', icon: 'bar-chart-outline', title: 'Reports', sub: 'Printable PDFs with charts, or CSV for Excel' },
  { href: '/admins', icon: 'shield-checkmark-outline', title: 'Manage admins', sub: 'Add or remove admins' },
  { href: '/ratings', icon: 'star-outline', title: 'App ratings', sub: 'Average, trend and comments' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [st, setSt] = useState(null);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSt(await api('/admin/stats/'));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen
      edges={[]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.sage} />}
    >
      <Heading style={{ marginTop: space(4) }}>Welcome{user?.first_name ? `, ${user.first_name}` : ''}</Heading>
      <Small style={{ marginBottom: space(3) }}>Here's how MindSpace is doing.</Small>
      {err ? <Notice>{err}</Notice> : null}
      {!st && !err ? <Loading /> : null}
      {st ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <StatTile value={st.users_total} label="Total users" />
          <StatTile value={st.users_new_7d} label="Joined this week" />
          <StatTile value={st.users_active_7d} label="Checked in this week" />
          <StatTile value={st.rating_average ? `${st.rating_average}★` : null} label={`Average rating (${st.rating_count})`} />
          <StatTile value={st.users_suspended} label="Suspended accounts" />
          <StatTile value={st.pros_approved} label="Approved professionals" />
          <StatTile value={st.consults_open} label="Open consultation requests" />
          <StatTile value={st.consults_accepted} label="Accepted consultations" />
        </View>
      ) : null}
      {st?.pros_pending ? (
        <Pressable onPress={() => router.navigate('/professionals')} style={s.alert}>
          <Ionicons name="time-outline" size={20} color={colors.terra} />
          <Text style={s.alertText}>{st.pros_pending} professional{st.pros_pending === 1 ? '' : 's'} waiting for review</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.terra} />
        </Pressable>
      ) : null}
      <View style={{ marginTop: space(5) }}>
        {LINKS.map((l) => (
          <Pressable key={l.href} onPress={() => router.navigate(l.href)} style={s.row}>
            <Ionicons name={l.icon} size={22} color={colors.sageDark} />
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{l.title}</Text>
              <Small>{l.sub}</Small>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  title: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.charcoal },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space(4), padding: 14, borderRadius: 14, backgroundColor: colors.terraWash },
  alertText: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5, color: colors.terra },
});
