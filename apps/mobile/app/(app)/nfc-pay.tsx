import {
  subscribeToGroupTransactions,
  unsubscribe,
  updateTransactionParticipants,
  type Transaction,
} from '@grouppay/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from 'react-native-hce';
import { ParticipantSelectModal } from '../../src/components/ParticipantSelectModal';
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
  const [confirming, setConfirming] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const hceSessionRef = useRef<HCESession | null>(null);
  const statusRef = useRef<Status>('waiting');
  statusRef.current = status;

  // Pulsing ring animation — runs while waiting
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

  // HCE session — starts fresh every time the screen is focused, cleans up on blur.
  // Using useFocusEffect ensures the status and session reset when navigating back
  // and re-opening the screen, fixing the "stuck in read state" bug.
  useFocusEffect(
    useCallback(() => {
      setStatus('waiting');
      setErrorMsg(null);
      setCurrentTransaction(null);
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
          // Reset any stale singleton state before setting the new application.
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

  // After the terminal reads the tag, subscribe to the group's transaction inserts.
  // The first new transaction created is the one the terminal is processing.
  useEffect(() => {
    if (status !== 'read' || !activeGroupId) return;

    const channel = subscribeToGroupTransactions(
      supabase,
      activeGroupId,
      {
        onInsert: (tx) => {
          if (statusRef.current !== 'read') return;
          setCurrentTransaction(tx);
          setStatus('selecting');
        },
      },
      'nfc-pay-watcher',
    );

    return () => {
      unsubscribe(supabase, channel);
    };
  }, [status, activeGroupId, supabase]);

  const handleParticipantsConfirmed = async (participantIds: string[]) => {
    if (!currentTransaction) return;
    setConfirming(true);
    try {
      await updateTransactionParticipants(supabase, currentTransaction.id, participantIds);
      setStatus('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to update participants');
      setStatus('error');
    } finally {
      setConfirming(false);
    }
  };

  const members = overview?.members ?? [];
  const isWaiting = status === 'waiting';

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
          {isWaiting ? (
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
              Keep this screen open and bring the back of your phone close to
              the <Text style={styles.accentText}>GroupPay Terminal</Text> device.
            </Text>
          </View>
        )}

        {(status === 'read' || status === 'selecting') && (
          <View style={[styles.messageBox, styles.messageBoxRead]}>
            <Text style={[styles.mainText, styles.accentText]}>Sent to terminal!</Text>
            <Text style={styles.subText}>
              Waiting for the merchant to confirm the amount. You will be asked
              to choose who splits the payment.
            </Text>
          </View>
        )}

        {status === 'done' && currentTransaction && (
          <View style={[styles.messageBox, styles.messageBoxDone]}>
            <Text style={[styles.mainText, styles.accentText]}>Payment confirmed</Text>
            <Text style={styles.subText}>
              The transaction has been sent for approval to all participants.
            </Text>
            <Pressable style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        )}

        {status === 'unsupported' && (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>NFC not available</Text>
            <Text style={styles.subText}>
              This device does not support NFC Host Card Emulation.
            </Text>
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

      <ParticipantSelectModal
        visible={status === 'selecting'}
        members={members}
        onConfirm={handleParticipantsConfirmed}
        onCancel={() => setStatus('read')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
