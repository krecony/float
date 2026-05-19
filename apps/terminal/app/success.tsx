import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PulseRing } from '../src/components/PulseRing';
import { COLORS } from '../src/theme';

const AUTO_RETURN_MS = 4000;

export default function SuccessScreen() {
  const { amountCents: amountCentsParam } = useLocalSearchParams<{
    amountCents: string;
  }>();
  const amountCents = parseInt(amountCentsParam ?? '0', 10);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Haptic feedback
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Entrance animations
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 300 });
    glowOpacity.value = withSequence(
      withDelay(200, withTiming(0.6, { duration: 400 })),
      withTiming(0.3, { duration: 800 }),
    );
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    // Auto-return to home
    const timer = setTimeout(() => {
      router.replace('/');
    }, AUTO_RETURN_MS);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateY: withDelay(
          300,
          withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }),
        ),
      },
    ],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Glow background */}
        <Animated.View style={[styles.glow, glowStyle]} />

        {/* Icon */}
        <View style={styles.iconWrapper}>
          <PulseRing size={220} color={COLORS.success} count={3} duration={2000} />
          <Animated.View style={[styles.iconCircle, iconStyle]}>
            <Ionicons name="checkmark" size={64} color={COLORS.success} />
          </Animated.View>
        </View>

        {/* Text */}
        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.statusLabel}>PAYMENT</Text>
          <Text style={styles.statusTitle}>Approved</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountCurrency}>€</Text>
            <Text style={styles.amountValue}>
              {(amountCents / 100).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.subtitle}>Transaction complete</Text>
        </Animated.View>

        {/* Return button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.returnBtnText}>New Payment</Text>
        </TouchableOpacity>

        <Text style={styles.autoReturn}>
          Returning to home automatically...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.success,
    top: '15%',
    alignSelf: 'center',
    // Simulated glow via large shadow
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 120,
    elevation: 0,
    // Blend by making it transparent
    opacity: 0,
  },
  iconWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.success + '20',
    borderWidth: 2,
    borderColor: COLORS.success + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: COLORS.success,
  },
  statusTitle: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
  amountCurrency: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.subtext,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subtext,
    marginTop: 4,
  },
  returnBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '50',
    backgroundColor: COLORS.success + '15',
  },
  returnBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  autoReturn: {
    fontSize: 13,
    color: COLORS.muted,
  },
});
