import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ImageBackground, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import TopBar from '../../../components/TopBar';
import { Body, Button, Card, Chip, Heading, Loading, Notice, Screen, Small, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, moodTint, radius, space } from '../../../lib/theme';
import { addCalmPoint } from '../../../lib/games';
import { useMeta } from '../../../lib/useMeta';

function timeOf(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Today() {
  const meta = useMeta();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [mood, setMood] = useState(null);
  const [emotions, setEmotions] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [saveError, setSaveError] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [hideSuggestUntil, setHideSuggestUntil] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync('mindspace.hideSupportUntil').then((v) => setHideSuggestUntil(v ? Number(v) : 0)).catch(() => setHideSuggestUntil(0));
  }, []);

  function dismissSuggest() {
    const until = Date.now() + 7 * 24 * 3600 * 1000; // a week
    setHideSuggestUntil(until);
    SecureStore.setItemAsync('mindspace.hideSupportUntil', String(until)).catch(() => {});
  }

  const load = useCallback(async () => {
    try {
      setData(await api('/dashboard/'));
      setLoadError('');
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function toggleEmotion(v) {
    setEmotions((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  async function save() {
    if (!mood) return;
    setSaving(true);
    setSaveError('');
    try {
      await api('/moods/', { method: 'POST', body: { mood, emotions, note } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      addCalmPoint('check-in');
      // Clear the form after saving, same as the website.
      setMood(null);
      setEmotions([]);
      setNote('');
      setSaved('Check-in saved.');
      setTimeout(() => setSaved(''), 2500);
      load();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function removeEntry(entry) {
    Alert.alert('Delete this check-in?', `${entry.emoji} ${entry.label} at ${timeOf(entry.created_at)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/moods/${entry.id}/`, { method: 'DELETE' });
            load();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  }

  async function resendVerification() {
    try {
      const r = await api('/auth/resend-verification/', { method: 'POST' });
      setVerifyMsg(r.detail);
    } catch (e) {
      setVerifyMsg(e.message);
    }
  }

  if (!data && !loadError) return <Screen><TopBar title="Today" /><Loading /></Screen>;

  const maxCount = Math.max(1, ...(data?.breakdown || []).map((b) => b.count));

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} />}>
      <TopBar title={data ? `${data.greeting}${data.first_name ? `, ${data.first_name}` : ''}` : 'Today'} />

      {loadError ? <Notice>{loadError}</Notice> : null}

      {data && !data.email_verified ? (
        <Notice tone="info">
          {verifyMsg || 'Please verify your email so you can recover your account. '}
          {!verifyMsg ? (
            <Text style={{ color: colors.sageDark, fontFamily: fonts.medium }} onPress={resendVerification}>
              Resend email
            </Text>
          ) : null}
        </Notice>
      ) : null}

      {data?.suggest_support && hideSuggestUntil !== null && Date.now() > hideSuggestUntil ? (
        <Card tone="sage" style={{ marginBottom: space(5) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Heading style={{ fontSize: 19, flex: 1 }}>It's been a tough week</Heading>
            <Pressable onPress={dismissSuggest} hitSlop={10} accessibilityLabel="Hide this for a week">
              <Ionicons name="close" size={20} color={colors.midGray} />
            </Pressable>
          </View>
          <Body style={{ marginTop: 6 }}>
            You've logged {data.low_days_7d} low days recently. Talking to someone can really help, and there are verified professionals on MindSpace.
          </Body>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: space(4), flexWrap: 'wrap' }}>
            <Button title="Find a professional" onPress={() => router.push('/find-support')} style={{ flexGrow: 1 }} />
            <Button title="Get help now" variant="outline" onPress={() => router.push('/help')} style={{ flexGrow: 1 }} />
          </View>
        </Card>
      ) : null}

      {/* ── Check-in ───────────────────────────── */}
      <Card style={{ marginBottom: space(5) }}>
        <Heading>How are you feeling right now?</Heading>
        <Small style={{ marginTop: 4, marginBottom: space(4) }}>Log as many check-ins a day as you like.</Small>

        <View style={s.scale}>
          {meta.moods.map((m) => {
            const on = mood === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => {
                  setMood(m.value);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={[s.moodBtn, { backgroundColor: on ? moodTint[m.value] : colors.cream }, on && s.moodOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.label}
              >
                <Text style={[s.moodEmoji, on && { transform: [{ scale: 1.15 }] }]}>{m.emoji}</Text>
                <Text style={[s.moodLabel, on && { color: colors.charcoal, fontFamily: fonts.medium }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {mood ? (
          <>
            <Text style={[ui.label, { marginTop: space(5) }]}>Anything else going on? (optional)</Text>
            <View style={s.chips}>
              {meta.emotions.map((e) => (
                <Chip key={e.value} label={e.label} selected={emotions.includes(e.value)} onPress={() => toggleEmotion(e.value)} />
              ))}
            </View>
            <TextInput
              style={[ui.input, { minHeight: 80, textAlignVertical: 'top', marginTop: space(4) }]}
              value={note}
              onChangeText={(t) => setNote(t.slice(0, 500))}
              placeholder="Add a note for yourself"
              placeholderTextColor="#A19C94"
              multiline
            />
            <Small style={{ textAlign: 'right', marginTop: 4 }}>{note.length}/500</Small>
            {saveError ? <Notice style={{ marginTop: space(3) }}>{saveError}</Notice> : null}
            <Button title="Save check-in" onPress={save} loading={saving} style={{ marginTop: space(3) }} />
          </>
        ) : null}
        {saved ? <Notice tone="success" style={{ marginTop: space(4), marginBottom: 0 }}>{saved}</Notice> : null}
      </Card>

      {/* ── Breathing break ─────────────────── */}
      <Pressable onPress={() => router.push('/breathe')} accessibilityRole="button" style={{ marginBottom: space(5) }}>
        <ImageBackground source={require('../../../../assets/media/lotus.jpg')} style={s.breathe} imageStyle={{ borderRadius: radius.md }}>
          <View style={s.breatheShade} />
          <Text style={s.breatheTitle}>Take a breath</Text>
          <Text style={s.breatheSub}>A 15-second guided breathing break</Text>
        </ImageBackground>
      </Pressable>

      {data ? (
        <>
          {/* ── Today's entries ─────────────────── */}
          {data.today_entries.length ? (
            <View style={{ marginBottom: space(6) }}>
              <Text style={s.sectionLabel}>Today's check-ins</Text>
              {data.today_entries.map((e) => (
                <Pressable key={e.id} onLongPress={() => removeEntry(e)} style={s.entry}>
                  <Text style={{ fontSize: 22 }}>{e.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontFamily: fonts.medium }}>
                      {e.label} <Small>at {timeOf(e.created_at)}</Small>
                    </Body>
                    {e.emotions.length ? <Small>{e.emotions.join(', ')}</Small> : null}
                    {e.note ? <Body muted style={{ fontSize: 13.5, marginTop: 2 }}>{e.note}</Body> : null}
                  </View>
                </Pressable>
              ))}
              <Small style={{ marginTop: 4 }}>Press and hold a check-in to delete it.</Small>
            </View>
          ) : null}

          {/* ── Stats ───────────────────────────── */}
          <View style={s.stats}>
            <Stat value={data.streak} label="day streak" />
            <Stat value={data.avg_mood ?? '–'} label="7-day average" />
            <Stat value={data.week_count} label="check-ins this week" />
          </View>

          {/* ── 7-day chart ─────────────────────── */}
          <Card style={{ marginTop: space(5) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Heading style={{ fontSize: 19 }}>Your week</Heading>
              <Pressable onPress={() => router.push('/insights')} hitSlop={8}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark }}>See insights</Text>
              </Pressable>
            </View>
            <Small style={{ marginTop: 2 }}>Average mood per day</Small>
            <View style={s.chart}>
              {data.chart.map((d) => (
                <View key={d.date} style={s.col} accessibilityLabel={`${d.label}: ${d.avg ? `average ${d.avg}` : 'no check-ins'}`}>
                  <Text style={{ fontSize: 15, height: 20 }}>{d.emoji}</Text>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.bar,
                        {
                          height: `${d.avg ? Math.max(8, (d.avg / 5) * 100) : 4}%`,
                          backgroundColor: d.avg ? moodTint[Math.round(d.avg)] : colors.creamDark,
                          borderColor: d.is_today ? colors.sageDark : 'transparent',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.day, d.is_today && { color: colors.charcoal, fontFamily: fonts.bold }]}>{d.label}</Text>
                  {d.count > 1 ? <Text style={s.count}>×{d.count}</Text> : <Text style={s.count}> </Text>}
                </View>
              ))}
            </View>
          </Card>

          {/* ── Breakdown ───────────────────────── */}
          <Card style={{ marginTop: space(5) }}>
            <Heading style={{ fontSize: 19, marginBottom: space(3) }}>How often you felt each mood</Heading>
            {data.breakdown.map((b) => (
              <View key={b.mood} style={s.bRow}>
                <Text style={{ fontSize: 18, width: 28 }}>{b.emoji}</Text>
                <Text style={s.bLabel}>{b.label}</Text>
                <View style={s.bTrack}>
                  <View style={[s.bFill, { width: `${(b.count / maxCount) * 100}%`, backgroundColor: moodTint[b.mood] }]} />
                </View>
                <Text style={s.bCount}>{b.count}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ value, label }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  breathe: { height: 150, justifyContent: 'flex-end', padding: space(4) },
  breatheShade: { ...StyleSheet.absoluteFillObject, borderRadius: radius.md, backgroundColor: 'rgba(20,30,24,0.38)' },
  breatheTitle: { fontFamily: fonts.display, fontSize: 24, color: '#FFFFFF' },
  breatheSub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  scale: { flexDirection: 'row', gap: 6 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodOn: { borderColor: colors.sageDark },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.midGray, marginTop: 4, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.midGray, marginBottom: space(2) },
  entry: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamDark,
  },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.md, padding: 14 },
  statValue: { fontFamily: fonts.display, fontSize: 28, color: colors.sageDark },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.midGray, marginTop: 2 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(4), height: 180 },
  col: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: 26, justifyContent: 'flex-end', marginVertical: 6 },
  bar: { width: '100%', borderRadius: 8, borderWidth: 1.5 },
  day: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.midGray },
  count: { fontFamily: fonts.body, fontSize: 10, color: colors.midGray },
  bRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 5 },
  bLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.charcoal, width: 64 },
  bTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.cream, overflow: 'hidden' },
  bFill: { height: '100%', borderRadius: 5 },
  bCount: { fontFamily: fonts.medium, fontSize: 13, width: 22, textAlign: 'right', color: colors.charcoal },
});
