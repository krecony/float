import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../src/theme';

export default function SuccessScreen() {
  const router = useRouter();
  const { amount, description } = useLocalSearchParams<{
    amount: string;
    description: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  const formattedAmount = amount
    ? `€${parseFloat(amount).toFixed(2)}`
    : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>

        <View style={styles.textBlock}>
          <Text style={styles.successTitle}>Payment requested</Text>
          {formattedAmount ? (
            <Text style={styles.amount}>{formattedAmount}</Text>
          ) : null}
          {description ? (
            <Text style={styles.descriptionText}>{description}</Text>
          ) : null}
          <Text style={styles.sub}>
            The group members will receive an approval request on their phones.
          </Text>
        </View>

        <Pressable
          style={styles.newBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.newBtnText}>New transaction</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(61,255,168,0.12)',
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: 52, color: colors.accent },
  textBlock: { alignItems: 'center', gap: spacing.sm, maxWidth: 300 },
  successTitle: { ...typography.title, color: colors.text, textAlign: 'center' },
  amount: { fontSize: 40, fontWeight: '700', color: colors.accent, textAlign: 'center' },
  descriptionText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  sub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  newBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  newBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
