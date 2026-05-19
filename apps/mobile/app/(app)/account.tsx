import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, spacing, typography } from '../../src/theme';

export default function AccountScreen() {
  const router = useRouter();
  const { profile, userGroups, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  };

  const name = profile?.display_name ?? profile?.login_name ?? 'Unknown';

  return (
    <Screen title="Account">
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        {profile?.login_name ? (
          <Text style={styles.loginName}>@{profile.login_name}</Text>
        ) : null}
        <View style={styles.pill}>
          <Ionicons
            name={profile?.id_verified ? 'shield-checkmark' : 'shield-outline'}
            size={14}
            color={profile?.id_verified ? colors.accent : colors.textMuted}
          />
          <Text style={[styles.pillText, !profile?.id_verified && styles.pillMuted]}>
            {profile?.id_verified ? 'Identity verified' : 'Not verified'}
          </Text>
        </View>
      </View>

      <Text style={styles.section}>Your groups ({userGroups.length})</Text>
      {userGroups.length === 0 ? (
        <Text style={styles.muted}>No groups yet.</Text>
      ) : (
        userGroups.map((g) => (
          <View key={g.id} style={styles.groupRow}>
            <Text style={styles.groupName}>{g.name}</Text>
            <Text style={styles.groupCode}>{g.invite_code}</Text>
          </View>
        ))
      )}

      <Pressable
        style={[styles.signOutBtn, signingOut && styles.signOutDisabled]}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: { color: colors.accent, fontSize: 32, fontWeight: '700' },
  name: { ...typography.headline, color: colors.text },
  loginName: { color: colors.textMuted, fontSize: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.xs,
  },
  pillText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  pillMuted: { color: colors.textMuted },
  section: { ...typography.headline, color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.textMuted },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  groupName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  groupCode: { color: colors.textMuted, fontSize: 13 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  signOutDisabled: { opacity: 0.5 },
  signOutText: { color: colors.danger, fontWeight: '600', fontSize: 16 },
});
