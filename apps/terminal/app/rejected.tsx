import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/theme';

export default function RejectedScreen() {
  const { rejectedBy } = useLocalSearchParams<{ rejectedBy?: string }>();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 250 });

    // Shake animation
    shakeX.value = withSequence(
      withDelay(300, withTiming(12, { duration: 60 })),
      withTiming(-12, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(4, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );

    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Glow background */}
        <View style={styles.glow} />

        {/* Icon */}
        <Animated.View style={[styles.iconCircle, iconStyle]}>
          <Ionicons name="close" size={64} color={COLORS.error} />
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.statusLabel}>PAYMENT</Text>
          <Text style={styles.statusTitle}>Declined</Text>

          {rejectedBy ? (
            <View style={styles.rejecterBadge}>
              <Ionicons name="person-outline" size={14} color={COLORS.error} />
              <Text style={styles.rejecterText}>{rejectedBy} declined this request</Text>
            </View>
          ) : null}

          <Text style={styles.subtitle}>The group did not approve this payment</Text>
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="home-outline" size={18} color={COLORS.subtext} />
            <Text style={styles.homeBtnText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.text} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
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
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '10%',
    alignSelf: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 100,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.error + '18',
    borderWidth: 2,
    borderColor: COLORS.error + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: COLORS.error,
  },
  statusTitle: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1.5,
  },
  rejecterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.error + '12',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    marginTop: 4,
  },
  rejecterText: {
    fontSize: 14,
    color: COLORS.errorLight,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  homeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.error + '18',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.errorLight,
  },
});
