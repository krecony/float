import { approveTransaction, formatCents } from '@grouppay/shared';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useGroupData } from '../providers/GroupDataProvider';
import { useAuth } from '../providers/AuthProvider';
import { useSupabase } from '../providers/SupabaseProvider';
import { colors, spacing, typography } from '../theme';

export function PaymentRequestModal() {
  const { incomingTx, clearIncomingTx, refreshPending } = useGroupData();
  const { session } = useAuth();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  const handleDecision = useCallback(
    async (approved: boolean) => {
      if (!session?.user.id || !incomingTx) return;
      setLoading(true);
      try {
        await approveTransaction(supabase, incomingTx.id, session.user.id, approved);
        await refreshPending();
      } catch (e) {
        console.error('Approval decision failed', e);
      } finally {
        setLoading(false);
        clearIncomingTx();
      }
    },
    [session, incomingTx, supabase, refreshPending, clearIncomingTx],
  );

  if (!incomingTx) return null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={clearIncomingTx}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.label}>PAYMENT REQUEST</Text>
            <Text style={styles.amount}>{formatCents(incomingTx.amount_cents)}</Text>
            {incomingTx.description ? (
              <Text style={styles.description}>{incomingTx.description}</Text>
            ) : null}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          <Text style={styles.prompt}>
            Approve this payment from your group card?
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.approveBtn, pressed && styles.pressed]}
                onPress={() => void handleDecision(true)}
              >
                <Text style={[styles.btnText, styles.approveBtnText]}>Confirm</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.declineBtn, pressed && styles.pressed]}
                onPress={() => void handleDecision(false)}
              >
                <Text style={[styles.btnText, styles.declineBtnText]}>Decline</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 48,
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  amount: {
    ...typography.title,
    fontSize: 42,
    color: colors.text,
    letterSpacing: -1,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  prompt: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loader: {
    paddingVertical: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: colors.accent,
  },
  declineBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  btnText: {
    ...typography.headline,
    fontSize: 17,
    fontWeight: '700',
  },
  approveBtnText: {
    color: colors.background,
  },
  declineBtnText: {
    color: colors.danger,
  },
});
