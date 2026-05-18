import { formatCents } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { useGroupOverview } from '../../../src/hooks/useGroupOverview';
import { useAuth } from '../../../src/providers/AuthProvider';
import { colors, spacing, typography } from '../../../src/theme';

export default function GroupOverviewScreen() {
  const router = useRouter();
  const { activeGroupId } = useAuth();
  const { overview, loading, error } = useGroupOverview(activeGroupId);

  if (!activeGroupId) {
    return (
      <Screen title="No group yet">
        <Button label="Create group" onPress={() => router.push('/(app)/group/create')} />
        <Button label="Join group" variant="secondary" onPress={() => router.push('/(app)/group/join')} />
      </Screen>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !overview) {
    return (
      <Screen title="Group">
        <Text style={styles.error}>{error ?? 'Group not found'}</Text>
        <Button label="Join another group" onPress={() => router.push('/(app)/group/join')} />
      </Screen>
    );
  }

  const { group, members, transactions } = overview;

  return (
    <Screen title={group.name} subtitle={`Invite: ${group.invite_code}`}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Shared balance</Text>
        <Text style={styles.balance}>{formatCents(group.balance_cents)}</Text>
      </View>

      <Text style={styles.section}>Members ({members.length})</Text>
      {members.map((m) => (
        <View key={m.user_id} style={styles.row}>
          <Text style={styles.rowTitle}>{m.users?.display_name ?? m.users?.legal_name ?? 'Member'}</Text>
          <Text style={styles.rowMeta}>{m.role}</Text>
        </View>
      ))}

      <Text style={styles.section}>Transactions ({transactions.length})</Text>
      {transactions.length === 0 ? (
        <Text style={styles.empty}>No transactions yet</Text>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.row}>
            <Text style={styles.rowTitle}>{tx.description ?? 'Payment'}</Text>
            <Text style={styles.rowMeta}>
              {formatCents(tx.amount_cents)} · {tx.status}
            </Text>
          </View>
        ))
      )}

      <Button label="Create group" variant="secondary" onPress={() => router.push('/(app)/group/create')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  balanceCard: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: { color: colors.textMuted, fontSize: 14 },
  balance: { ...typography.title, color: colors.accent, marginTop: spacing.xs },
  section: { ...typography.headline, color: colors.text, marginTop: spacing.md },
  row: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  empty: { color: colors.textMuted },
  error: { color: colors.danger },
});
