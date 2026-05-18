import {
  listGroupTransactions,
  subscribeToGroupTransactions,
  unsubscribe,
  type Transaction,
} from '@grouppay/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export function useGroupTransactions(groupId: string | null) {
  const supabase = useSupabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!groupId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listGroupTransactions(supabase, groupId);
    setTransactions(data);
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;

    const channel = subscribeToGroupTransactions(supabase, groupId, {
      onInsert: (row) => setTransactions((prev) => [row, ...prev]),
      onUpdate: (row) =>
        setTransactions((prev) => prev.map((t) => (t.id === row.id ? row : t))),
      onDelete: (row) => setTransactions((prev) => prev.filter((t) => t.id !== row.id)),
    });

    return () => unsubscribe(channel);
  }, [groupId, supabase]);

  return { transactions, loading, refresh: load };
}
