import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { api } from '../lib/api';
import { colors, space } from '../lib/theme';
import { Button, Card, Heading, Notice, Small, styles as ui } from './ui';

export default function RateApp() {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api('/rating/')
      .then((r) => {
        if (r) {
          setSaved(r);
          setStars(r.stars);
          setComment(r.comment || '');
        }
      })
      .catch(() => {});
  }, []);

  const changed = stars && (!saved || saved.stars !== stars || (saved.comment || '') !== comment.trim());

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api('/rating/', { method: 'POST', body: { stars, comment, platform: Platform.OS } });
      setSaved(r);
      setMsg({ tone: 'success', text: 'Thank you for your feedback.' });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ marginBottom: space(4) }}>
      <Heading style={{ fontSize: 19 }}>Rate MindSpace</Heading>
      <Small style={{ marginTop: 2, marginBottom: space(3) }}>
        {saved ? 'You can update your rating any time.' : 'How is MindSpace working for you?'}
      </Small>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: space(3) }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
            <Ionicons name={n <= stars ? 'star' : 'star-outline'} size={32} color={n <= stars ? '#C9973A' : colors.lightGray} />
          </Pressable>
        ))}
      </View>
      {stars ? (
        <TextInput
          style={[ui.input, { minHeight: 70, textAlignVertical: 'top' }]}
          value={comment}
          onChangeText={(t) => setComment(t.slice(0, 1000))}
          placeholder="Anything you'd like to tell us? (optional)"
          placeholderTextColor="#A19C94"
          multiline
        />
      ) : null}
      {msg ? <Notice tone={msg.tone} style={{ marginTop: space(3), marginBottom: 0 }}>{msg.text}</Notice> : null}
      {changed ? <Button title={saved ? 'Update rating' : 'Send rating'} onPress={save} loading={busy} style={{ marginTop: space(3) }} /> : null}
    </Card>
  );
}
