import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { colors, spacing, typography } from '../theme';

export function GroupSwitcher() {
  const router = useRouter();
  const { userGroups, activeGroupId, setActiveGroupId } = useAuth();
  const [open, setOpen] = useState(false);

  if (userGroups.length === 0) {
    return null;
  }

  const activeGroup = userGroups.find((g) => g.id === activeGroupId);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="swap-horizontal-outline" size={22} color={colors.accent} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Your groups</Text>
            {activeGroup ? (
              <Text style={styles.subtitle}>Viewing: {activeGroup.name}</Text>
            ) : null}

            <ScrollView style={styles.list}>
              {userGroups.map((group) => {
                const selected = group.id === activeGroupId;
                return (
                  <Pressable
                    key={group.id}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={async () => {
                      await setActiveGroupId(group.id);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{group.name}</Text>
                      <Text style={styles.rowMeta}>Invite {group.invite_code}</Text>
                    </View>
                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={styles.footerBtn}
                onPress={() => {
                  setOpen(false);
                  router.push('/(app)/group/create');
                }}
              >
                <Text style={styles.footerBtnText}>Create group</Text>
              </Pressable>
              <Pressable
                style={styles.footerBtn}
                onPress={() => {
                  setOpen(false);
                  router.push('/(app)/group/join');
                }}
              >
                <Text style={styles.footerBtnText}>Join group</Text>
              </Pressable>
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  title: { ...typography.headline, color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  list: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  rowSelected: { borderWidth: 1, borderColor: colors.accent },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  check: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  footerBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  footerBtnText: { color: colors.text, fontWeight: '600' },
});
