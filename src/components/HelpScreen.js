import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../lib/api';
import { roleOf } from '../lib/home';
import { useAuth } from '../lib/auth';
import { colors, fonts, radius, space } from '../lib/theme';
import { Body, Card, Heading, Loading, Notice, Screen, Small, Title, callNumber } from './ui';

// Offline fallback so this screen always shows a number, even with no connection.
const OFFLINE = {
  selected_country: 'ZA',
  line: { country: 'ZA', name: 'SADAG Suicide Crisis Line', number: '0800 567 567', hours: '24/7', extra: '' },
  lines: [],
  fallback_directory_url: 'https://findahelpline.com',
  therapist_directories: [],
  emergency_note: 'If you are in immediate danger, call your local emergency number now.',
};

export default function HelpScreen({ asModal }) {
  const { user } = useAuth();
  const [country, setCountry] = useState(user?.country || null);
  const [data, setData] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api(`/help/${country ? `?country=${country}` : ''}`, { auth: !!user })
      .then((d) => {
        setData(d);
        setOffline(false);
      })
      .catch(() => {
        setData((cur) => cur || OFFLINE);
        setOffline(true);
      });
  }, [country, user]);

  const line = data?.line;

  return (
    <Screen edges={asModal ? ['top', 'bottom'] : ['top']}>
      <View style={s.top}>
        <Title>Get help now</Title>
        {asModal ? (
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={colors.charcoal} />
          </Pressable>
        ) : null}
      </View>

      {!data ? (
        <Loading />
      ) : (
        <>
          <Notice tone="error">{data.emergency_note}</Notice>
          {offline ? <Notice tone="info">You're offline, so this shows the South Africa line.</Notice> : null}

          <View style={s.hero}>
            <Text style={s.heroName}>{line.name}</Text>
            <Text style={s.heroHours}>
              {line.hours}
              {line.extra ? `. ${line.extra}` : ''}
            </Text>
            <Pressable onPress={() => callNumber(line.number)} style={s.call} accessibilityRole="button" accessibilityLabel={`Call ${line.number}`}>
              <Ionicons name="call" size={20} color={colors.terra} />
              <Text style={s.callText}>Call {line.number}</Text>
            </Pressable>
            <Text style={s.heroFoot}>Free and confidential. You don't need to be in crisis to call.</Text>
          </View>

          {data.trusted_contact ? (
            <Pressable onPress={() => callNumber(data.trusted_contact.phone)} style={[s.linkRow, s.findPro]} accessibilityRole="button">
              <Ionicons name="call-outline" size={20} color={colors.terra} />
              <View style={{ flex: 1 }}>
                <Text style={s.dirName}>Call {data.trusted_contact.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.midGray }}>Your trusted contact{data.trusted_contact.relationship ? ` (${data.trusted_contact.relationship.toLowerCase()})` : ''}</Text>
              </View>
            </Pressable>
          ) : null}
          {user && roleOf(user) === 'user' ? (
            <Pressable onPress={() => router.push('/safety-plan')} style={[s.linkRow, s.findPro, { marginTop: space(3) }]} accessibilityRole="button">
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.sageDark} />
              <View style={{ flex: 1 }}>
                <Text style={s.dirName}>{data.has_safety_plan ? 'Open my safety plan' : 'Make a safety plan'}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.midGray }}>{data.has_safety_plan ? 'Your warning signs, what helps and who to call' : 'A short plan for hard moments, ready when you need it'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
            </Pressable>
          ) : null}

          {data.lines.length ? (
            <>
              <Text style={s.label}>Showing the line for</Text>
              <View style={s.countries}>
                {data.lines.map((l) => (
                  <Pressable
                    key={l.country}
                    onPress={() => setCountry(l.country)}
                    style={[s.country, data.selected_country === l.country && s.countryOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: data.selected_country === l.country }}
                  >
                    <Text style={[s.countryText, data.selected_country === l.country && { color: colors.white }]}>
                      {l.country_label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Card tone="cream" style={{ marginTop: space(5) }}>
            <Heading style={{ fontSize: 18 }}>Somewhere else?</Heading>
            <Body muted style={{ marginTop: 4 }}>Find a free helpline in more than 130 countries.</Body>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(data.fallback_directory_url)} style={s.linkRow}>
              <Text style={s.link}>Open findahelpline.com</Text>
              <Ionicons name="open-outline" size={16} color={colors.sageDark} />
            </Pressable>
          </Card>

          {user && roleOf(user) === 'user' ? (
            <Pressable onPress={() => router.push('/find-support')} style={[s.linkRow, s.findPro]}>
              <Ionicons name="people-outline" size={20} color={colors.sageDark} />
              <View style={{ flex: 1 }}>
                <Text style={s.dirName}>Find a MindSpace professional</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.midGray }}>Verified psychologists, counsellors, social workers and doctors</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
            </Pressable>
          ) : null}

          {data.therapist_directories.length ? (
            <View style={{ marginTop: space(6) }}>
              <Heading style={{ fontSize: 19, marginBottom: space(2) }}>Find a professional</Heading>
              {data.therapist_directories.map((d) => (
                <Pressable key={d.url} onPress={() => WebBrowser.openBrowserAsync(d.url)} style={s.dir}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dirName}>{d.name}</Text>
                    {d.note ? <Small>{d.note}</Small> : null}
                  </View>
                  <Ionicons name="open-outline" size={16} color={colors.midGray} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Small style={{ marginTop: space(6), textAlign: 'center' }}>
            MindSpace is a wellness companion, not an emergency or clinical service.
          </Small>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space(3), paddingBottom: space(4) },
  hero: { backgroundColor: colors.terra, borderRadius: radius.lg, padding: space(6) },
  heroName: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.white },
  heroHours: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 16,
    marginTop: space(5),
  },
  callText: { fontFamily: fonts.bold, fontSize: 18, color: colors.terra },
  heroFoot: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: space(3), textAlign: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.midGray, marginTop: space(5), marginBottom: space(2) },
  countries: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  country: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.lightGray, backgroundColor: colors.white },
  countryOn: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  countryText: { fontFamily: fonts.medium, fontSize: 13, color: colors.charcoal },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space(3) },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.sageDark },
  findPro: { marginTop: space(5), padding: 14, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.creamDark, gap: 12 },
  dir: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.creamDark },
  dirName: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.charcoal },
});
