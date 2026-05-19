import { formatCents } from '@grouppay/shared';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { useGroupData } from '../providers/GroupDataProvider';
import { colors, spacing, typography } from '../theme';

const BANNER_HEIGHT = 72;
const AUTO_DISMISS_MS = 5000;

export function NewTransactionBanner() {
  const { session } = useAuth();
  const { latestTransaction, clearLatestTransaction } = useGroupData();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwnTransaction = latestTransaction?.created_by === session?.user.id;
  const visible = !!latestTransaction && !isOwnTransaction;

  const dismiss = useRef(() => {}).current;

  // Keep dismiss stable but able to call the latest clearLatestTransaction.
  const clearRef = useRef(clearLatestTransaction);
  clearRef.current = clearLatestTransaction;

  const slideOut = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(translateY, {
      toValue: -BANNER_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => clearRef.current());
  };

  // Reassign dismiss to slideOut via ref trick to keep it stable.
  Object.assign(dismiss, slideOut);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
      timerRef.current = setTimeout(slideOut, AUTO_DISMISS_MS);
    } else {
      Animated.timing(translateY, {
        toValue: -BANNER_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!latestTransaction) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>💳</Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>New transaction</Text>
          <Text style={styles.body} numberOfLines={1}>
            {latestTransaction.description ?? 'Payment'} · {formatCents(latestTransaction.amount_cents)}
          </Text>
        </View>
        <Pressable onPress={slideOut} style={styles.dismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(61, 255, 168, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  text: { flex: 1 },
  title: { color: colors.accent, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { ...typography.body, color: colors.text, fontSize: 14 },
  dismiss: { padding: spacing.sm },
  dismissText: { color: colors.textMuted, fontSize: 16 },
});
