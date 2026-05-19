import { Ionicons } from '@expo/vector-icons';
import { createTransactionRequest, getGroup, listMembers } from '@grouppay/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PulseRing } from '../src/components/PulseRing';
import { useNfc } from '../src/hooks/useNfc';
import { useSound } from '../src/hooks/useSound';
import { useSupabase } from '../src/providers/SupabaseProvider';
import { COLORS } from '../src/theme';

type ScreenState = 'ready' | 'detected' | 'creating' | 'error';

export default function WaitingScreen() {
  const { amountCents: amountCentsParam, groupId } = useLocalSearchParams<{
    amountCents: string;
    groupId: string;
  }>();

  const amountCents = parseInt(amountCentsParam ?? '0', 10);
  const client = useSupabase();
  const { startScan, cancelScan } = useNfc();
  const { playTapSound } = useSound();
  const [screenState, setScreenState] = useState<ScreenState>('ready');
  const [errorMsg, setErrorMsg] = useState('');
  const activeRef = useRef(true);

  const handleNfcTap = useCallback(
    async (payerId: string) => {
      if (!activeRef.current) return;
      setScreenState('detected');

      try {
        await playTapSound();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        // Non-critical
      }

      setScreenState('creating');

      try {
        const [members, group] = await Promise.all([
          listMembers(client, groupId),
          getGroup(client, groupId),
        ]);

        if (!activeRef.current) return;

        const threshold = group?.approval_threshold ?? 1;
        const participantIds = members.map((m) => m.user_id);

        // Prefer the payerId from NFC; fall back to first group member
        const createdBy = payerId || participantIds[0] || '';
        if (!createdBy) throw new Error('No valid user ID — group may be empty');

        const tx = await createTransactionRequest(client, {
          groupId,
          amountCents,
          description: `Terminal payment — €${(amountCents / 100).toFixed(2)}`,
          createdBy,
          participantUserIds: participantIds,
        });

        if (!activeRef.current) return;

        router.replace({
          pathname: '/processing',
          params: {
            transactionId: tx.id,
            amountCents: String(amountCents),
            groupId,
            threshold: String(threshold),
          },
        });
      } catch (e) {
        if (!activeRef.current) return;
        setScreenState('error');
        setErrorMsg(e instanceof Error ? e.message : 'Failed to create transaction');
      }
    },
    [amountCents, client, groupId, playTapSound],
  );

  const runScan = useCallback(async () => {
    const payload = await startScan();
    if (payload && activeRef.current) {
      void handleNfcTap(payload.payerId);
    }
  }, [handleNfcTap, startScan]);

  // Start NFC scan on mount
  useEffect(() => {
    activeRef.current = true;
    void runScan();

    return () => {
      activeRef.current = false;
      void cancelScan();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = useCallback(async () => {
    activeRef.current = false;
    await cancelScan();
    router.back();
  }, [cancelScan]);

  const handleRetry = useCallback(() => {
    setScreenState('ready');
    setErrorMsg('');
    activeRef.current = true;
    void runScan();
  }, [runScan]);

  const isDetecting = screenState === 'ready';
  const isProcessing = screenState === 'creating' || screenState === 'detected';

  const statusText =
    screenState === 'detected'
      ? 'NFC Detected'
      : screenState === 'creating'
        ? 'Creating payment...'
        : screenState === 'error'
          ? 'Something went wrong'
          : 'Tap phone to pay';

  const statusSubText =
    screenState === 'ready' ? 'Hold the payer phone near this device' : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
            <Ionicons name="chevron-back" size={22} color={COLORS.subtext} />
          </TouchableOpacity>
          <View style={styles.amountBadge}>
            <Text style={styles.amountBadgeText}>
              €{(amountCents / 100).toFixed(2)}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Center animation */}
        <View style={styles.center}>
          {isDetecting ? (
            <View style={styles.pulseContainer}>
              <PulseRing size={220} count={3} duration={2400} />
              <View style={styles.nfcIconCircle}>
                <Ionicons name="wifi-outline" size={48} color={COLORS.primaryLight} />
              </View>
            </View>
          ) : isProcessing ? (
            <View style={styles.pulseContainer}>
              <PulseRing size={220} color={COLORS.success} count={2} duration={1200} />
              <View style={[styles.nfcIconCircle, styles.nfcIconCircleSuccess]}>
                <Ionicons name="checkmark" size={48} color={COLORS.success} />
              </View>
            </View>
          ) : (
            <View style={[styles.nfcIconCircle, styles.nfcIconCircleError]}>
              <Ionicons name="close" size={48} color={COLORS.error} />
            </View>
          )}

          <Text style={styles.statusText}>{statusText}</Text>
          {statusSubText ? (
            <Text style={styles.statusSub}>{statusSubText}</Text>
          ) : null}

          {screenState === 'error' ? (
            <>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>Try again</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Bottom hint */}
        {isDetecting ? (
          <View style={styles.bottomHint}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.muted} />
            <Text style={styles.bottomHintText}>
              Secure NFC payment via GroupPay
            </Text>
          </View>
        ) : null}

        {/* Cancel button */}
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountBadgeText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  pulseContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  nfcIconCircleSuccess: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success + '40',
  },
  nfcIconCircleError: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 15,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryBtnText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bottomHintText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.subtext,
    fontWeight: '500',
  },
});
