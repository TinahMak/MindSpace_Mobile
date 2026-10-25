import { useEffect, useRef, useState } from 'react';
import { useEvent } from 'expo';
import { setAudioModeAsync } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import BreathingMark from '../components/BreathingMark';
import { Body, Button, Screen, Small } from '../components/ui';
import { createBreathSession, loadBreathSoundPref, loadBreathVoicePref } from '../lib/breathSound';
import { colors, fonts, radius, space } from '../lib/theme';

const VIDEO = require('../../assets/media/breathe.mp4');
const POSTER = require('../../assets/media/breathe-poster.jpg');

// Same rhythm as the animated bars: 4 seconds in, 6 seconds out.
const BAR_ROUNDS = 3;
const IN_SECS = 4;
const OUT_SECS = 6;

export default function Breathe() {
  const player = useVideoPlayer(VIDEO, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Breathe-with-the-bars session (with sound)
  const audio = useRef(null);
  const timers = useRef([]);
  const [bars, setBars] = useState({ running: false, label: '', round: 0, key: 0 });

  useEffect(() => {
    audio.current = createBreathSession();
    // Same Tones / Voice choices the person made on the Breathing screen.
    loadBreathSoundPref().then((on) => audio.current?.setTones(on));
    loadBreathVoicePref().then((on) => audio.current?.setVoice(on));
    return () => {
      clearTimers();
      audio.current?.end();
      audio.current?.release();
    };
  }, []);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  async function playFromStart() {
    stopBars();
    // The video has its own soundtrack; make sure it is heard even on silent.
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    player.currentTime = 0;
    player.play();
  }

  async function startBars() {
    if (isPlaying) player.pause();
    clearTimers();
    await audio.current?.begin();
    const key = Date.now();
    const cycle = (IN_SECS + OUT_SECS) * 1000;
    for (let r = 0; r < BAR_ROUNDS; r++) {
      const at = r * cycle;
      timers.current.push(
        setTimeout(() => {
          audio.current?.phase('Breathe in', IN_SECS);
          setBars({ running: true, label: 'Breathe in', round: r + 1, key });
        }, at),
        setTimeout(() => {
          audio.current?.phase('Breathe out', OUT_SECS);
          setBars({ running: true, label: 'Breathe out', round: r + 1, key });
        }, at + IN_SECS * 1000),
      );
    }
    timers.current.push(
      setTimeout(() => {
        audio.current?.finish();
        setBars({ running: false, label: 'Well done', round: 0, key });
        timers.current.push(setTimeout(() => audio.current?.end(), 4600));
      }, BAR_ROUNDS * cycle),
    );
    setBars({ running: true, label: 'Breathe in', round: 1, key });
  }

  function stopBars() {
    clearTimers();
    audio.current?.end();
    setBars((b) => ({ ...b, running: false, label: '', round: 0 }));
  }

  return (
    <Screen edges={[]}>
      <Body muted style={{ marginTop: space(2), marginBottom: space(4) }}>
        Sit somewhere comfortable, turn your sound on, and follow along. It takes about 15 seconds.
      </Body>

      <View style={s.frame}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={isPlaying}
          allowsFullscreen
        />
        {!isPlaying ? (
          <View style={StyleSheet.absoluteFill}>
            <Image source={POSTER} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={s.shade} />
          </View>
        ) : null}
      </View>

      <Button
        title={isPlaying ? 'Pause' : 'Start guided breath'}
        icon={isPlaying ? 'pause' : 'play'}
        variant={isPlaying ? 'outline' : 'primary'}
        onPress={() => (isPlaying ? player.pause() : playFromStart())}
        style={{ marginTop: space(4) }}
      />

      <Pressable
        onPress={bars.running ? stopBars : startBars}
        accessibilityRole="button"
        accessibilityLabel={bars.running ? 'Stop breathing with the bars' : 'Breathe with the bars, with sound, for 30 seconds'}
        style={s.alone}
      >
        <BreathingMark size={72} restartKey={bars.key} />
        <View style={{ flex: 1 }}>
          {bars.running ? (
            <>
              <Text style={s.aloneTitle} accessibilityLiveRegion="polite">{bars.label}</Text>
              <Small>Round {bars.round} of {BAR_ROUNDS}. Tap to stop.</Small>
            </>
          ) : (
            <>
              <Text style={s.aloneTitle}>{bars.label === 'Well done' ? 'Well done' : 'Breathe with the bars'}</Text>
              <Small>
                Tap to start, then close your eyes if you like. Bells going up: breathe in. Bells going down: breathe out. About 30 seconds.
              </Small>
            </>
          )}
        </View>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 864 / 496,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
  },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(44,44,44,0.15)' },
  alone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    marginTop: space(6),
    padding: space(4),
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  aloneTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.charcoal, marginBottom: 2 },
});
