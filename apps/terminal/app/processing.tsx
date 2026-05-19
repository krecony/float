import { Ionicons } from '@expo/vector-icons';
import { updateTransactionStatus } from '@grouppay/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApprovalTracker } from '../src/components/ApprovalTracker';
import { useTransactionApprovals } from '../src/hooks/useTransactionApprovals';
import { useSound } from '../src/hooks/useSound';
import { useSupabase } from '../src/providers/SupabaseProvider';
import { COLORS } from '../src/theme';

export default function ProcessingScreen() {
  const {
    transactionId,
    amountCents: amountCentsParam,
    groupId,
    threshold: thresholdParam,
  } = useLocalSearchParams<{
    transactionId: string;
    amountCents: string;
    groupId: string;
    threshold: string;
  }>();

  const amountCents = parseInt(amountCentsParam ?? '0', 10);
  const threshold = parseInt(thresholdParam ?? '1', 10);

  const client = useSupabase();
  const { members, approvedCount, outcome } = useTransactionApprovals(
    transactionId,
    groupId,
    threshold,
  );

  const { playApprovalSound } = useSound();
  const prevApprovedRef = useRef(0);
  const navigatedRef = useRef(false);

  // Play sound when new approval comes in
  useEffect(() => {
    if (approvedCount > prevApprovedRef.current) {
      prevApprovedRef.current = approvedCount;
      void playApprovalSound();
    }
  }, [approvedCount, playApprovalSound]);

  // Navigate when outcome is resolved — also persist status to DB
  useEffect(() => {
    if (navigatedRef.current) return;
    if (outcome === 'approved') {
      navigatedRef.current = true;
      void updateTransactionStatus(client, transactionId, 'completed').catch(
        (e) => console.warn('Failed to update transaction status:', e),
      );
      router.replace({
        pathname: '/success',
        params: { amountCents: String(amountCents) },
      });
    } else if (outcome === 'rejected') {
      navigatedRef.current = true;
      void updateTransactionStatus(client, transactionId, 'rejected').catch(
        (e) => console.warn('Failed to update transaction status:', e),
      );
      const rejecter = members.find((m) => m.status === 'rejected');
      router.replace({
        pathname: '/rejected',
        params: { rejectedBy: rejecter?.displayName ?? 'A member' },
      });
    }
  }, [outcome, amountCents, client, transactionId, members]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <SpinnerIcon />
          <View>
            <Text style={styles.headerLabel}>AWAITING APPROVALS</Text>
            <Text style={styles.headerAmount}>
              €{(amountCents / 100).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Live counter */}
        <View style={styles.counterRow}>
          <CounterBadge
            icon="checkmark-circle"
            count={approvedCount}
            label="Approved"
            color={COLORS.success}
          />
          <View style={styles.counterDivider} />
          <CounterBadge
            icon="time-outline"
            count={Math.max(0, members.length - approvedCount)}
            label="Pending"
            color={COLORS.subtext}
          />
          <View style={styles.counterDivider} />
          <CounterBadge
            icon="people-outline"
            count={threshold}
            label="Required"
            color={COLORS.primaryLight}
          />
        </View>

        {/* Member approval list */}
        <ScrollView
          style={styles.memberScroll}
          contentContainerStyle={styles.memberScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Group Members</Text>
          <ApprovalTracker
            members={members}
            approvedCount={approvedCount}
            threshold={threshold}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="wifi-outline" size={14} color={COLORS.muted} />
          <Text style={styles.footerText}>Listening for approvals in realtime</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SpinnerIcon() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons name="sync-outline" size={28} color={COLORS.primaryLight} />
    </Animated.View>
  );
}

function CounterBadge({
  icon,
  count,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.counterBadge}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.counterCount, { color }]}>{count}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  counterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  counterBadge: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  counterDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  counterCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  counterLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  memberScroll: {
    flex: 1,
  },
  memberScrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.subtext,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.muted,
  },
});

