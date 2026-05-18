import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSupabase } from '../../src/providers/SupabaseProvider';
import { setIdVerified } from '@grouppay/shared';
import { colors } from '../../src/theme';

export default function VerifyIdScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, refreshProfile } = useAuth();
  const [legalName, setLegalName] = useState('');
  const [dob, setDob] = useState('');
  const [idLast4, setIdLast4] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      await setIdVerified(supabase, session.user.id, {
        legal_name: legalName,
        date_of_birth: dob,
        id_document_last4: idLast4,
      });
      await refreshProfile();
      router.replace('/(onboarding)/payment-method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Verify identity" subtitle="Demo KYC — any values accepted">
      <Input placeholder="Legal name" value={legalName} onChangeText={setLegalName} />
      <Input placeholder="Date of birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
      <Input placeholder="ID last 4 digits" value={idLast4} onChangeText={setIdLast4} keyboardType="number-pad" maxLength={4} />
      <Text style={styles.note}>No real ID check. For hackathon demo only.</Text>
      <Button label={loading ? 'Verifying…' : 'Verify'} onPress={handleVerify} disabled={loading || !legalName || !dob || !idLast4} />
      <Button
        label="Skip for now"
        variant="ghost"
        onPress={async () => {
          if (!session?.user.id) return;
          await setIdVerified(supabase, session.user.id, {
            legal_name: 'Demo User',
            date_of_birth: '2000-01-01',
            id_document_last4: '0000',
          });
          await refreshProfile();
          router.replace('/(onboarding)/payment-method');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 13 },
});
