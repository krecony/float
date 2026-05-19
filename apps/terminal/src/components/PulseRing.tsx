import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const RING_COLOR = '#7c3aed';
const RING_SIZE = 180;

interface PulseRingProps {
  size?: number;
  color?: string;
  /** Number of concentric rings */
  count?: number;
  duration?: number;
}

function Ring({
  delay,
  size,
  color,
  duration,
}: {
  delay: number;
  size: number;
  color: string;
  duration: number;
}) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.8, { duration, easing: Easing.out(Easing.ease) }), -1, false),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration, easing: Easing.out(Easing.ease) }), -1, false),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export function PulseRing({
  size = RING_SIZE,
  color = RING_COLOR,
  count = 3,
  duration = 2200,
}: PulseRingProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {Array.from({ length: count }).map((_, i) => (
        <Ring
          key={i}
          delay={(duration / count) * i}
          size={size}
          color={color}
          duration={duration}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
