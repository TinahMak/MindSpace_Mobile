import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, StyleSheet, Text, View } from 'react-native';

import BreathingMark from '../components/BreathingMark';
import { Body, Button, Screen, Small } from '../components/ui';
import { colors, fonts, radius, space } from '../lib/theme';

const VIDEO = require('../../assets/media/breathe.mp4');
const POSTER = require('../../assets/media/breathe-poster.jpg');

export default function Breathe() {
  const player = useVideoPlayer(VIDEO, (p) => {
    p.loop = false;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  function playFromStart() {
    player.currentTime = 0;
    player.play();
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

      <View style={s.alone}>
        <BreathingMark size={72} />
        <View style={{ flex: 1 }}>
          <Text style={s.aloneTitle}>Prefer it quiet?</Text>
          <Small>Breathe in as the bars rise, out as they settle. Repeat a few times.</Small>
        </View>
      </View>
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
