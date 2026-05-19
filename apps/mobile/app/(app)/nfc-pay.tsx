import {
  formatCents,
  subscribeToGroupTransactions,
  unsubscribe,
  updateTransactionDescription,
  updateTransactionParticipants,
  type Transaction,
} from '@grouppay/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from 'react-native-hce';
import { useAuth } from '../../src/providers/AuthProvider';
import { useGroupData } from '../../src/providers/GroupDataProvider';
import { useSupabase } from '../../src/providers/SupabaseProvider';
import { colors, spacing, typography } from '../../src/theme';

type Status = 'waiting' | 'read' | 'selecting' | 'done' | 'error' | 'unsupported';

export default function NfcPayScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { activeGroupId, session } = useAuth();
  const { overview } = useGroupData();

  const [status, setStatus] = useState<Status>('waiting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const hceSessionRef = useRef<HCESession | null>(null);
  const statusRef = useRef<Status>('waiting');
  statusRef.current = status;

  const members = overview?.members ?? [];

  // Pulse animation — only while waiting
  useEffect(() => {
    if (status !== 'waiting') {
      pulseLoop.current?.stop();
      return;
    }
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.22,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.current.start();
    return () => pulseLoop.current?.stop();
  }, [status, pulseAnim]);

  // HCE session — fully reset on every screen focus, cleaned up on blur
  useFocusEffect(
    useCallback(() => {
      setStatus('waiting');
      setErrorMsg(null);
      setCurrentTransaction(null);
      setDescription('');
      pulseAnim.setValue(1);

      if (Platform.OS !== 'android') {
        setStatus('unsupported');
        return;
      }
      if (!activeGroupId || !session?.user.id) {
        setStatus('error');
        setErrorMsg('No active group or session. Go back and try again.');
        return;
      }

      let active = true;
      let removeReadListener: (() => void) | undefined;

      async function startHce() {
        try {
          const payload = `GP|${activeGroupId}|${session!.user.id}`;
          const tag = new NFCTagType4({
            type: NFCTagType4NDEFContentType.Text,
            content: payload,
            writable: false,
          });
          const hce = await HCESession.getInstance();
          await hce.setEnabled(false);
          hce.setApplication(tag);
          await hce.setEnabled(true);
          hceSessionRef.current = hce;

          removeReadListener = hce.on(HCESession.Events.HCE_STATE_READ, () => {
            if (!active || statusRef.current !== 'waiting') return;
            setStatus('read');
            hce.setEnabled(false).catch(() => {});
          });
        } catch (e) {
          if (!active) return;
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'Failed to start NFC');
        }
      }

      void startHce();

      return () => {
        active = false;
        removeReadListener?.();
        hceSessionRef.current?.setEnabled(false).catch(() => {});
      };
    }, [activeGroupId, session, pulseAnim])
  );

  // After tap: wait for the terminal to create the transaction, then show
  // the description input + participant selection form
  useEffect(() => {
    if (status !== 'read' || !activeGroupId) return;

    const channel = subscribeToGroupTransactions(
      supabase,
      activeGroupId,
      {
        onInsert: (tx) => {
          if (statusRef.current !== 'read') return;
          setCurrentTransaction(tx);
          setSelectedIds(new Set(members.map((m) => m.user_id)));
          setStatus('selecting');
        },
      },
      'nfc-pay-watcher',
    );

    return () => {
      unsubscribe(supabase, channel);
    };
  // members is intentionally excluded — we snapshot it when the modal opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeGroupId, supabase]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!currentTransaction) return;
    setConfirming(true);
    try {
      await Promise.all([
        updateTransactionDescription(supabase, currentTransaction.id, description.trim() || 'Purchase'),
        updateTransactionParticipants(supabase, currentTransaction.id, Array.from(selectedIds)),
      ]);
      setStatus('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to confirm payment');
      setStatus('error');
    } finally {
      setConfirming(false);
    }
  };

  // ── Participant selection / description form ────────────────────────────
  if (status === 'selecting' && currentTransaction) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formHeader}>
              <Pressable onPress={() => setStatus('read')} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
              <Text style={styles.formTitle}>Confirm payment</Text>
              <Text style={styles.formAmount}>
                {formatCents(currentTransaction.amount_cents)}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>What was this for?</Text>
              <TextInput
                style={styles.descInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Coffee, dinner, hotel..."
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Who splits it? ({selectedIds.size}/{members.length})
              </Text>
              {members.map((m) => {
                const name = m.users?.display_name ?? m.users?.legal_name ?? 'Member';
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
                  </Pressable>
                );
              })}
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <Pressable
              style={[styles.confirmBtn, (confirming || selectedIds.size === 0) && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={confirming || selectedIds.size === 0}
            >
              {confirming ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.confirmBtnText}>
                  Confirm · {formatCents(currentTransaction.amount_cents)}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── NFC status screens ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Pay with NFC</Text>
        </View>

        <View style={styles.nfcArea}>
          {status === 'waiting' ? (
            <Animated.View
              style={[styles.ring, styles.ringPulse, { transform: [{ scale: pulseAnim }] }]}
            />
          ) : null}
          <View style={[styles.ring, styles.ringInner]} />
          <View
            style={[
              styles.iconCircle,
              status === 'read' && styles.iconCircleRead,
              status === 'done' && styles.iconCircleDone,
            ]}
          >
            <Text style={styles.nfcEmoji}>
              {status === 'done' ? '✓' : status === 'read' ? '⏳' : '📲'}
            </Text>
          </View>
        </View>

        {status === 'waiting' && (
          <View style={styles.messageBox}>
            <Text style={styles.mainText}>Hold phone to terminal</Text>
            <Text style={styles.subText}>
              Keep this screen open and bring the back of your phone to the{' '}
              <Text style={styles.accentText}>GroupPay Terminal</Text>.
            </Text>
          </View>
        )}

        {status === 'read' && (
          <View style={[styles.messageBox, styles.messageBoxRead]}>
            <Text style={[styles.mainText, styles.accentText]}>Sent to terminal!</Text>
            <Text style={styles.subText}>
              Waiting for the merchant to confirm the amount…
            </Text>
          </View>
        )}

        {status === 'done' && currentTransaction && (
          <View style={[styles.messageBox, styles.messageBoxDone]}>
            <Text style={[styles.mainText, styles.accentText]}>Payment sent!</Text>
            <Text style={styles.subText}>
              {formatCents(currentTransaction.amount_cents)} · group members have been notified.
            </Text>
            <Pressable style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        )}

        {status === 'unsupported' && (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>NFC not available</Text>
            <Text style={styles.subText}>This device does not support NFC Host Card Emulation.</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.subText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.hint}>
          <Text style={styles.hintText}>NFC must be enabled in Android Settings. Android only.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // ── Participant/description form ──
  formScroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  formHeader: { gap: spacing.xs, marginBottom: spacing.sm },
  formTitle: { ...typography.title, color: colors.text },
  formAmount: { fontSize: 32, fontWeight: '700', color: colors.accent },
  field: { gap: spacing.sm },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  descInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
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
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: colors.background, fontSize: 17, fontWeight: '700' },

  // ── NFC animation screens ──
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xl,
  },
  header: { width: '100%', gap: spacing.xs },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.textMuted, fontSize: 15 },
  title: { ...typography.title, color: colors.text },
  nfcArea: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: 0.2,
  },
  ringPulse: { width: 220, height: 220, borderRadius: 110, opacity: 0.1 },
  ringInner: { width: 130, height: 130, borderRadius: 65, opacity: 0.3 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRead: { borderColor: colors.warning },
  iconCircleDone: { backgroundColor: 'rgba(61,255,168,0.12)', borderColor: colors.accent },
  nfcEmoji: { fontSize: 42 },
  messageBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  messageBoxRead: { borderColor: colors.accentDim },
  messageBoxDone: { borderColor: colors.accent },
  mainText: { ...typography.headline, color: colors.text, textAlign: 'center' },
  subText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  accentText: { color: colors.accent },
  errorTitle: { ...typography.headline, color: colors.danger, textAlign: 'center' },
  doneBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  doneBtnText: { color: colors.background, fontWeight: '700', fontSize: 15 },
  hint: { marginTop: 'auto', paddingBottom: spacing.lg },
  hintText: { ...typography.caption, color: colors.border, textAlign: 'center' },
});
