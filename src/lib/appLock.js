import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY = 'mindspace.appLock';

export async function lockAvailable() {
  try {
    // NONE = 0: the phone itself has no PIN, pattern, fingerprint or face set up.
    return (await LocalAuthentication.getEnrolledLevelAsync()) > 0;
  } catch {
    return false;
  }
}

export async function isLockOn() {
  return (await SecureStore.getItemAsync(KEY).catch(() => null)) === '1';
}

export async function unlock(reason = 'Unlock MindSpace') {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false, // phone PIN or pattern works too
  });
  return r.success;
}

export async function setLock(on) {
  if (on) {
    if (!(await lockAvailable())) throw new Error('Set up a screen lock (PIN, pattern, fingerprint or face) on your phone first.');
    if (!(await unlock('Confirm to turn on app lock'))) return false;
    await SecureStore.setItemAsync(KEY, '1');
  } else {
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
  }
  return true;
}
