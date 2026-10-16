import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../lib/auth';
import { colors, fonts, radius } from '../lib/theme';
import { Body, Screen, Title } from './ui';

export function AdminOnly({ children }) {
  const { user } = useAuth();
  if (!user?.is_admin)
    return (
      <Screen edges={[]}>
        <Title style={{ marginTop: 20 }}>Admins only</Title>
        <Body muted>Your account doesn't have access to this area.</Body>
      </Screen>
    );
  return children;
}

export function StatusPill({ u }) {
  const [label, bg, fg] = !u.is_active
    ? ['Suspended', colors.terraWash, colors.terra]
    : u.is_owner
      ? ['Owner', colors.charcoal, colors.white]
      : u.is_admin
        ? ['Admin', colors.charcoal, colors.white]
        : ['Active', colors.sageWash, colors.sageDark];
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function StatTile({ value, label }) {
  return (
    <View style={s.tile}>
      <Text style={s.value}>{value ?? '–'}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.medium, fontSize: 11.5 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark, borderRadius: radius.md, padding: 14 },
  value: { fontFamily: fonts.display, fontSize: 28, color: colors.sageDark },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.midGray, marginTop: 2 },
});
