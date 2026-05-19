import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { useGroupOverview } from '../../src/hooks/useGroupOverview';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, spacing } from '../../src/theme';

export default function MembersScreen() {
  const { activeGroupId } = useAuth();
  const { overview, loading } = useGroupOverview(activeGroupId);

  const hasGroup = !!activeGroupId;
  const members = overview?.members ?? [];

  return (
    <Screen title="Group members">
      {loading ? <Text style={styles.muted}>Loading…</Text> : null}
      {!loading && !hasGroup ? (
        <Text style={styles.muted}>
          Create or join a group to see its members here.
        </Text>
      ) : null}
      {!loading && hasGroup && members.length === 0 ? (
        <Text style={styles.muted}>No members found.</Text>
      ) : null}
      {members.map((m) => (
        <View key={m.user_id} style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(m.users?.display_name ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{m.users?.display_name ?? m.users?.legal_name ?? 'Member'}</Text>
            <Text style={styles.role}>{m.role}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 18 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  role: { color: colors.textMuted, fontSize: 13 },
});
