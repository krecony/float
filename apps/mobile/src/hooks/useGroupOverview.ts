import { fetchGroupOverview, type GroupOverview } from '@grouppay/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import { subscribeToGroupTransactions, unsubscribe } from '@grouppay/shared';

export function useGroupOverview(groupId: string | null) {
  const supabase = useSupabase();
  const [overview, setOverview] = useState<GroupOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) {
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupOverview(supabase, groupId);
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;

    const channel = subscribeToGroupTransactions(supabase, groupId, {
      onInsert: () => load(),
      onUpdate: () => load(),
      onDelete: () => load(),
    });

    return () => unsubscribe(channel);
  }, [groupId, supabase, load]);

  return { overview, loading, error, refresh: load };
}
