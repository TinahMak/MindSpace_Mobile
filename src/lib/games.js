import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { AccessibilityInfo } from 'react-native';

// ── preferences: sound OFF by default, gentle vibration ON ──────────────
const PREFS_KEY = 'mindspace.gamePrefs';
let prefs = { sound: false, vibration: true };
let loaded = false;

export async function loadPrefs() {
  if (loaded) return prefs;
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
  } catch {}
  loaded = true;
  return prefs;
}

export async function savePrefs(next) {
  prefs = { ...prefs, ...next };
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  return prefs;
}

// ── sound: our own soft tones, respecting the phone's silent switch ─────
const FILES = {
  pop: require('../../assets/sounds/pop.wav'),
  drop: require('../../assets/sounds/drop.wav'),
  chime: require('../../assets/sounds/chime.wav'),
  sand: require('../../assets/sounds/sand.wav'),
};
const players = {};
let audioReady = false;

async function ensureAudio() {
  if (audioReady) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: false });
  } catch {}
  audioReady = true;
}

export async function play(name) {
  if (!prefs.sound || !FILES[name]) return;
  try {
    await ensureAudio();
    if (!players[name]) players[name] = createAudioPlayer(FILES[name]);
    const p = players[name];
    p.volume = 0.6;
    await p.seekTo(0);
    p.play();
  } catch {}
}

export function tap(strength = 'light') {
  if (!prefs.vibration) return;
  const s = { light: Haptics.ImpactFeedbackStyle.Light, soft: Haptics.ImpactFeedbackStyle.Soft }[strength] || Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(s).catch(() => {});
}

export async function reduceMotion() {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

// ── calm points: grow the garden. Stored on this phone only. ────────────
const POINTS_KEY = 'mindspace.calmPoints';
const DAY_KEY = 'mindspace.calmPointsDay';

export async function getCalmPoints() {
  return Number((await SecureStore.getItemAsync(POINTS_KEY).catch(() => null)) || 0);
}

/** reason is just for readability at the call site. Max 12 points per day so it stays gentle. */
export async function addCalmPoint(reason = '') { // eslint-disable-line no-unused-vars
  try {
    const today = new Date().toDateString();
    const raw = await SecureStore.getItemAsync(DAY_KEY);
    const day = raw ? JSON.parse(raw) : { d: today, n: 0 };
    const n = day.d === today ? day.n : 0;
    if (n >= 12) return getCalmPoints();
    const pts = (await getCalmPoints()) + 1;
    await SecureStore.setItemAsync(POINTS_KEY, String(pts));
    await SecureStore.setItemAsync(DAY_KEY, JSON.stringify({ d: today, n: n + 1 }));
    return pts;
  } catch {
    return 0;
  }
}
