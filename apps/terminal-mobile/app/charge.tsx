import { createTransactionRequest, listMembers } from '@grouppay/shared';
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

export default function ChargeScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { groupId, userId, amount, description } = useLocalSearchParams<{
    groupId: string;
    userId: string;
    amount: string;
    description: string;
  }>();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const memberIdsRef = useRef<string[]>([]);

  const formattedAmount = amount ? `€${parseFloat(amount).toFixed(2)}` : '';

  // Load members in the background so they're ready when Charge is pressed
  useEffect(() => {
    if (!groupId) return;
    listMembers(supabase, groupId)
      .then((m) => {
        memberIdsRef.current = m.map((mem) => mem.user_id);
      })
      .catch(() => {});
  }, [groupId, supabase]);

  const handleCharge = async () => {
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError('Invalid amount');
      return;
    }

    setSubmitting(true);
    try {
      await createTransactionRequest(supabase, {
        groupId,
        amountCents: cents,
        description: description || 'Purchase',
        createdBy: userId,
        participantUserIds: memberIdsRef.current,
      });
      router.replace({ pathname: '/success', params: { amount, description } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancel</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.nfcBadge}>
            <Text style={styles.nfcBadgeText}>📡 Customer connected via NFC</Text>
          </View>

          <Text style={styles.amountLabel}>Charging</Text>
          <Text style={styles.amount}>{formattedAmount}</Text>

          {description ? (
            <Text style={styles.descriptionText}>{description}</Text>
          ) : null}
        </View>

        <Text style={styles.splitNote}>
          The customer will choose who splits this payment on their phone.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.chargeBtn, submitting && styles.chargeBtnDisabled]}
          onPress={handleCharge}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.chargeBtnText}>Charge {formattedAmount}</Text>
          )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  topRow: {},
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
  amountLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  amount: { fontSize: 52, fontWeight: '700', color: colors.text },
  descriptionText: { ...typography.body, color: colors.textMuted },

  splitNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },

  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  spacer: { flex: 1 },

  chargeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  chargeBtnDisabled: { opacity: 0.5 },
  chargeBtnText: { color: colors.background, fontSize: 20, fontWeight: '700' },
});
