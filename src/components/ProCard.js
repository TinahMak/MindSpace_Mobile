import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../lib/theme';

export function feeText(p) {
  if (p.fee_min && p.fee_max) return `R${p.fee_min} to R${p.fee_max} per session`;
  if (p.fee_min) return `From R${p.fee_min} per session`;
  if (p.fee_max) return `Up to R${p.fee_max} per session`;
  return 'Fees on request';
}

export function distanceText(p) {
  if (p.distance_km == null) return null;
  const km = p.distance_km < 1 ? 'under 1' : Math.round(p.distance_km);
  return `${p.distance_is_approx ? 'About ' : ''}${km} km away`;
}

export default function ProCard({ p, onPress }) {
  const dist = distanceText(p);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]} accessibilityRole="button">
      <View style={s.top}>
        <View style={s.avatar}>
          <Text style={s.initials}>{p.display_name.replace(/^(Dr|Mr|Ms|Mrs|Mx|Prof)\s+/, '').split(' ').map((w) => w[0]).slice(0, 2).join('')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{p.display_name}</Text>
          <Text style={s.sub}>{p.profession_label} · {p.city}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
      </View>
      {p.matched_specialties?.length ? (
        <View style={s.match}>
          <Ionicons name="sparkles-outline" size={14} color={colors.sageDark} />
          <Text style={s.matchText}>Works with {p.matched_specialties.join(', ').toLowerCase()}</Text>
        </View>
      ) : null}
      <View style={s.tags}>
        {p.offers_in_person ? <Tag icon="business-outline" text={dist || 'In person'} /> : null}
        {p.offers_online ? <Tag icon="videocam-outline" text="Online" /> : null}
        <Tag icon="cash-outline" text={feeText(p)} />
        {p.accepts_medical_aid ? <Tag icon="medkit-outline" text="Medical aid" /> : null}
      </View>
    </Pressable>
  );
}

function Tag({ icon, text }) {
  return (
    <View style={s.tag}>
      <Ionicons name={icon} size={13} color={colors.midGray} />
      <Text style={s.tagText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.creamDark, padding: space(4), marginBottom: space(3) },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sageWash, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.display, fontSize: 17, color: colors.sageDark },
  name: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.charcoal },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.midGray, marginTop: 1 },
  match: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space(3), backgroundColor: colors.sageWash, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  matchText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sageDark },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space(3) },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.cream, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { fontFamily: fonts.body, fontSize: 12, color: colors.charcoal },
});
