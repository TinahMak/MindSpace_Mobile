import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import HelpButton from '../../../components/HelpButton';
import { Button, CrisisBanner, Heading, Loading, Notice, Small, callNumber } from '../../../components/ui';
import { api } from '../../../lib/api';
import { preparePhoto, uploadChatPhoto } from '../../../lib/upload';
import { colors, fonts, radius, space } from '../../../lib/theme';

export default function Chat() {
  const { id } = useLocalSearchParams();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [banner, setBanner] = useState(false);
  const [line, setLine] = useState(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [logged, setLogged] = useState({});
  const [offer, setOffer] = useState(null); // 'crisis' | 'asked' | 'distress'
  const offeredIn = useRef(new Set()); // conversations where we've already asked
  const listRef = useRef(null);

  const apply = (d) => {
    setConv(d.conversation);
    setMessages(d.messages);
    setBanner(d.show_crisis_banner);
    setLine(d.crisis_line);
  };

  const load = useCallback(async () => {
    try {
      const d = await api(id ? `/chat/conversations/${id}/` : '/chat/current/');
      apply(d);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages.length, sending]);

  async function startNew() {
    try {
      const c = await api('/chat/conversations/', { method: 'POST' });
      router.setParams({ id: String(c.id) });
      setMessages([]);
      setConv(c);
      setBanner(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function pickPhoto(fromCamera) {
    const opts = { mediaTypes: ['images'], quality: 0.7, allowsEditing: false };
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access in your phone settings to share a photo.');
      return;
    }
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0]);
  }

  function attach() {
    Alert.alert('Share a photo', 'MindSpace can suggest a mood from it, and you choose whether to log it.', [
      { text: 'Take photo', onPress: () => pickPhoto(true) },
      { text: 'Choose from library', onPress: () => pickPhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function send() {
    const content = text.trim();
    if ((!content && !photo) || !conv || sending) return;
    setSending(true);
    setError('');

    // Show the message straight away while the AI thinks.
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: 'user', content, image_url: photo?.uri, pending: true }]);
    setText('');
    const sentPhoto = photo;
    setPhoto(null);

    try {
      let d;
      if (sentPhoto) {
        const uri = await preparePhoto(sentPhoto);
        d = await uploadChatPhoto(conv.id, uri, content);
      } else {
        d = await api(`/chat/conversations/${conv.id}/messages/`, { method: 'POST', body: { content }, timeout: 90000 });
      }
      setMessages((m) => [
        ...m.filter((x) => x.id !== tempId),
        d.user_message,
        ...(d.assistant_message ? [d.assistant_message] : []),
      ]);
      setBanner(d.show_crisis_banner);
      setLine(d.crisis_line);
      if (d.ai_error) setError(d.ai_error);
      // Offer professional help, at most once per conversation (crisis always shows).
      if (d.support_signal && (d.support_signal === 'crisis' || !offeredIn.current.has(conv.id))) {
        offeredIn.current.add(conv.id);
        setTimeout(() => setOffer(d.support_signal), 900); // let the reply appear first
      }
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(content);
      setPhoto(sentPhoto);
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function logMood(msg) {
    try {
      await api(`/chat/messages/${msg.id}/log-mood/`, { method: 'POST' });
      setLogged((l) => ({ ...l, [msg.id]: true }));
    } catch (e) {
      Alert.alert('Could not log mood', e.message);
    }
  }

  const renderItem = ({ item }) => {
    const mine = item.role === 'user';
    return (
      <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
        <View style={[s.bubble, mine ? s.mine : s.theirs, item.pending && { opacity: 0.7 }]}>
          {item.image_url ? <Image source={{ uri: item.image_url }} style={s.img} /> : null}
          {item.content ? <Text style={[s.msg, mine && { color: colors.white }]}>{item.content}</Text> : null}
        </View>
        {item.suggested_mood ? (
          <View style={s.suggest}>
            <Text style={{ fontSize: 24 }}>{item.suggested_mood_emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.suggestTitle}>Suggested mood: {item.suggested_mood_label}</Text>
              {item.suggested_emotions?.length ? <Small>{item.suggested_emotions.join(', ')}</Small> : null}
            </View>
            {logged[item.id] ? (
              <View style={s.loggedPill}>
                <Ionicons name="checkmark" size={14} color={colors.sageDark} />
                <Text style={s.loggedText}>Logged</Text>
              </View>
            ) : (
              <Pressable onPress={() => logMood(item)} style={s.logBtn} accessibilityRole="button">
                <Text style={s.logText}>Log it</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.warmWhite }} edges={['top']}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={s.avatar}>
            <Text style={{ color: colors.white }}>♡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>MindSpace AI</Text>
            <Small>Here to listen, without judgement</Small>
          </View>
        </View>
        <HelpButton />
      </View>
      <View style={s.tools}>
        <Pressable onPress={() => router.push('/conversations')} style={s.tool} hitSlop={6}>
          <Ionicons name="time-outline" size={16} color={colors.sageDark} />
          <Text style={s.toolText}>History</Text>
        </Pressable>
        <Pressable onPress={startNew} style={s.tool} hitSlop={6}>
          <Ionicons name="add" size={17} color={colors.sageDark} />
          <Text style={s.toolText}>New conversation</Text>
        </Pressable>
      </View>

      {banner ? (
        <View style={{ paddingHorizontal: space(4), paddingBottom: space(2) }}>
          <CrisisBanner line={line} onMore={() => router.push('/help')} />
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {!conv && !error ? (
          <Loading />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderItem}
            contentContainerStyle={{ padding: space(4), flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyTitle}>How are you feeling today?</Text>
                <Small style={{ textAlign: 'center', marginTop: 6, maxWidth: 280 }}>
                  Type whatever is on your mind, or share a photo. MindSpace AI is not a therapist and can't diagnose.
                </Small>
              </View>
            }
            ListFooterComponent={
              sending ? (
                <View style={[s.bubble, s.theirs, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.sage} />
                  <Small>MindSpace is replying…</Small>
                </View>
              ) : null
            }
          />
        )}

        {error ? <Notice style={{ marginHorizontal: space(4), marginBottom: space(2) }}>{error}</Notice> : null}

        {photo ? (
          <View style={s.preview}>
            <Image source={{ uri: photo.uri }} style={s.previewImg} />
            <Small style={{ flex: 1 }}>Photo attached</Small>
            <Pressable onPress={() => setPhoto(null)} hitSlop={8} accessibilityLabel="Remove photo">
              <Ionicons name="close-circle" size={22} color={colors.midGray} />
            </Pressable>
          </View>
        ) : null}

        <View style={s.composer}>
          <Pressable onPress={attach} style={s.iconBtn} accessibilityLabel="Attach a photo" hitSlop={6}>
            <Ionicons name="image-outline" size={22} color={colors.sageDark} />
          </Pressable>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor="#A19C94"
            multiline
            maxLength={4000}
          />
          <Pressable
            onPress={send}
            disabled={sending || (!text.trim() && !photo)}
            style={[s.send, (sending || (!text.trim() && !photo)) && { opacity: 0.4 }]}
            accessibilityLabel="Send message"
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!offer} transparent animationType="fade" onRequestClose={() => setOffer(null)}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.sheetIcon}>
              <Ionicons name={offer === 'crisis' ? 'heart' : 'people'} size={24} color={offer === 'crisis' ? colors.terra : colors.sageDark} />
            </View>
            <Heading style={{ textAlign: 'center' }}>
              {offer === 'asked' ? 'Would you like to find a professional?' : 'Would you like to talk to a professional?'}
            </Heading>
            <Small style={{ textAlign: 'center', marginTop: space(2), marginBottom: space(5), fontSize: 14, lineHeight: 21 }}>
              {offer === 'crisis'
                ? "You don't have to go through this alone. If you might be in danger, please call a crisis line now."
                : offer === 'asked'
                  ? 'MindSpace has verified psychologists, counsellors, social workers and doctors, nearby or online.'
                  : 'It sounds like things are heavy right now. A verified professional on MindSpace could help.'}
            </Small>
            {offer === 'crisis' && line ? (
              <Button title={`Call ${line.name}: ${line.number}`} icon="call" variant="help" onPress={() => { setOffer(null); callNumber(line.number); }} style={{ marginBottom: space(3) }} />
            ) : null}
            <Button
              title="Yes, show me professionals"
              variant={offer === 'crisis' ? 'outline' : 'primary'}
              onPress={() => { setOffer(null); router.push('/find-support'); }}
            />
            <Button title="Not now, keep chatting" variant="ghost" onPress={() => setOffer(null)} style={{ marginTop: 6 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(44,44,44,0.45)', justifyContent: 'flex-end', padding: space(4) },
  sheet: { backgroundColor: colors.warmWhite, borderRadius: radius.lg, padding: space(6), paddingTop: space(5) },
  sheetIcon: { alignSelf: 'center', width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', marginBottom: space(3) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(2),
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal },
  tools: { flexDirection: 'row', gap: 18, paddingHorizontal: space(4), paddingBottom: space(3) },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  mine: { backgroundColor: colors.sage, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.cream, borderBottomLeftRadius: 4 },
  msg: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.charcoal },
  img: { width: 200, height: 200, borderRadius: 10, marginBottom: 6, backgroundColor: colors.creamDark },
  suggest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    maxWidth: '90%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sageLight,
    borderRadius: radius.md,
    padding: 12,
  },
  suggestTitle: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.charcoal },
  logBtn: { backgroundColor: colors.sage, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  logText: { fontFamily: fonts.medium, fontSize: 13, color: colors.white },
  loggedPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loggedText: { fontFamily: fonts.medium, fontSize: 13, color: colors.sageDark },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space(16) },
  emptyTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, textAlign: 'center' },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: space(4),
    marginBottom: 6,
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  previewImg: { width: 40, height: 40, borderRadius: 6 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderTopWidth: 1,
    borderTopColor: colors.creamDark,
    backgroundColor: colors.white,
  },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.charcoal,
    backgroundColor: colors.warmWhite,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
