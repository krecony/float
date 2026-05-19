import { joinGroupByInviteCode } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../../src/components/Button';
import { Input } from '../../../src/components/Input';
import { Screen } from '../../../src/components/Screen';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useSupabase } from '../../../src/providers/SupabaseProvider';
import { colors } from '../../../src/theme';

export default function JoinGroupScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, setActiveGroupId, refreshUserGroups } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!session?.user.id || !code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const group = await joinGroupByInviteCode(supabase, session.user.id, code.trim());
      await refreshUserGroups();
      await setActiveGroupId(group.id);
      router.replace('/(app)/group');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Join failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Join group" subtitle="Enter the 6-character invite code">
      <Input
        placeholder="Invite code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        maxLength={6}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={loading ? 'Joining…' : 'Join'} onPress={handleJoin} disabled={loading || code.length < 4} />
      <Button label="Create instead" variant="secondary" onPress={() => router.push('/(app)/group/create')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
});
