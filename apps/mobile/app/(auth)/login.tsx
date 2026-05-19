import { APP_NAME, validateLoginNameInput } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, typography } from '../../src/theme';

export default function LoginScreen() {
  const { signInWithLoginName, signUpWithLoginName } = useAuth();
  const router = useRouter();
  const [loginName, setLoginName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAuth = async (mode: 'login' | 'signup') => {
    const validationError = validateLoginNameInput(loginName);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithLoginName(loginName);
      } else {
        await signUpWithLoginName(loginName);
      }
      router.replace('/');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Authentication failed');
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
      <Input
        placeholder="Your name (login)"
        value={loginName}
        onChangeText={setLoginName}
        autoCapitalize="words"
        autoCorrect={false}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Button
        label={loading ? 'Please wait…' : 'Log in'}
        onPress={() => handleAuth('login')}
        disabled={loading || !loginName.trim()}
      />
      <Button
        label="Create account"
        variant="secondary"
        onPress={() => handleAuth('signup')}
        disabled={loading || !loginName.trim()}
      />
      <Text style={styles.disclaimer}>
        Demo login — no password. Use the same name to return to your data.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  logo: { ...typography.title, fontSize: 36, color: colors.accent },
  tagline: { ...typography.body, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
