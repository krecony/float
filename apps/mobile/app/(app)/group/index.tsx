import { formatCents } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { GroupSwitcher } from '../../../src/components/GroupSwitcher';
import { Screen } from '../../../src/components/Screen';
import { useGroupOverview } from '../../../src/hooks/useGroupOverview';
import { useAuth } from '../../../src/providers/AuthProvider';
import { colors, spacing, typography } from '../../../src/theme';

export default function GroupOverviewScreen() {
  const router = useRouter();
  const { activeGroupId } = useAuth();
  const { overview, loading, error } = useGroupOverview(activeGroupId);
  const [showPan, setShowPan] = useState(false);

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

  const { group, transactions } = overview;
  const virtualCard = overview.virtual_card;

  const cardPan = virtualCard ? formatPan(virtualCard.pan) : '';
  const cardMasked = virtualCard ? maskPan(virtualCard.pan) : '';
  const cardExpiry = virtualCard
    ? formatExpiry(virtualCard.exp_month, virtualCard.exp_year)
    : '';

  return (
    <Screen
      headerRight={<GroupSwitcher />}
      title={group.name}
      subtitle={`Invite: ${group.invite_code}`}
    >
      <View style={styles.cardPanel}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Group virtual card</Text>
          {virtualCard ? (
            <View
              style={[
                styles.statusPill,
                virtualCard.status === 'paused' ? styles.statusPaused : styles.statusActive,
              ]}
            >
              <Text style={styles.statusText}>
                {virtualCard.status === 'paused' ? 'Paused' : 'Active'}
              </Text>
            </View>
          ) : null}
        </View>
        {virtualCard ? (
          <>
            <Text style={styles.cardPan}>{showPan ? cardPan : cardMasked}</Text>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardMeta}>Exp {cardExpiry}</Text>
              <Pressable onPress={() => setShowPan((prev) => !prev)}>
                <Text style={styles.cardToggle}>
                  {showPan ? 'Hide card number' : 'Show card number'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.cardMeta}>Provisioning virtual card...</Text>
        )}
      </View>

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

    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  cardPanel: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: colors.textMuted, fontSize: 14 },
  cardPan: { ...typography.title, color: colors.text, marginTop: spacing.xs },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta: { color: colors.textMuted, fontSize: 13 },
  cardToggle: { color: colors.accent, fontSize: 13 },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusActive: { backgroundColor: 'rgba(61, 255, 168, 0.16)' },
  statusPaused: { backgroundColor: 'rgba(255, 180, 71, 0.2)' },
  statusText: { color: colors.text, fontSize: 12, fontWeight: '600' },
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

function formatPan(pan: string) {
  return pan.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function maskPan(pan: string) {
  const last4 = pan.slice(-4);
  return `**** **** **** ${last4}`;
}

function formatExpiry(month: number, year: number) {
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
}
