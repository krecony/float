import {
  listMembers,
  subscribeToTransactionApprovals,
  unsubscribe,
  type TransactionApproval,
} from '@grouppay/shared';
import { useEffect, useRef, useState } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export type ApprovalStatus = 'waiting' | 'approved' | 'rejected';

export interface MemberApproval {
  userId: string;
  displayName: string;
  status: ApprovalStatus;
}

export type TransactionOutcome = 'pending' | 'approved' | 'rejected';

interface UseTransactionApprovalsResult {
  members: MemberApproval[];
  approvedCount: number;
  rejectedCount: number;
  outcome: TransactionOutcome;
  latestApprover: MemberApproval | null;
}

export function useTransactionApprovals(
  transactionId: string,
  groupId: string,
  threshold: number,
): UseTransactionApprovalsResult {
  const client = useSupabase();
  const [members, setMembers] = useState<MemberApproval[]>([]);
  const latestApproverRef = useRef<MemberApproval | null>(null);

  // Load group members on mount
  useEffect(() => {
    if (!groupId) return;
    listMembers(client, groupId)
      .then((groupMembers) => {
        setMembers(
          groupMembers.map((m) => ({
            userId: m.user_id,
            displayName: m.users?.display_name ?? m.users?.legal_name ?? 'Member',
            status: 'waiting',
          })),
        );
      })
      .catch((e) => console.warn('Failed to load members:', e));
  }, [client, groupId]);

  // Subscribe to realtime approval changes
  useEffect(() => {
    if (!transactionId) return;

    const applyRow = (row: TransactionApproval) => {
      setMembers((prev) => {
        const updated = prev.map((m) => {
          if (m.userId !== row.user_id) return m;
          const next: MemberApproval = {
            ...m,
            status: row.approved ? 'approved' : 'rejected',
          };
          latestApproverRef.current = next;
          return next;
        });
        return updated;
      });
    };

    const channel = subscribeToTransactionApprovals(client, transactionId, {
      onInsert: applyRow,
      onUpdate: applyRow,
    });

    return () => {
      unsubscribe(client, channel);
    };
  }, [client, transactionId]);

  const approvedCount = members.filter((m) => m.status === 'approved').length;
  const rejectedCount = members.filter((m) => m.status === 'rejected').length;

  let outcome: TransactionOutcome = 'pending';
  if (rejectedCount > 0) {
    outcome = 'rejected';
  } else if (threshold > 0 && approvedCount >= threshold) {
    outcome = 'approved';
  }

  return {
    members,
    approvedCount,
    rejectedCount,
    outcome,
    latestApprover: latestApproverRef.current,
  };
}
