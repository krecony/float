import { Ionicons } from '@expo/vector-icons';
import { type GroupMemberWithUser } from '@grouppay/shared';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

type Props = {
  visible: boolean;
  members: GroupMemberWithUser[];
  onConfirm: (selectedUserIds: string[]) => void;
  onCancel: () => void;
};

export function ParticipantSelectModal({ visible, members, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSelected(new Set(members.map((m) => m.user_id)));
    }
  }, [visible, members]);

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const canConfirm = selected.size > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <Pressable onPress={() => {}} style={styles.sheetInner}>
            <View style={styles.header}>
              <Text style={styles.title}>Who is splitting this?</Text>
              <Text style={styles.subtitle}>{selected.size} of {members.length} selected</Text>
            </View>

            <ScrollView style={styles.list}>
              {members.map((m) => {
                const name = m.users?.display_name ?? m.users?.legal_name ?? 'Member';
                const isSelected = selected.has(m.user_id);
                return (
                  <Pressable
                    key={m.user_id}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => toggle(m.user_id)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{name}</Text>
                      <Text style={styles.rowRole}>{m.role}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? colors.accent : colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, !canConfirm && styles.confirmDisabled]}
                onPress={() => canConfirm && onConfirm(Array.from(selected))}
                disabled={!canConfirm}
              >
                <Text style={styles.confirmText}>Confirm ({selected.size})</Text>
              </Pressable>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  sheetInner: {},
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.headline, color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  rowSelected: { borderWidth: 1, borderColor: colors.accent },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  rowInfo: { flex: 1 },
  rowName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowRole: { color: colors.textMuted, fontSize: 12 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  cancelText: { color: colors.text, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  confirmDisabled: { opacity: 0.4 },
  confirmText: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
