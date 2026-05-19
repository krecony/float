import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NfcManager, { Ndef, NfcEvents } from 'react-native-nfc-manager';
import { useSupabase } from '../src/providers/SupabaseProvider';
import { colors, spacing, typography } from '../src/theme';

const GROUPPAY_PREFIX = 'GP|';

type ScanStatus = 'scanning' | 'waiting_confirm' | 'confirmed' | 'error';

interface SplitConfirmed {
  description: string;
  participantIds: string[];
}

export default function ScanScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { amount } = useLocalSearchParams<{ amount: string }>();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('scanning');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasProcessed = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const formattedAmount = amount ? `€${parseFloat(amount).toFixed(2)}` : '';
  const amountCents = Math.round(parseFloat(amount ?? '0') * 100);

  // Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // NFC scan
  useEffect(() => {
    hasProcessed.current = false;

    if (Platform.OS !== 'android') {
      setNfcSupported(false);
      return;
    }

    let active = true;

    async function startNfc() {
      try {
        const supported = await NfcManager.isSupported();
        if (!active) return;
        setNfcSupported(supported);
        if (!supported) return;

        await NfcManager.start();

        NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
          if (hasProcessed.current) return;

          try {
            const messages: any[] = tag?.ndefMessage ?? [];
            if (messages.length === 0) return;
            const decoded = Ndef.text.decodePayload(new Uint8Array(messages[0]?.payload ?? []));
            if (!decoded.startsWith(GROUPPAY_PREFIX)) return;

            const parts = decoded.split('|');
            if (parts.length < 3) return;
            const groupId = parts[1];
            const userId = parts[2];
            if (!groupId || !userId) return;

            hasProcessed.current = true;
            void handleNfcRead(groupId, userId);
          } catch {
            // Unrecognised tag — ignore
          }
        });

        await NfcManager.registerTagEvent();
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'NFC init failed');
      }
    }

    void startNfc();

    return () => {
      active = false;
      NfcManager.unregisterTagEvent().catch(() => {});
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      // Clean up broadcast channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleNfcRead(groupId: string, userId: string) {
    NfcManager.unregisterTagEvent().catch(() => {});

    // Open a broadcast channel specific to this payer
    const channelName = `nfc-session-${groupId}-${userId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on(
        'broadcast',
        { event: 'SPLIT_CONFIRMED' },
        (payload: { payload: SplitConfirmed }) => {
          const { description, participantIds } = payload.payload;
          setScanStatus('confirmed');
          // Small delay to let the UI update, then navigate
          setTimeout(() => {
            router.push({
              pathname: '/charge',
              params: {
                groupId,
                userId,
                amount,
                description,
                participantIds: JSON.stringify(participantIds),
              },
            });
          }, 400);
        },
      )
      .subscribe(() => {
        // Channel ready — broadcast the charge request to the payer
        setScanStatus('waiting_confirm');
        void channel.send({
          type: 'broadcast',
          event: 'CHARGE_REQUEST',
          payload: { amountCents },
        });
      });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <View style={styles.amountDisplay}>
          <Text style={styles.amountLabel}>Charging</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>

        <View style={styles.nfcArea}>
          {scanStatus === 'scanning' && nfcSupported !== false && !error ? (
            <Animated.View
              style={[styles.ring, styles.ringOuter, { transform: [{ scale: pulseAnim }] }]}
            />
          ) : null}
          <View style={styles.ring} />
          <View
            style={[
              styles.iconCircle,
              scanStatus === 'waiting_confirm' && styles.iconCircleWaiting,
              scanStatus === 'confirmed' && styles.iconCircleConfirmed,
            ]}
          >
            <Text style={styles.nfcEmoji}>
              {scanStatus === 'confirmed' ? '✓' : scanStatus === 'waiting_confirm' ? '🔒' : '📡'}
            </Text>
          </View>
        </View>

        {nfcSupported === false ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>NFC not available</Text>
            <Text style={styles.messageSub}>Enable NFC in Android Settings.</Text>
          </View>
        ) : error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>NFC error</Text>
            <Text style={styles.messageSub}>{error}</Text>
          </View>
        ) : scanStatus === 'scanning' ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>Waiting for customer</Text>
            <Text style={styles.messageSub}>
              Ask the customer to open Float, tap{' '}
              <Text style={styles.accentText}>Pay with NFC</Text>, and hold their phone here.
            </Text>
          </View>
        ) : scanStatus === 'waiting_confirm' ? (
          <View style={[styles.messageBox, styles.messageBoxAccent]}>
            <Text style={[styles.messageTitle, styles.accentText]}>Customer connected!</Text>
            <Text style={styles.messageSub}>
              Waiting for them to enter a description and choose who splits the payment…
            </Text>
          </View>
        ) : (
          <View style={[styles.messageBox, styles.messageBoxConfirmed]}>
            <Text style={[styles.messageTitle, styles.accentText]}>Split confirmed!</Text>
            <Text style={styles.messageSub}>Creating the transaction…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
  },
  topRow: { width: '100%' },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.textMuted, fontSize: 15 },

  amountDisplay: { alignItems: 'center', gap: spacing.xs },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: { fontSize: 52, fontWeight: '700', color: colors.accent },

  nfcArea: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: 0.25,
  },
  ringOuter: { width: 200, height: 200, borderRadius: 100, opacity: 0.12 },
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
  iconCircleWaiting: { borderColor: colors.warning },
  iconCircleConfirmed: { borderColor: colors.accent, backgroundColor: 'rgba(61,255,168,0.1)' },
  nfcEmoji: { fontSize: 40 },

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
  messageBoxAccent: { borderColor: colors.accentDim },
  messageBoxConfirmed: { borderColor: colors.accent },
  messageTitle: { ...typography.headline, color: colors.text, textAlign: 'center' },
  messageSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  accentText: { color: colors.accent, fontWeight: '600' },
  errorTitle: { ...typography.headline, color: colors.danger, textAlign: 'center' },
});
