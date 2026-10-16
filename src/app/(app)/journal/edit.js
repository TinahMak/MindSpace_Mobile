import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Select from '../../../components/Select';
import { Button, Loading, Notice, Screen, Small, callNumber, styles as ui } from '../../../components/ui';
import { api } from '../../../lib/api';
import { colors, fonts, moodTint, radius, space } from '../../../lib/theme';
import { addCalmPoint } from '../../../lib/games';
import { useMeta } from '../../../lib/useMeta';

export default function JournalEdit() {
  const { id } = useLocalSearchParams();
  const meta = useMeta();
  const nav = useNavigation();
  const [prompts, setPrompts] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [text, setText] = useState('');
  const [mood, setMood] = useState(null);
  const [loaded, setLoaded] = useState(!id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/selfcare/meta/').then((m) => setPrompts(m.journal_prompts)).catch(() => {});
    if (id) {
      nav.setOptions({ title: 'Edit entry' });
      api(`/journal/${id}/`).then((e) => { setText(e.content); setMood(e.mood); setLoaded(true); }).catch((e) => setErr(e.message));
    }
  }, [id, nav]);

  const promptLabel = prompts.find((p) => p.value === prompt)?.label;

  async function save() {
    const content = (promptLabel && !id ? `${promptLabel}\n\n` : '') + text.trim();
    if (text.trim().length < 2) return setErr('Write a little before saving.');
    setBusy(true);
    setErr('');
    try {
      const r = await api(id ? `/journal/${id}/` : '/journal/', { method: id ? 'PATCH' : 'POST', body: { content, mood } });
      if (!id) addCalmPoint('journal');
      if (r.crisis_line) {
        Alert.alert(
          "You don't have to carry this alone",
          `What you wrote sounds really painful. If you might be in danger, please call ${r.crisis_line.name} on ${r.crisis_line.number}. It's free, ${r.crisis_line.hours}.`,
          [{ text: 'Call now', onPress: () => callNumber(r.crisis_line.number) }, { text: 'Not now', onPress: () => router.back() }],
        );
      } else router.back();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    Alert.alert('Delete this entry?', "It can't be recovered.", [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api(`/journal/${id}/`, { method: 'DELETE' }).catch(() => {}); router.back(); } },
    ]);
  }

  if (!loaded) return err ? <Screen edges={[]}><Notice>{err}</Notice></Screen> : <Loading />;
  return (
    <Screen edges={[]}>
      <View style={{ height: space(4) }} />
      {!id ? (
        <Select label="Start from a prompt (optional)" value={prompt} options={prompts} onChange={setPrompt} placeholder="Just write freely" allowClear />
      ) : null}
      {promptLabel && !id ? <Text style={s.prompt}>{promptLabel}</Text> : null}
      <TextInput
        style={[ui.input, s.editor]}
        value={text}
        onChangeText={(t) => setText(t.slice(0, 10000))}
        placeholder="Write whatever is on your mind. There's no right way to do this."
        placeholderTextColor="#A19C94"
        multiline
        autoFocus={!id}
        textAlignVertical="top"
      />
      <Text style={[ui.label, { marginTop: space(5) }]}>How are you feeling? (optional)</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {meta.moods.map((m) => (
          <Pressable key={m.value} onPress={() => setMood(mood === m.value ? null : m.value)} style={[s.mood, { backgroundColor: mood === m.value ? moodTint[m.value] : colors.cream }, mood === m.value && { borderColor: colors.sageDark }]} accessibilityLabel={m.label}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Small style={{ marginTop: space(4) }}>Private: journal entries are never read by the AI, professionals or admins.</Small>
      {err ? <Notice style={{ marginTop: space(3) }}>{err}</Notice> : null}
      <Button title={id ? 'Save changes' : 'Save entry'} onPress={save} loading={busy} style={{ marginTop: space(4) }} />
      {id ? <Button title="Delete entry" variant="ghost" onPress={remove} style={{ marginTop: 6 }} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  prompt: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.sageDark, marginBottom: space(3) },
  editor: { minHeight: 220, fontSize: 16, lineHeight: 24 },
  mood: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'transparent' },
});
