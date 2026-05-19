/**
 * NFC Pay — payer side
 *
 * Flow:
 * 1. HCE starts broadcasting GP|groupId|userId
 * 2. Broadcast channel subscribed for this user
 * 3. Terminal reads NFC → sends CHARGE_REQUEST (amountCents)
 * 4. We receive CHARGE_REQUEST → show description + participant selection
 * 5. User confirms → send SPLIT_CONFIRMED (description, participantIds)
 * 6. Terminal creates the transaction → participants see approval prompts
 */
import {
  formatCents,
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

type Status = 'waiting' | 'read' | 'selecting' | 'confirming' | 'done' | 'error' | 'unsupported';

export default function NfcPayScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { activeGroupId, session } = useAuth();
  const { overview } = useGroupData();

  const [status, setStatus] = useState<Status>('waiting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const statusRef = useRef<Status>('waiting');
  statusRef.current = status;
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const members = overview?.members ?? [];

  // Pulse animation — only while waiting
  useEffect(() => {
    if (status !== 'waiting') {
      pulseLoop.current?.stop();
      return;
    }
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.22, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
    return () => pulseLoop.current?.stop();
  }, [status, pulseAnim]);

  // Full reset on every screen focus
  useFocusEffect(
    useCallback(() => {
      setStatus('waiting');
      setErrorMsg(null);
      setAmountCents(0);
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

      const userId = session.user.id;
      let active = true;
      let removeReadListener: (() => void) | undefined;

      // Subscribe to broadcast channel BEFORE starting HCE,
      // so we're ready to receive CHARGE_REQUEST the instant the terminal reads the tag.
      const channelName = `nfc-session-${activeGroupId}-${userId}`;
      const broadcastChannel = supabase.channel(channelName);
      broadcastChannelRef.current = broadcastChannel;

      broadcastChannel
        .on('broadcast', { event: 'CHARGE_REQUEST' }, (payload: { payload: { amountCents: number } }) => {
          if (!active || statusRef.current !== 'read') return;
          setAmountCents(payload.payload.amountCents);
          // Default all members as selected
          setSelectedIds(new Set(members.map((m) => m.user_id)));
          setStatus('selecting');
        })
        .subscribe();

      async function startHce() {
        try {
          const payload = `GP|${activeGroupId}|${userId}`;
          const tag = new NFCTagType4({
            type: NFCTagType4NDEFContentType.Text,
            content: payload,
            writable: false,
          });
          const hce = await HCESession.getInstance();
          await hce.setEnabled(false);
          hce.setApplication(tag);
          await hce.setEnabled(true);

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
        HCESession.getInstance()
          .then((hce) => hce.setEnabled(false))
          .catch(() => {});
        supabase.removeChannel(broadcastChannel);
        broadcastChannelRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeGroupId, session?.user.id])
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!broadcastChannelRef.current || selectedIds.size === 0) return;
    setConfirming(true);
    try {
      await broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'SPLIT_CONFIRMED',
        payload: {
          description: description.trim() || 'Purchase',
          participantIds: Array.from(selectedIds),
        },
      });
      setStatus('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to send confirmation');
    } finally {
      setConfirming(false);
    }
  };

  // ── Participant selection / description form ────────────────────────────
  if (status === 'selecting') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Confirm payment</Text>
              <Text style={styles.formAmount}>{formatCents(amountCents)}</Text>
              <Text style={styles.formSub}>Choose who splits this payment and add a label.</Text>
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
                  Confirm · {formatCents(amountCents)}
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
            <Animated.View style={[styles.ring, styles.ringPulse, { transform: [{ scale: pulseAnim }] }]} />
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
            <Text style={[styles.mainText, styles.accentText]}>Connected to terminal!</Text>
            <Text style={styles.subText}>
              Waiting for the merchant to confirm the amount…
            </Text>
          </View>
        )}

        {status === 'done' && (
          <View style={[styles.messageBox, styles.messageBoxDone]}>
            <Text style={[styles.mainText, styles.accentText]}>Sent!</Text>
            <Text style={styles.subText}>
              {formatCents(amountCents)} · The selected members will receive an approval request.
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

  // Form
  formScroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  formHeader: { gap: spacing.xs, marginBottom: spacing.sm },
  formTitle: { ...typography.title, color: colors.text },
  formAmount: { fontSize: 32, fontWeight: '700', color: colors.accent },
  formSub: { ...typography.body, color: colors.textMuted, lineHeight: 20 },
  field: { gap: spacing.sm },
  fieldLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
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
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
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

  // NFC screens
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
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 2, borderColor: colors.accent, opacity: 0.2,
  },
  ringPulse: { width: 220, height: 220, borderRadius: 110, opacity: 0.1 },
  ringInner: { width: 130, height: 130, borderRadius: 65, opacity: 0.3 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleRead: { borderColor: colors.warning },
  iconCircleDone: { backgroundColor: 'rgba(61,255,168,0.12)', borderColor: colors.accent },
  nfcEmoji: { fontSize: 42 },
  messageBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, gap: spacing.sm, alignItems: 'center',
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
