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
import { colors, spacing, typography } from '../src/theme';

const GROUPPAY_PREFIX = 'GP|';

export default function ScanScreen() {
  const router = useRouter();
  const { amount, description } = useLocalSearchParams<{
    amount: string;
    description: string;
  }>();

  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasProcessed = useRef(false);

  const formattedAmount = amount ? `€${parseFloat(amount).toFixed(2)}` : '';

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

            const record = messages[0];
            const rawPayload: number[] = record?.payload ?? [];
            const decoded = Ndef.text.decodePayload(new Uint8Array(rawPayload));

            if (!decoded.startsWith(GROUPPAY_PREFIX)) return;

            const parts = decoded.split('|');
            if (parts.length < 3) return;

            const groupId = parts[1];
            const userId = parts[2];
            if (!groupId || !userId) return;

            hasProcessed.current = true;
            router.push({
              pathname: '/charge',
              params: { groupId, userId, amount, description },
            });
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
    };
  }, [amount, description, router]);

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
          {description ? (
            <Text style={styles.descriptionText}>{description}</Text>
          ) : null}
        </View>

        <View style={styles.nfcArea}>
          {nfcSupported !== false && !error ? (
            <Animated.View
              style={[styles.ring, styles.ringOuter, { transform: [{ scale: pulseAnim }] }]}
            />
          ) : null}
          <View style={styles.ring} />
          <View style={styles.iconCircle}>
            <Text style={styles.nfcEmoji}>📡</Text>
          </View>
        </View>

        {nfcSupported === false ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>NFC not available</Text>
            <Text style={styles.messageSub}>
              Enable NFC in Android Settings → Connected devices → NFC.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorTitle}>NFC error</Text>
            <Text style={styles.messageSub}>{error}</Text>
          </View>
        ) : (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>Waiting for customer</Text>
            <Text style={styles.messageSub}>
              Ask the customer to open GroupPay, tap{' '}
              <Text style={styles.accentText}>Pay with NFC</Text>, and hold
              their phone to this device.
            </Text>
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
  amountLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  amountValue: { fontSize: 52, fontWeight: '700', color: colors.accent },
  descriptionText: { ...typography.body, color: colors.textMuted },

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
  ringOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.12,
  },
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
  messageTitle: { ...typography.headline, color: colors.text, textAlign: 'center' },
  messageSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  accentText: { color: colors.accent, fontWeight: '600' },
  errorTitle: { ...typography.headline, color: colors.danger, textAlign: 'center' },
});
