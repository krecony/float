import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { MemberApproval } from '../hooks/useTransactionApprovals';
import { COLORS } from '../theme';

interface ApprovalTrackerProps {
  members: MemberApproval[];
  approvedCount: number;
  threshold: number;
}

export function ApprovalTracker({
  members,
  approvedCount,
  threshold,
}: ApprovalTrackerProps) {
  const progress = threshold > 0 ? Math.min(approvedCount / threshold, 1) : 0;

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} />

      <Text style={styles.label}>
        {approvedCount} / {threshold} approvals
      </Text>

      <View style={styles.memberList}>
        {members.map((m) => (
          <MemberChip key={m.userId} member={m} />
        ))}
      </View>
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  // Animate when progress changes
  width.value = withSpring(progress, { damping: 20, stiffness: 90 });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, animStyle]} />
    </View>
  );
}

function MemberChip({ member }: { member: MemberApproval }) {
  const isApproved = member.status === 'approved';
  const isRejected = member.status === 'rejected';

  return (
    <View
      style={[
        styles.chip,
        isApproved && styles.chipApproved,
        isRejected && styles.chipRejected,
      ]}
    >
      <Ionicons
        name={
          isApproved
            ? 'checkmark-circle'
            : isRejected
              ? 'close-circle'
              : 'ellipse-outline'
        }
        size={16}
        color={
          isApproved
            ? COLORS.success
            : isRejected
              ? COLORS.error
              : COLORS.muted
        }
      />
      <Text style={[styles.chipName, isApproved && styles.chipNameApproved, isRejected && styles.chipNameRejected]}>
        {member.displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  label: {
    color: COLORS.subtext,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  memberList: {
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipApproved: {
    borderColor: COLORS.success + '40',
    backgroundColor: COLORS.success + '12',
  },
  chipRejected: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '12',
  },
  chipName: {
    color: COLORS.subtext,
    fontSize: 15,
    fontWeight: '500',
  },
  chipNameApproved: {
    color: COLORS.success,
  },
  chipNameRejected: {
    color: COLORS.error,
  },
});
