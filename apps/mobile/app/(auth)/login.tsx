import { APP_NAME } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, typography } from '../../src/theme';

export default function LoginScreen() {
  const { signInAnonymously } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <Text style={styles.logo}>{APP_NAME}</Text>
        <Text style={styles.tagline}>Shared travel wallets. Group approvals. Demo only.</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={loading ? 'Signing in…' : 'Continue'} onPress={handleContinue} disabled={loading} />
      <Text style={styles.disclaimer}>Simulated money — not a real bank.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  logo: { ...typography.title, fontSize: 36, color: colors.accent },
  tagline: { ...typography.body, color: colors.textMuted },
  error: { color: colors.danger },
  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
