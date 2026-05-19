import { formatCents } from '@grouppay/shared';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { GroupSwitcher } from '../../../src/components/GroupSwitcher';
import { NewTransactionBanner } from '../../../src/components/NewTransactionBanner';
import { ParticipantSelectModal } from '../../../src/components/ParticipantSelectModal';
import { Screen } from '../../../src/components/Screen';
import { useGroupOverview } from '../../../src/hooks/useGroupOverview';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useSupabase } from '../../../src/providers/SupabaseProvider';
import { colors, spacing, typography } from '../../../src/theme';
import { createDemoTransaction } from '../../../src/utils/createDemoTransaction';

export default function GroupOverviewScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { activeGroupId, session } = useAuth();
  const { overview, loading, error } = useGroupOverview(activeGroupId);
  const [showPan, setShowPan] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

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
  const virtualCard = overview.virtual_card;

  const cardPan = virtualCard ? formatPan(virtualCard.pan) : '';
  const cardMasked = virtualCard ? maskPan(virtualCard.pan) : '';
  const cardExpiry = virtualCard
    ? formatExpiry(virtualCard.exp_month, virtualCard.exp_year)
    : '';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParticipantsConfirmed = async (participantIds: string[]) => {
    if (!session?.user.id) return;
    setShowParticipantModal(false);
    setTxLoading(true);
    try {
      await createDemoTransaction(supabase, group.id, session.user.id, participantIds);
    } catch (e) {
      console.error('Demo transaction failed', e);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <>
      <NewTransactionBanner />

      <Screen
        headerRight={<GroupSwitcher />}
        title={group.name}
      >
        <Pressable style={styles.inviteRow} onPress={handleCopy}>
          <Text style={styles.inviteLabel}>Invite code</Text>
          <Text style={styles.inviteCode}>{group.invite_code}</Text>
          <Ionicons
            name={copied ? 'checkmark-outline' : 'copy-outline'}
            size={18}
            color={copied ? colors.accent : colors.textMuted}
          />
        </Pressable>

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
              <Text style={styles.cardPan} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{showPan ? cardPan : cardMasked}</Text>
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
                {formatCents(tx.amount_cents)}
              </Text>
            </View>
          ))
        )}

        <Pressable
          style={styles.nfcBtn}
          onPress={() => router.push('/(app)/nfc-pay')}
        >
          <Ionicons name="wifi-outline" size={20} color={colors.background} />
          <Text style={styles.nfcBtnText}>Pay with NFC</Text>
        </Pressable>

        {/* TODO: remove test button before production */}
        <Pressable
          style={[styles.testBtn, txLoading && styles.testBtnDisabled]}
          onPress={() => setShowParticipantModal(true)}
          disabled={txLoading}
        >
          <Ionicons name="card-outline" size={18} color={colors.background} />
          <Text style={styles.testBtnText}>
            {txLoading ? 'Processing…' : 'Simulate €10 purchase'}
          </Text>
        </Pressable>
        {/* end test button */}
      </Screen>

      <ParticipantSelectModal
        visible={showParticipantModal}
        members={members}
        onConfirm={handleParticipantsConfirmed}
        onCancel={() => setShowParticipantModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteLabel: { color: colors.textMuted, fontSize: 13, marginRight: spacing.xs },
  inviteCode: { flex: 1, color: colors.accent, fontWeight: '700', fontSize: 16, letterSpacing: 2 },
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
  cardPan: { fontSize: 18, fontWeight: '700' as const, color: colors.text, marginTop: spacing.xs, letterSpacing: 1 },
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
  nfcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  nfcBtnText: { color: colors.background, fontWeight: '700', fontSize: 15 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testBtnDisabled: { opacity: 0.5 },
  testBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
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
