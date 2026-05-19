import { useGroupData } from '../providers/GroupDataProvider';

/** Reads pending approvals from the shared GroupDataProvider (single realtime subscription). */
export function usePendingApprovals(_groupId: string | null) {
  const { pending, pendingLoading, pendingCount, refreshPending } = useGroupData();

  return {
    pending,
    count: pendingCount,
    loading: pendingLoading,
    refresh: refreshPending,
  };
}
