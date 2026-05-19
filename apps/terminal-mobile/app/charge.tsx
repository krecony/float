import { createTransactionRequest, listMembers, type GroupMemberWithUser } from '@grouppay/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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

  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [membersLoading, setMembersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount = amount ? `€${parseFloat(amount).toFixed(2)}` : '';

  useEffect(() => {
    if (!groupId) return;
    setMembersLoading(true);
    listMembers(supabase, groupId)
      .then((m) => {
        setMembers(m);
        setSelectedIds(new Set(m.map((mem) => mem.user_id)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load members'))
      .finally(() => setMembersLoading(false));
  }, [groupId, supabase]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCharge = async () => {
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError('Invalid amount');
      return;
    }
    if (selectedIds.size === 0) {
      setError('Select at least one participant');
      return;
    }

    setSubmitting(true);
    try {
      await createTransactionRequest(supabase, {
        groupId,
        amountCents: cents,
        description: description || 'Purchase',
        createdBy: userId,
        participantUserIds: Array.from(selectedIds),
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Confirm charge</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.nfcBadge}>
            <Text style={styles.nfcBadgeText}>📡 Customer connected via NFC</Text>
          </View>
          <Text style={styles.summaryAmount}>{formattedAmount}</Text>
          {description ? (
            <Text style={styles.summaryDesc}>{description}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Split between ({selectedIds.size}/{members.length})
          </Text>
          {membersLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.sm }} />
          ) : (
            members.map((m) => {
              const name = m.users?.display_name ?? m.user_id.slice(0, 8);
              const checked = selectedIds.has(m.user_id);
              return (
                <Pressable
                  key={m.user_id}
                  style={[styles.memberRow, checked && styles.memberRowActive]}
                  onPress={() => toggleMember(m.user_id)}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={styles.memberName}>{name}</Text>
                  {m.user_id === userId ? (
                    <View style={styles.payerPill}>
                      <Text style={styles.payerPillText}>payer</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: { gap: spacing.xs },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.textMuted, fontSize: 15 },
  title: { ...typography.title, color: colors.text },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  nfcBadge: {
    backgroundColor: 'rgba(61,255,168,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(61,255,168,0.3)',
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  nfcBadgeText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  summaryAmount: { fontSize: 40, fontWeight: '700', color: colors.text },
  summaryDesc: { ...typography.body, color: colors.textMuted },

  field: { gap: spacing.sm },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberRowActive: { borderColor: colors.accentDim },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.background, fontSize: 13, fontWeight: '700' },
  memberName: { flex: 1, color: colors.text, fontSize: 15 },
  payerPill: {
    backgroundColor: 'rgba(61,255,168,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  payerPillText: { color: colors.accent, fontSize: 11, fontWeight: '600' },

  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },

  chargeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: spacing.sm,
  },
  chargeBtnDisabled: { opacity: 0.5 },
  chargeBtnText: { color: colors.background, fontSize: 18, fontWeight: '700' },
});
