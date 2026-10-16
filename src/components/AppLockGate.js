import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { isLockOn, unlock } from '../lib/appLock';
import { useAuth } from '../lib/auth';
import { colors, fonts, space } from '../lib/theme';
import { Button } from './ui';

const RELOCK_AFTER_MS = 60 * 1000; // lock again after a minute in the background

export default function AppLockGate({ children }) {
  const { token } = useAuth();
  const [locked, setLocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const leftAt = useRef(null);

  const tryUnlock = useCallback(async () => {
    if (await unlock()) setLocked(false);
  }, []);

  useEffect(() => {
    (async () => {
      if (token && (await isLockOn())) {
        setLocked(true);
        tryUnlock();
      }
      setChecked(true);
    })();
  }, [token, tryUnlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'background') leftAt.current = Date.now();
      if (state === 'active' && leftAt.current && Date.now() - leftAt.current > RELOCK_AFTER_MS && token && (await isLockOn())) {
        setLocked(true);
        tryUnlock();
      }
    });
    return () => sub.remove();
  }, [token, tryUnlock]);

  if (!checked) return null;
  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked ? (
        <View style={s.cover}>
          <View style={s.icon}><Ionicons name="lock-closed" size={28} color={colors.sageDark} /></View>
          <Text style={s.title}>MindSpace is locked</Text>
          <Text style={s.sub}>Use your fingerprint, face or phone PIN to open it.</Text>
          <Button title="Unlock" icon="finger-print" onPress={tryUnlock} style={{ marginTop: space(6), alignSelf: 'stretch' }} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: space(8) },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sageWash, alignItems: 'center', justifyContent: 'center', marginBottom: space(4) },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.charcoal },
  sub: { fontFamily: fonts.body, fontSize: 14.5, color: colors.midGray, marginTop: 6, textAlign: 'center' },
});
