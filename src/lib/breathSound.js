import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';

/**
 * Sound for breathing sessions, made to be followed with eyes closed.
 *
 * Tones (calm, low and soft):
 *   Breathe in  – two soft bells going UP, then a warm tone that swells
 *   Breathe out – two soft bells going DOWN, then a warm tone that fades away
 *   Hold        – one low bell, then quiet
 *   Finished    – three gentle bells settling down
 *
 * Voice guide: a slow, soft spoken "Breathe in", "Hold", "Breathe out",
 * using the phone's own voice.
 *
 * Both are ON by default and can be switched off on the Breathing screen.
 */

const FILES = {
  'in-4': require('../../assets/sounds/breathe-in-4.mp3'),
  'out-4': require('../../assets/sounds/breathe-out-4.mp3'),
  'out-6': require('../../assets/sounds/breathe-out-6.mp3'),
  'out-8': require('../../assets/sounds/breathe-out-8.mp3'),
  'hold-4': require('../../assets/sounds/breathe-hold-4.mp3'),
  'hold-7': require('../../assets/sounds/breathe-hold-7.mp3'),
  done: require('../../assets/sounds/breathe-done.mp3'),
};

const SOUND_KEY = 'mindspace.breathSound';
const VOICE_KEY = 'mindspace.breathVoice';

async function loadFlag(key) {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw === null ? true : raw === 'on';
  } catch {
    return true;
  }
}

export const loadBreathSoundPref = () => loadFlag(SOUND_KEY);
export const loadBreathVoicePref = () => loadFlag(VOICE_KEY);
export const saveBreathSoundPref = (on) => SecureStore.setItemAsync(SOUND_KEY, on ? 'on' : 'off').catch(() => {});
export const saveBreathVoicePref = (on) => SecureStore.setItemAsync(VOICE_KEY, on ? 'on' : 'off').catch(() => {});

function kindOf(label) {
  if (/out/i.test(label)) return 'out';
  if (/in/i.test(label)) return 'in';
  return 'hold';
}

/** "Breathe in" + 4 seconds -> 'in-4'. Falls back to the nearest length we have. */
export function soundKey(label, secs) {
  const kind = kindOf(label);
  const exact = `${kind}-${secs}`;
  if (FILES[exact]) return exact;
  const options = Object.keys(FILES).filter((k) => k.startsWith(`${kind}-`));
  options.sort((a, b) => Math.abs(Number(a.split('-')[1]) - secs) - Math.abs(Number(b.split('-')[1]) - secs));
  return options[0];
}

const SPOKEN = { in: 'Breathe in', out: 'Breathe out', hold: 'Hold' };

function say(text) {
  try {
    Speech.stop();
    // Slow, slightly low and soft: calm rather than instructive.
    Speech.speak(text, { rate: 0.8, pitch: 0.9, volume: 0.8 });
  } catch {}
}

/**
 * One session's worth of sound. Create it when the screen opens and call
 * release() when it closes. setTones / setVoice switch each part on or off.
 */
export function createBreathSession() {
  const players = {};
  let current = null;
  let active = false;
  let tones = true;
  let voice = true;

  async function begin() {
    active = true;
    try {
      // A breathing session is something the person started on purpose, so
      // play even when the phone is on silent, and lower (not stop) any
      // music they have on.
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
    } catch {}
  }

  function playKey(key, volume) {
    if (!active || !tones || !FILES[key]) return;
    try {
      if (current && current !== players[key]) current.pause();
      if (!players[key]) players[key] = createAudioPlayer(FILES[key]);
      const p = players[key];
      p.volume = volume;
      p.seekTo(0).catch(() => {});
      p.play();
      current = p;
    } catch {}
  }

  function phase(label, secs) {
    playKey(soundKey(label, secs), 0.7);
    if (active && voice) say(SPOKEN[kindOf(label)]);
  }

  function finish() {
    playKey('done', 0.6);
    if (active && voice) say('Well done. Breathe normally.');
  }

  function stopSound() {
    try {
      if (current) current.pause();
    } catch {}
    current = null;
    try {
      Speech.stop();
    } catch {}
  }

  async function end() {
    active = false;
    stopSound();
    try {
      // Back to the app's normal behaviour (games respect the silent switch).
      await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    } catch {}
  }

  function setTones(on) {
    tones = on;
    if (!on) {
      try {
        if (current) current.pause();
      } catch {}
      current = null;
    }
  }

  function setVoice(on) {
    voice = on;
    if (!on) {
      try {
        Speech.stop();
      } catch {}
    }
  }

  function release() {
    active = false;
    stopSound();
    for (const p of Object.values(players)) {
      try {
        p.remove();
      } catch {}
    }
  }

  return { begin, phase, finish, end, release, setTones, setVoice };
}
