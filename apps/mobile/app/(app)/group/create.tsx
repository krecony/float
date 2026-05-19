import { createGroup } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../../src/components/Button';
import { Input } from '../../../src/components/Input';
import { Screen } from '../../../src/components/Screen';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useSupabase } from '../../../src/providers/SupabaseProvider';
import { colors } from '../../../src/theme';

export default function CreateGroupScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, setActiveGroupId, refreshUserGroups } = useAuth();
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!session?.user.id || !name.trim()) return;
    setLoading(true);
    try {
      const group = await createGroup(supabase, session.user.id, name.trim());
      await refreshUserGroups();
      await setActiveGroupId(group.id);
      setInviteCode(group.invite_code);
    } finally {
      setLoading(false);
    }
  };

  if (inviteCode) {
    return (
      <Screen title="Group created">
        <Text style={styles.code}>Invite code: {inviteCode}</Text>
        <Text style={styles.hint}>Share this code so others can join.</Text>
        <Text style={styles.hint}>
          Your other groups are still available — tap Groups in the top-right corner to switch.
        </Text>
        <Button label="Open group" onPress={() => router.replace('/(app)/group')} />
      </Screen>
    );
  }

  return (
    <Screen title="Create group" subtitle="Start a new travel wallet">
      <Input placeholder="Group name" value={name} onChangeText={setName} />
      <Button label={loading ? 'Creating…' : 'Create'} onPress={handleCreate} disabled={loading || !name.trim()} />
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { color: colors.accent, fontSize: 24, fontWeight: '700' },
  hint: { color: colors.textMuted },
});
