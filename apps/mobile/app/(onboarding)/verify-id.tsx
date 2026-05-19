import { setIdVerified } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSupabase } from '../../src/providers/SupabaseProvider';
import { colors } from '../../src/theme';
import { validateVerifyIdForm } from '../../src/utils/verifyIdForm';

export default function VerifyIdScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, refreshProfile } = useAuth();
  const [legalName, setLegalName] = useState('');
  const [dob, setDob] = useState('');
  const [idLast4, setIdLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!session?.user.id) return;

    const validationError = validateVerifyIdForm(legalName, dob, idLast4);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      await setIdVerified(supabase, session.user.id, {
        legal_name: legalName.trim(),
        date_of_birth: dob,
        id_document_last4: idLast4,
      });
      await refreshProfile();
      router.replace('/(onboarding)/payment-method');
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Verification failed. Check your details and try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Verify identity" subtitle="Demo KYC — any values accepted">
      <Input placeholder="Legal name" value={legalName} onChangeText={setLegalName} />
      <Input placeholder="Date of birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
      <Input
        placeholder="ID last 4 digits"
        value={idLast4}
        onChangeText={setIdLast4}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Text style={styles.note}>No real ID check. For hackathon demo only.</Text>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Button
        label={loading ? 'Verifying…' : 'Verify'}
        onPress={handleVerify}
        disabled={loading || !legalName || !dob || !idLast4}
      />
      <Button
        label="Skip for now"
        variant="ghost"
        onPress={async () => {
          if (!session?.user.id) return;
          setFormError(null);
          try {
            await setIdVerified(supabase, session.user.id, {
              legal_name: 'Demo User',
              date_of_birth: '2000-01-01',
              id_document_last4: '0000',
            });
            await refreshProfile();
            router.replace('/(onboarding)/payment-method');
          } catch (e) {
            const message =
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : 'Could not skip verification.';
            setFormError(message);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 4 },
});
