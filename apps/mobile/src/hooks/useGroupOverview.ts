import { useGroupData } from '../providers/GroupDataProvider';

/** Reads group overview from the shared GroupDataProvider (single realtime subscription). */
export function useGroupOverview(_groupId: string | null) {
  const {
    overview,
    overviewLoading,
    overviewError,
    refreshOverview,
  } = useGroupData();

  return {
    overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  };
}
