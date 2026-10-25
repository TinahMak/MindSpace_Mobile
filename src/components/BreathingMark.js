import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

// The MindSpace mark, alive: five bars that slowly swell and settle
// (about 4 s in, 6 s out), the same rhythm as a calming breath.
const BARS = ['#E1A080', '#E8BEA4', '#CDC4B4', '#8FB49C', '#4A6B57'];
const HEIGHTS = [0.42, 0.74, 1, 0.74, 0.42];

// restartKey: change it to restart the rhythm from the start of an in-breath
// (used to keep the bars in time with breathing sounds).
export default function BreathingMark({ size = 160, style, restartKey = 0 }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    let cancelled = false;
    t.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(t, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(t, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [t, restartKey]);

  const barW = size * 0.12;
  const gap = size * 0.07;
  return (
    <View
      style={[{ width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BARS.map((c, i) => {
        // Outer bars move more than the centre one, so it reads as a wave.
        const swing = 0.18 + Math.abs(i - 2) * 0.1;
        const scaleY = t.interpolate({ inputRange: [0, 1], outputRange: [1 - swing * 0.5, 1 + swing * 0.35] });
        return (
          <Animated.View
            key={c}
            style={{
              width: barW,
              height: size * 0.72 * HEIGHTS[i],
              borderRadius: barW / 2,
              backgroundColor: c,
              transform: [{ scaleY }],
            }}
          />
        );
      })}
    </View>
  );
}
