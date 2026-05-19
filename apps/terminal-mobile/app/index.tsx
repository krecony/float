import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { colors, spacing, typography } from '../src/theme';

export default function AmountScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!amount || isNaN(cents) || cents <= 0) {
      setError('Enter a valid amount');
      return;
    }
    router.push({
      pathname: '/scan',
      params: { amount },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>GroupPay</Text>
            <Text style={styles.role}>Merchant Terminal</Text>
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.currencySymbol}>€</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.border}
              keyboardType="decimal-pad"
              returnKeyType="next"
              autoFocus
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.nextBtn, (!amount || parseFloat(amount) <= 0) && styles.nextBtnDisabled]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>Open payment terminal →</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
    justifyContent: 'center',
  },

  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  brand: { ...typography.title, color: colors.accent },
  role: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  amountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  currencySymbol: { fontSize: 36, fontWeight: '700', color: colors.textMuted, marginTop: 6 },
  amountInput: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.text,
    minWidth: 140,
    textAlign: 'center',
  },

  field: { gap: spacing.sm },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },

  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },

  nextBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
