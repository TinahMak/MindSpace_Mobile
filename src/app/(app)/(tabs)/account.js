import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import FocusPicker, { validateFocus } from '../../../components/FocusPicker';
import RateApp from '../../../components/RateApp';
import Select from '../../../components/Select';
import TopBar from '../../../components/TopBar';
import { Body, Button, Card, Chip, Field, Heading, Notice, Screen, Small } from '../../../components/ui';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { SITE_URL } from '../../../lib/config';
import { isLockOn, lockAvailable, setLock } from '../../../lib/appLock';
import { getReminderHour, remindersSupported, setDailyReminder } from '../../../lib/reminders';
import { colors, fonts, radius, space } from '../../../lib/theme';
import { useMeta } from '../../../lib/useMeta';
import { checkPhone, phoneHint } from '../../../lib/validate';

const REMINDER_TIMES = [
  { hour: 8, label: '8 am' },
  { hour: 13, label: '1 pm' },
  { hour: 20, label: '8 pm' },
];

export default function Account() {
  const { user, setUser, logout, clear } = useAuth();
  const meta = useMeta();
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [reminder, setReminder] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [deleteErr, setDeleteErr] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneErr, setPhoneErr] = useState('');

  async function savePhone() {
    const ph = checkPhone(phone, user.country);
    if (ph.error) return setPhoneErr(ph.error);
    setPhoneErr('');
    await update({ phone: ph.e164 }, 'phone');
    setPhone(ph.e164);
  }

  const [reasons, setReasons] = useState(user?.focus_reasons?.length ? user.focus_reasons : user?.focus ? [user.focus] : []);
  const [otherText, setOtherText] = useState(user?.focus_other || '');
  const [reasonErrors, setReasonErrors] = useState({});
  const saved = user?.focus_reasons?.length ? user.focus_reasons : user?.focus ? [user.focus] : [];
  const reasonsChanged =
    JSON.stringify([...reasons].sort()) !== JSON.stringify([...saved].sort()) || otherText.trim() !== (user?.focus_other || '');

  async function saveReasons() {
    const e = validateFocus(reasons, otherText);
    setReasonErrors(e);
    if (Object.keys(e).length) return;
    await update({ focus_reasons: reasons, focus_other: reasons.includes('other') ? otherText.trim() : '' }, 'reasons');
  }

  const [lockOn, setLockOn] = useState(false);
  const [canLock, setCanLock] = useState(true);

  useEffect(() => {
    getReminderHour().then(setReminder);
    isLockOn().then(setLockOn);
    lockAvailable().then(setCanLock);
  }, []);

  async function toggleLock(v) {
    try {
      if (await setLock(v)) setLockOn(v);
    } catch (e) {
      Alert.alert('App lock', e.message);
    }
  }

  async function update(fields, key) {
    setSaving(key);
    setErr('');
    setMsg('');
    try {
      const me = await api('/me/', { method: 'PATCH', body: fields });
      setUser(me);
      setMsg('Preferences saved.');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving('');
    }
  }

  async function chooseReminder(hour) {
    const next = reminder === hour ? null : hour;
    try {
      const ok = await setDailyReminder(next);
      if (!ok) {
        Alert.alert('Notifications are off', 'Allow notifications for MindSpace in your phone settings to get reminders.');
        return;
      }
      setReminder(next);
    } catch {
      Alert.alert('Reminder not set', "This device couldn't schedule a reminder.");
    }
  }

  async function exportData() {
    setExporting(true);
    setErr('');
    try {
      const data = await api('/me/export/');
      const file = new File(Paths.cache, 'mindspace-my-data.json');
      if (file.exists) file.delete();
      file.write(JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your MindSpace data' });
      }
    } catch (e) {
      setErr(e.message || "Couldn't export your data.");
    } finally {
      setExporting(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', onPress: logout },
    ]);
  }

  async function deleteAccount() {
    setDeleteErr('');
    if (!pw) {
      setDeleteErr('Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await api('/me/delete/', { method: 'POST', body: { password: pw } });
      setDeleteOpen(false);
      await clear();
    } catch (e) {
      setDeleteErr(e.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  return (
    <Screen>
      <TopBar title="Me" />

      <Card style={{ marginBottom: space(4) }}>
        <Heading>
          {user.first_name} {user.last_name}
        </Heading>
        <Body muted>{user.email}</Body>
        <View style={[s.verify, { backgroundColor: user.email_verified ? colors.sageWash : colors.terraWash }]}>
          <Ionicons
            name={user.email_verified ? 'checkmark-circle' : 'alert-circle-outline'}
            size={15}
            color={user.email_verified ? colors.sageDark : colors.terra}
          />
          <Text style={[s.verifyText, { color: user.email_verified ? colors.sageDark : colors.terra }]}>
            {user.email_verified ? 'Email verified' : 'Email not verified'}
          </Text>
        </View>
      </Card>

      <Pressable onPress={() => router.push('/insights')} style={s.link} accessibilityRole="button">
        <Ionicons name="analytics-outline" size={22} color={colors.sageDark} />
        <View style={{ flex: 1 }}>
          <Text style={s.linkTitle}>My insights</Text>
          <Text style={s.linkSub}>Patterns, weekly summaries and your PDF mood report</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.midGray} />
      </Pressable>

      <Card style={{ marginBottom: space(4) }}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>App lock</Text>
            <Small>{canLock ? 'Ask for your fingerprint, face or phone PIN when opening MindSpace.' : 'Set up a screen lock on your phone first to use this.'}</Small>
          </View>
          <Switch value={lockOn} onValueChange={toggleLock} disabled={!canLock} trackColor={{ true: colors.sage, false: colors.lightGray }} thumbColor={colors.white} />
        </View>
      </Card>

      {msg ? <Notice tone="success">{msg}</Notice> : null}
      {err ? <Notice>{err}</Notice> : null}

      <Card style={{ marginBottom: space(4) }}>
        <FocusPicker
          choices={meta.focus_choices}
          value={reasons}
          onChange={setReasons}
          otherText={otherText}
          onOtherText={setOtherText}
          error={reasonErrors.focus}
          otherError={reasonErrors.focus_other}
        />
        {reasonsChanged ? (
          <Button title="Save reasons" onPress={saveReasons} loading={saving === 'reasons'} style={{ marginTop: -space(2) }} />
        ) : null}
      </Card>

      <Card style={{ marginBottom: space(4) }}>
        <Heading style={{ fontSize: 19 }}>Country</Heading>
        <Small style={{ marginTop: 2, marginBottom: space(3) }}>Used to show your local crisis line.</Small>
        <Select
          value={user.country}
          options={meta.countries}
          onChange={(v) => v !== user.country && update({ country: v }, 'country')}
          style={{ marginBottom: 0 }}
        />
      </Card>

      <Card style={{ marginBottom: space(4) }}>
        <Heading style={{ fontSize: 19 }}>Phone number</Heading>
        <Small style={{ marginTop: 2, marginBottom: space(3) }}>
          {user.phone ? 'Checked against your country above.' : 'Please add your phone number. It must be valid for your country.'}
        </Small>
        <Field value={phone} onChangeText={(t) => { setPhone(t); setPhoneErr(''); }} placeholder={phoneHint(user.country)} keyboardType="phone-pad" error={phoneErr} />
        {phone !== (user.phone || '') ? <Button title="Save phone number" onPress={savePhone} loading={saving === 'phone'} /> : null}
      </Card>

      <Card style={{ marginBottom: space(4) }}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Weekly insight email</Text>
            <Small>A short summary of your week, every Monday.</Small>
          </View>
          <Switch
            value={user.weekly_insight_opt_in}
            onValueChange={(v) => update({ weekly_insight_opt_in: v }, 'weekly')}
            disabled={saving === 'weekly'}
            trackColor={{ true: colors.sage, false: colors.lightGray }}
            thumbColor={colors.white}
          />
        </View>
        <View style={s.divider} />
        <Text style={s.rowTitle}>Daily check-in reminder</Text>
        {remindersSupported ? (
          <>
            <Small style={{ marginBottom: space(3) }}>A gentle nudge on this phone. Tap again to turn it off.</Small>
            <View style={s.wrap}>
              {REMINDER_TIMES.map((t) => (
                <Chip key={t.hour} label={t.label} selected={reminder === t.hour} onPress={() => chooseReminder(t.hour)} />
              ))}
              <Chip label="Off" selected={reminder === null} onPress={() => reminder !== null && chooseReminder(reminder)} />
            </View>
          </>
        ) : (
          <Small>Available in the installed MindSpace app. Expo Go on Android doesn't support reminders.</Small>
        )}
      </Card>

      <Card style={{ marginBottom: space(4) }}>
        <Heading style={{ fontSize: 19 }}>Your data</Heading>
        <Small style={{ marginTop: 2, marginBottom: space(3) }}>
          Profile, mood check-ins, journal entries and chat history, as a JSON file.
        </Small>
        <Button title="Export my data" icon="download-outline" variant="outline" onPress={exportData} loading={exporting} />
        <Pressable onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy/`)} style={s.linkRow}>
          <Text style={s.link}>Read the privacy policy</Text>
          <Ionicons name="open-outline" size={15} color={colors.sageDark} />
        </Pressable>
      </Card>

      <RateApp />

      <Button title="Log out" variant="outline" onPress={confirmLogout} style={{ marginBottom: space(4) }} />

      <Card tone="white" style={{ borderColor: '#F0C9C4' }}>
        <Heading style={{ fontSize: 19, color: colors.error }}>Delete account</Heading>
        <Small style={{ marginTop: 4, marginBottom: space(3) }}>
          Permanently deletes your account and every piece of data tied to it, on the app and the website. This can't be undone.
        </Small>
        <Button title="Delete my account" variant="danger" onPress={() => setDeleteOpen(true)} />
      </Card>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <KeyboardAvoidingView behavior="padding" style={s.backdrop}>
          <View style={s.sheet}>
            <Heading>Delete your account?</Heading>
            <Body muted style={{ marginTop: 6, marginBottom: space(4) }}>
              All your moods, chats and insights will be permanently removed.
            </Body>
            <Field label="Confirm your password" value={pw} onChangeText={setPw} secure error={deleteErr} />
            <Button title="Delete permanently" variant="danger" onPress={deleteAccount} loading={deleting} />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setDeleteOpen(false);
                setPw('');
                setDeleteErr('');
              }}
              style={{ marginTop: 6 }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: colors.sageWash, marginBottom: space(4) },
  linkTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.charcoal },
  linkSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.midGray, marginTop: 1 },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: space(3) },
  verifyText: { fontFamily: fonts.medium, fontSize: 12.5 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
  divider: { height: 1, backgroundColor: colors.creamDark, marginVertical: space(4) },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space(4) },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.sageDark },
  backdrop: { flex: 1, backgroundColor: 'rgba(44,44,44,0.45)', justifyContent: 'center', padding: space(5) },
  sheet: { backgroundColor: colors.warmWhite, borderRadius: radius.lg, padding: space(6) },
});
