import { formatCents } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { useGroupOverview } from '../../src/hooks/useGroupOverview';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, spacing, typography } from '../../src/theme';

export default function WalletScreen() {
  const router = useRouter();
  const { activeGroupId } = useAuth();
  const { overview, loading } = useGroupOverview(activeGroupId);

  const balance = overview?.group.balance_cents ?? 0;

  return (
    <Screen title="Group wallet" subtitle="Simulated balance for the demo">
      <View style={styles.card}>
        <Text style={styles.label}>Available</Text>
        <Text style={styles.amount}>{loading ? '…' : formatCents(balance)}</Text>
      </View>
      <Text style={styles.info}>
        Spending happens via the merchant terminal. Approve payment requests in the Approvals tab.
      </Text>
      <Button label="View pending approvals" onPress={() => router.push('/(app)/approvals')} />
      <Button label="Deposit (demo)" variant="secondary" disabled onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  label: { color: colors.textMuted },
  amount: { ...typography.title, color: colors.accent, marginTop: spacing.sm },
  info: { color: colors.textMuted, lineHeight: 22 },
});
