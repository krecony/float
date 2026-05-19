import { addPaymentMethod } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSupabase } from '../../src/providers/SupabaseProvider';
import { colors } from '../../src/theme';
import {
  parseExpiryYear,
  validatePaymentMethodForm,
} from '../../src/utils/paymentMethodForm';

export default function PaymentMethodScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session } = useAuth();
  const [label, setLabel] = useState('Personal Visa');
  const [pan, setPan] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!session?.user.id) return;

    const validationError = validatePaymentMethodForm({
      label,
      pan,
      expMonth,
      expYear,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      await addPaymentMethod(supabase, session.user.id, {
        label: label.trim(),
        pan,
        brand: 'visa',
        exp_month: parseInt(expMonth, 10),
        exp_year: parseExpiryYear(expYear),
      });
      router.replace('/(app)/group/join');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Add payment method" subtitle="Simulated card — demo storage only">
      <Input placeholder="Card label" value={label} onChangeText={setLabel} />
      <Input
        placeholder="Card number"
        value={pan}
        onChangeText={setPan}
        keyboardType="number-pad"
        maxLength={19}
      />
      <Input
        placeholder="Expiry month (MM)"
        value={expMonth}
        onChangeText={setExpMonth}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Input
        placeholder="Expiry year (YYYY)"
        value={expYear}
        onChangeText={setExpYear}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Text style={styles.note}>
        Full card number is stored for this hackathon demo only — not real PCI compliance.
      </Text>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Button label={loading ? 'Saving…' : 'Save card'} onPress={handleSave} disabled={loading} />
      <Button label="Skip" variant="ghost" onPress={() => router.replace('/(app)/group/join')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.danger, fontSize: 14 },
});
