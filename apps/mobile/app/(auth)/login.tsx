import { APP_NAME, validateLoginNameInput } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, spacing, typography } from '../../src/theme';

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={16}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.hero}>
            <Text style={styles.logo}>{APP_NAME}</Text>
            <Text style={styles.tagline}>Shared travel wallets. Group approvals. Demo only.</Text>
          </View>
          <View style={styles.form}>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg },
  hero: { flex: 1, justifyContent: 'center', gap: 12, paddingBottom: spacing.xl },
  form: { gap: spacing.md },
  logo: { ...typography.title, fontSize: 36, color: colors.accent },
  tagline: { ...typography.body, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
