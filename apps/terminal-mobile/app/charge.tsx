import { createTransactionRequest, subscribeToGroupTransactions, unsubscribe } from '@grouppay/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabase } from '../src/providers/SupabaseProvider';
import { colors, spacing, typography } from '../src/theme';

type ChargeState = 'ready' | 'creating' | 'waiting_approvals' | 'completed' | 'rejected' | 'error';

export default function ChargeScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { groupId, userId, amount, description, participantIds } = useLocalSearchParams<{
    groupId: string;
    userId: string;
    amount: string;
    description: string;
    participantIds: string;
  }>();

  const [state, setState] = useState<ChargeState>('ready');
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const transactionIdRef = useRef<string | null>(null);

  const formattedAmount = amount ? `€${parseFloat(amount).toFixed(2)}` : '';
  const parsedParticipants: string[] = participantIds ? JSON.parse(participantIds) : [];

  // Subscribe to the transaction status once it's created
  useEffect(() => {
    if (!transactionId || !groupId) return;

    const channel = subscribeToGroupTransactions(
      supabase,
      groupId,
      {
        onUpdate: (tx) => {
          if (tx.id !== transactionIdRef.current) return;
          if (tx.status === 'completed') setState('completed');
          if (tx.status === 'rejected') setState('rejected');
        },
      },
      'charge-screen',
    );

    return () => {
      unsubscribe(supabase, channel);
    };
  }, [transactionId, groupId, supabase]);

  const handleCharge = async () => {
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError('Invalid amount');
      return;
    }

    setState('creating');
    try {
      const tx = await createTransactionRequest(supabase, {
        groupId,
        amountCents: cents,
        description: description || '',
        createdBy: userId,
        participantUserIds: parsedParticipants,
      });
      transactionIdRef.current = tx.id;
      setTransactionId(tx.id);
      setState('waiting_approvals');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
      setState('error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          {state === 'ready' || state === 'error' ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Cancel</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.nfcBadge}>
            <Text style={styles.nfcBadgeText}>📡 Customer split confirmed</Text>
          </View>

          <Text style={styles.amountLabel}>Charging</Text>
          <Text style={styles.amount}>{formattedAmount}</Text>

          {description ? <Text style={styles.descriptionText}>{description}</Text> : null}

          <Text style={styles.participantNote}>
            {parsedParticipants.length} participant{parsedParticipants.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        {state === 'ready' && (
          <>
            <Text style={styles.splitNote}>
              Split confirmed by customer. Press Charge to create the transaction.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.spacer} />
            <Pressable style={styles.chargeBtn} onPress={handleCharge}>
              <Text style={styles.chargeBtnText}>Charge {formattedAmount}</Text>
            </Pressable>
          </>
        )}

        {state === 'creating' && (
          <>
            <View style={styles.spacer} />
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.statusText}>Creating transaction…</Text>
            <View style={styles.spacer} />
          </>
        )}

        {state === 'waiting_approvals' && (
          <View style={[styles.statusBox, styles.statusBoxWaiting]}>
            <ActivityIndicator color={colors.accent} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.statusBoxTitle}>Waiting for approvals</Text>
            <Text style={styles.statusBoxSub}>
              {parsedParticipants.length} member{parsedParticipants.length !== 1 ? 's' : ''} need to approve on their phone.
            </Text>
          </View>
        )}

        {state === 'completed' && (
          <View style={[styles.statusBox, styles.statusBoxDone]}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.statusBoxTitle}>Payment approved!</Text>
            <Text style={styles.statusBoxSub}>All participants confirmed. Transaction complete.</Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.resetBtnText}>New transaction</Text>
            </Pressable>
          </View>
        )}

        {state === 'rejected' && (
          <View style={[styles.statusBox, styles.statusBoxRejected]}>
            <Text style={styles.crossmark}>✕</Text>
            <Text style={styles.statusBoxTitle}>Payment rejected</Text>
            <Text style={styles.statusBoxSub}>One or more participants declined the charge.</Text>
            <Pressable
              style={[styles.resetBtn, styles.resetBtnDanger]}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.resetBtnText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {state === 'error' && error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  topRow: { minHeight: 24 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.textMuted, fontSize: 15 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  nfcBadge: {
    backgroundColor: 'rgba(61,255,168,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(61,255,168,0.3)',
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  nfcBadgeText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: { fontSize: 52, fontWeight: '700', color: colors.text },
  descriptionText: { ...typography.body, color: colors.textMuted },
  participantNote: { ...typography.caption, color: colors.accent, marginTop: spacing.xs },

  splitNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  spacer: { flex: 1 },
  statusText: { color: colors.textMuted, textAlign: 'center', fontSize: 15 },

  chargeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  chargeBtnText: { color: colors.background, fontSize: 20, fontWeight: '700' },

  statusBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBoxWaiting: { borderColor: colors.accentDim, backgroundColor: colors.surface },
  statusBoxDone: { borderColor: colors.accent, backgroundColor: 'rgba(61,255,168,0.07)' },
  statusBoxRejected: { borderColor: colors.danger, backgroundColor: 'rgba(255,80,80,0.07)' },
  statusBoxTitle: { ...typography.headline, color: colors.text, textAlign: 'center' },
  statusBoxSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  checkmark: { fontSize: 48, color: colors.accent },
  crossmark: { fontSize: 48, color: colors.danger },
  resetBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  resetBtnDanger: { backgroundColor: colors.danger },
  resetBtnText: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
