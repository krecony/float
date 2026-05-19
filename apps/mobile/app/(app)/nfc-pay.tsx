import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from 'react-native-hce';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, spacing, typography } from '../../src/theme';

type Status = 'waiting' | 'read' | 'error' | 'unsupported';

export default function NfcPayScreen() {
  const router = useRouter();
  const { activeGroupId, session } = useAuth();
  const [status, setStatus] = useState<Status>('waiting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const sessionRef = useRef<HCESession | null>(null);

  // Pulsing ring animation
  useEffect(() => {
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
  }, [pulseAnim]);

  useEffect(() => {
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

    async function startHce() {
      try {
        const payload = `GP|${activeGroupId}|${session!.user.id}`;

        const tag = new NFCTagType4({
          type: NFCTagType4NDEFContentType.Text,
          content: payload,
          writable: false,
        });

        const hceSession = await HCESession.getInstance();
        // Reset any stale singleton state from a previous session before
        // setting the new application — without this, revisiting the screen
        // causes "no application set" because the service is still running.
        await hceSession.setEnabled(false);
        hceSession.setApplication(tag);
        await hceSession.setEnabled(true);
        sessionRef.current = hceSession;

        const removeListener = hceSession.on(HCESession.Events.HCE_STATE_READ, () => {
          if (!active) return;
          setStatus('read');
          pulseLoop.current?.stop();
          // Stop HCE after a successful read so we don't broadcast indefinitely
          hceSession.setEnabled(false).catch(() => {});
        });

        return () => {
          removeListener();
        };
      } catch (e) {
        if (!active) return;
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : 'Failed to start NFC');
      }
    }

    let cleanupListeners: (() => void) | undefined;

    startHce().then((cleanup) => {
      cleanupListeners = cleanup;
    });

    return () => {
      active = false;
      cleanupListeners?.();
      sessionRef.current?.setEnabled(false).catch(() => {});
    };
  }, [activeGroupId, session]);

  const isRead = status === 'read';

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
          <View style={[styles.iconCircle, isRead && styles.iconCircleSuccess]}>
            <Text style={styles.nfcEmoji}>{isRead ? '✓' : '📲'}</Text>
          </View>
        </View>

        {status === 'waiting' && (
          <View style={styles.messageBox}>
            <Text style={styles.mainText}>Hold phone to terminal</Text>
            <Text style={styles.subText}>
              Keep this screen open and bring the back of your phone close to
              the{' '}
              <Text style={styles.accentText}>GroupPay Terminal</Text> device.
            </Text>
          </View>
        )}

        {status === 'read' && (
          <View style={[styles.messageBox, styles.messageBoxSuccess]}>
            <Text style={[styles.mainText, styles.successText]}>Sent to terminal!</Text>
            <Text style={styles.subText}>
              The terminal will now enter the amount. You will receive an
              approval request shortly.
            </Text>
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
          <Text style={styles.hintText}>
            NFC must be enabled in Android Settings. HCE is Android-only.
          </Text>
        </View>
      </View>
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

  nfcArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: 0.2,
  },
  ringPulse: {
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.1,
  },
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
  iconCircleSuccess: {
    backgroundColor: 'rgba(61,255,168,0.12)',
    borderColor: colors.accent,
  },
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
  messageBoxSuccess: { borderColor: colors.accentDim },
  mainText: { ...typography.headline, color: colors.text, textAlign: 'center' },
  successText: { color: colors.accent },
  subText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  accentText: { color: colors.accent, fontWeight: '600' },
  errorTitle: { ...typography.headline, color: colors.danger, textAlign: 'center' },

  hint: { marginTop: 'auto', paddingBottom: spacing.lg },
  hintText: { ...typography.caption, color: colors.border, textAlign: 'center' },
});
