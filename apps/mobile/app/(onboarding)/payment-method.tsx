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

export default function PaymentMethodScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session } = useAuth();
  const [label, setLabel] = useState('Demo Visa');
  const [lastFour, setLastFour] = useState('4242');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      await addPaymentMethod(supabase, session.user.id, {
        label,
        last_four: lastFour,
        brand: 'visa',
        exp_month: 12,
        exp_year: 2030,
      });
      router.replace('/(app)/group/join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Add payment method" subtitle="Simulated card — no real charges">
      <Input placeholder="Card label" value={label} onChangeText={setLabel} />
      <Input placeholder="Last 4 digits" value={lastFour} onChangeText={setLastFour} keyboardType="number-pad" maxLength={4} />
      <Text style={styles.note}>We never store full card numbers.</Text>
      <Button label={loading ? 'Saving…' : 'Save card'} onPress={handleSave} disabled={loading} />
      <Button label="Skip" variant="ghost" onPress={() => router.replace('/(app)/group/join')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 13 },
});
