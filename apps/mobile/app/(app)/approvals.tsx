import { approveTransaction, formatCents } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { usePendingApprovals } from '../../src/hooks/usePendingApprovals';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSupabase } from '../../src/providers/SupabaseProvider';
import { colors, spacing } from '../../src/theme';

export default function ApprovalsScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, activeGroupId } = useAuth();
  const { pending, loading, refresh } = usePendingApprovals(activeGroupId);

  const handleApprove = async (txId: string, approved: boolean) => {
    if (!session?.user.id) return;
    try {
      await approveTransaction(supabase, txId, session.user.id, approved);
      await refresh();
    } catch (e) {
      console.error('Approval failed', e);
    }
  };

  if (!activeGroupId) {
    return (
      <Screen title="Approvals" subtitle="Payment requests for your group">
        <Text style={styles.muted}>Join or create a group to see approval requests.</Text>
        <Button label="Join group" onPress={() => router.push('/(app)/group/join')} />
        <Button
          label="Create group"
          variant="secondary"
          onPress={() => router.push('/(app)/group/create')}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Approvals" subtitle="Realtime payment requests from the terminal">
      {loading ? <Text style={styles.muted}>Loading…</Text> : null}
      {!loading && pending.length === 0 ? (
        <Text style={styles.muted}>No pending approvals</Text>
      ) : null}
      {pending.map((tx) => (
        <View key={tx.id} style={styles.card}>
          <Text style={styles.title}>{tx.description ?? 'Payment request'}</Text>
          <Text style={styles.amount}>{formatCents(tx.amount_cents)}</Text>
          <View style={styles.actions}>
            <Button label="Approve" onPress={() => handleApprove(tx.id, true)} />
            <Button label="Decline" variant="secondary" onPress={() => handleApprove(tx.id, false)} />
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  amount: { color: colors.accent, fontSize: 20, fontWeight: '700' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
