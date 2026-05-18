import {
  listPendingTransactions,
  subscribeToGroupPendingTransactions,
  unsubscribe,
  type Transaction,
} from '@grouppay/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export function usePendingApprovals(groupId: string | null) {
  const supabase = useSupabase();
  const [pending, setPending] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!groupId) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listPendingTransactions(supabase, groupId);
    setPending(data);
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;

    const channel = subscribeToGroupPendingTransactions(supabase, groupId, {
      onInsert: (row) => setPending((prev) => [row, ...prev.filter((t) => t.id !== row.id)]),
      onUpdate: (row) => {
        if (row.status !== 'pending') {
          setPending((prev) => prev.filter((t) => t.id !== row.id));
        } else {
          setPending((prev) => prev.map((t) => (t.id === row.id ? row : t)));
        }
      },
      onDelete: (row) => setPending((prev) => prev.filter((t) => t.id !== row.id)),
    });

    return () => unsubscribe(channel);
  }, [groupId, supabase]);

  return { pending, count: pending.length, loading, refresh: load };
}
