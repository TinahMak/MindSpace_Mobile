import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import ProCard from '../../../components/ProCard';
import Select from '../../../components/Select';
import TopBar from '../../../components/TopBar';
import { Body, Chip, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { approximateLocation } from '../../../lib/location';
import { colors, fonts, radius, space } from '../../../lib/theme';
import { useProMeta } from '../../../lib/useProMeta';

const MODES = [['in_person', 'In person'], ['online', 'Online'], ['any', 'Either']];

export default function FindSupport() {
  const meta = useProMeta();
  const { user } = useAuth();
  const [mode, setMode] = useState('in_person');
  const [point, setPoint] = useState(null);
  const [province, setProvince] = useState(null);
  const [profession, setProfession] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [err, setErr] = useState('');
  const [locErr, setLocErr] = useState('');
  const [mine, setMine] = useState([]);
  useFocusEffect(useCallback(() => { api('/consultations/').then(setMine).catch(() => {}); }, []));
  const quotedCount = mine.filter((r) => r.status === 'quoted').length;
  const openCount = mine.filter((r) => r.status === 'requested' || r.status === 'quoted' || r.status === 'accepted').length;

  const search = useCallback(async (opts = {}) => {
    const m = opts.mode ?? mode;
    const pt = opts.point !== undefined ? opts.point : point;
    const pv = opts.province !== undefined ? opts.province : province;
    const pf = opts.profession !== undefined ? opts.profession : profession;
    setBusy(true);
    setErr('');
    try {
      const body = { mode: m, profession: pf || undefined };
      if (m !== 'online') {
        if (pt) Object.assign(body, pt);
        else if (pv) body.province = pv;
      }
      setData(await api('/support/match/', { method: 'POST', body }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }, [mode, point, province, profession]);

  useFocusEffect(useCallback(() => { if (!data) search(); }, [data, search]));

  async function nearMe() {
    setLocBusy(true);
    setLocErr('');
    try {
      const pt = await approximateLocation();
      setPoint(pt);
      setProvince(null);
      search({ point: pt, province: null });
    } catch (e) {
      setLocErr(e.message || "Couldn't get your location.");
    } finally {
      setLocBusy(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Find support" />
      <Pressable onPress={() => router.push('/help')} style={s.crisis}>
        <Ionicons name="heart" size={15} color={colors.terra} />
        <Text style={s.crisisText}>In crisis or not safe right now? Get help immediately</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.terra} />
      </Pressable>

      {mine.length ? (
        <Pressable onPress={() => router.push('/requests')} style={s.mine}>
          <Ionicons name="calendar-outline" size={18} color={colors.sageDark} />
          <Text style={s.mineText}>My consultation requests{openCount ? ` (${openCount})` : ''}</Text>
          {quotedCount ? <View style={s.badge}><Text style={s.badgeText}>{quotedCount} quote{quotedCount === 1 ? '' : 's'}</Text></View> : null}
          <Ionicons name="chevron-forward" size={16} color={colors.midGray} />
        </Pressable>
      ) : null}

      <Body muted style={{ marginTop: space(3) }}>
        Verified professionals, matched to what you told us brings you to MindSpace. Every profile is checked by our team against the HPCSA or SACSSP register.
      </Body>

      <View style={s.seg}>
        {MODES.map(([v, l]) => (
          <Pressable key={v} onPress={() => { setMode(v); search({ mode: v }); }} style={[s.segBtn, mode === v && s.segOn]} accessibilityRole="tab" accessibilityState={{ selected: mode === v }}>
            <Text style={[s.segText, mode === v && { color: colors.white }]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {mode !== 'online' ? (
        <View style={{ marginTop: space(4) }}>
          <Pressable onPress={nearMe} style={[s.near, point && s.nearOn]} accessibilityRole="button">
            {locBusy ? <ActivityIndicator color={colors.sageDark} /> : <Ionicons name={point ? 'location' : 'location-outline'} size={18} color={colors.sageDark} />}
            <Text style={s.nearText}>{point ? 'Showing professionals near you' : 'Near me'}</Text>
          </Pressable>
          <Small style={{ marginTop: 6 }}>Your location is used once to sort by distance, rounded to about 1 km, and never saved.</Small>
          {locErr ? <Notice tone="info" style={{ marginTop: space(3), marginBottom: 0 }}>{locErr}</Notice> : null}
          {!point && meta ? (
            <>
              <View style={{ marginTop: space(4) }}>
                <Select label="Or choose a province" value={province} options={meta.provinces} onChange={(v) => { setProvince(v); search({ province: v }); }} placeholder="Any province" allowClear />
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {meta ? (
        <>
          <Text style={s.label}>Type of professional</Text>
          <View style={s.wrap}>
            <Chip label="Any" selected={!profession} onPress={() => { setProfession(null); search({ profession: null }); }} />
            {meta.professions.map((p) => (
              <Chip key={p.value} label={p.label.replace(' (doctor)', '')} selected={profession === p.value} onPress={() => { setProfession(p.value); search({ profession: p.value }); }} />
            ))}
          </View>
        </>
      ) : null}

      <View style={{ marginTop: space(6) }}>
        {data?.wanted_specialties?.length ? (
          <Small style={{ marginBottom: space(3) }}>Best matches first for: {data.wanted_specialties.join(', ').toLowerCase()}.</Small>
        ) : !user?.focus_reasons?.length ? (
          <Small style={{ marginBottom: space(3) }}>Tip: choose what brings you to MindSpace on the Account tab to get better matches.</Small>
        ) : null}
        {err ? <Notice>{err}</Notice> : null}
        {busy && !data ? <ActivityIndicator color={colors.sage} style={{ marginTop: space(6) }} /> : null}
        {data && data.results.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No professionals found yet</Text>
            <Small style={{ textAlign: 'center' }}>
              MindSpace is still adding verified professionals{mode !== 'online' ? '. Try "Online" or another province' : ''}. Your Get Help screen also lists free support lines and directories.
            </Small>
          </View>
        ) : null}
        {(data?.results || []).map((p) => (
          <ProCard key={p.id} p={p} onPress={() => router.push(`/support/${p.id}`)} />
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  crisis: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.terraWash },
  crisisText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.terra },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space(3), padding: 12, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark },
  mineText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.charcoal },
  badge: { backgroundColor: colors.terra, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  seg: { flexDirection: 'row', backgroundColor: colors.cream, borderRadius: radius.pill, padding: 4, marginTop: space(5) },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  segOn: { backgroundColor: colors.sageDark },
  segText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.charcoal },
  near: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.sage, backgroundColor: colors.white },
  nearOn: { backgroundColor: colors.sageWash },
  nearText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.sageDark },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.charcoal, marginTop: space(5), marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: space(8), paddingHorizontal: space(4) },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.charcoal },
});
