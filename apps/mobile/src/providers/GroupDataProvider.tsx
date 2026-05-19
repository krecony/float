import {
  fetchGroupOverview,
  listPendingTransactions,
  subscribeToGroupCard,
  subscribeToGroupTransactions,
  unsubscribe,
  type GroupOverview,
  type Transaction,
} from '@grouppay/shared';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthProvider';
import { useSupabase } from './SupabaseProvider';

type GroupDataContextValue = {
  overview: GroupOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;
  pending: Transaction[];
  pendingLoading: boolean;
  pendingCount: number;
  refreshOverview: () => Promise<void>;
  refreshPending: () => Promise<void>;
};

const GroupDataContext = createContext<GroupDataContextValue | null>(null);

export function GroupDataProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const { activeGroupId } = useAuth();

  const [overview, setOverview] = useState<GroupOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [pending, setPending] = useState<Transaction[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  const refreshOverview = useCallback(async () => {
    if (!activeGroupId) {
      setOverview(null);
      setOverviewLoading(false);
      setOverviewError(null);
      return;
    }
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await fetchGroupOverview(supabase, activeGroupId);
      setOverview(data);
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : 'Failed to load group');
    } finally {
      setOverviewLoading(false);
    }
  }, [activeGroupId, supabase]);

  const refreshPending = useCallback(async () => {
    if (!activeGroupId) {
      setPending([]);
      setPendingLoading(false);
      return;
    }
    setPendingLoading(true);
    try {
      const data = await listPendingTransactions(supabase, activeGroupId);
      setPending(data);
    } finally {
      setPendingLoading(false);
    }
  }, [activeGroupId, supabase]);

  const refreshOverviewRef = useRef(refreshOverview);
  const refreshPendingRef = useRef(refreshPending);
  refreshOverviewRef.current = refreshOverview;
  refreshPendingRef.current = refreshPending;

  useEffect(() => {
    void refreshOverview();
    void refreshPending();
  }, [refreshOverview, refreshPending]);

  useEffect(() => {
    if (!activeGroupId) return;

    const txChannel = subscribeToGroupTransactions(
      supabase,
      activeGroupId,
      {
        onInsert: () => {
          void refreshOverviewRef.current();
          void refreshPendingRef.current();
        },
        onUpdate: () => {
          void refreshOverviewRef.current();
          void refreshPendingRef.current();
        },
        onDelete: () => {
          void refreshOverviewRef.current();
          void refreshPendingRef.current();
        },
      },
      'group-data',
    );

    const cardChannel = subscribeToGroupCard(
      supabase,
      activeGroupId,
      {
        onInsert: () => void refreshOverviewRef.current(),
        onUpdate: () => void refreshOverviewRef.current(),
        onDelete: () => void refreshOverviewRef.current(),
      },
      'group-data',
    );

    return () => {
      unsubscribe(supabase, txChannel);
      unsubscribe(supabase, cardChannel);
    };
  }, [activeGroupId, supabase]);

  return (
    <GroupDataContext.Provider
      value={{
        overview,
        overviewLoading,
        overviewError,
        pending,
        pendingLoading,
        pendingCount: pending.length,
        refreshOverview,
        refreshPending,
      }}
    >
      {children}
    </GroupDataContext.Provider>
  );
}

export function useGroupData() {
  const ctx = useContext(GroupDataContext);
  if (!ctx) {
    throw new Error('useGroupData must be used within GroupDataProvider');
  }
  return ctx;
}
