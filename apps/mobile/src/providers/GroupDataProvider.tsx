import {
  fetchGroupOverview,
  listPendingTransactions,
  subscribeToGroupCard,
  subscribeToGroupMembers,
  subscribeToGroupTransactions,
  subscribeToUserTransactionParticipants,
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
import { sendTransactionNotification } from '../utils/notifications';
import { useAuth } from './AuthProvider';
import { useSupabase } from './SupabaseProvider';

type GroupDataContextValue = {
  overview: GroupOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;
  pending: Transaction[];
  pendingLoading: boolean;
  pendingCount: number;
  latestTransaction: Transaction | null;
  clearLatestTransaction: () => void;
  refreshOverview: () => Promise<void>;
  refreshPending: () => Promise<void>;
};

const GroupDataContext = createContext<GroupDataContextValue | null>(null);

export function GroupDataProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const { activeGroupId, session } = useAuth();

  const [overview, setOverview] = useState<GroupOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [pending, setPending] = useState<Transaction[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);

  const clearLatestTransaction = useCallback(() => setLatestTransaction(null), []);

  // Stable ref so realtime callbacks read the current userId without re-subscribing.
  const sessionUserIdRef = useRef<string | undefined>(session?.user.id);
  sessionUserIdRef.current = session?.user.id;

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
        // Refresh data on any transaction change. Notifications are intentionally
        // NOT sent here — they fire via the transaction_participants subscription
        // below, ensuring notifications only go out after the payer has confirmed
        // who is splitting the payment.
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

    const membersChannel = subscribeToGroupMembers(
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
      unsubscribe(supabase, membersChannel);
    };
  }, [activeGroupId, supabase]);

  // Send notification when this user is added as a participant on a transaction.
  // This fires after the payer calls updateTransactionParticipants, so:
  //   • Notifications are delayed until participants are confirmed by the payer
  //   • Only selected participants receive a notification (their row is the trigger)
  //   • The payer themselves are excluded via the created_by check
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    const partChannel = subscribeToUserTransactionParticipants(
      supabase,
      userId,
      {
        onInsert: (row) => {
          void (async () => {
            const { data: tx } = await supabase
              .from('transactions')
              .select('*')
              .eq('id', row.transaction_id)
              .single();
            if (!tx) return;
            // Don't notify the payer who just confirmed the payment.
            if (tx.created_by === sessionUserIdRef.current) return;
            void sendTransactionNotification(
              tx.description ?? 'Payment',
              tx.amount_cents,
            ).then((sent) => {
              if (!sent) setLatestTransaction(tx as Transaction);
            });
          })();
        },
      },
      'group-data',
    );

    return () => {
      unsubscribe(supabase, partChannel);
    };
  }, [session?.user.id, supabase]);

  return (
    <GroupDataContext.Provider
      value={{
        overview,
        overviewLoading,
        overviewError,
        pending,
        pendingLoading,
        pendingCount: pending.length,
        latestTransaction,
        clearLatestTransaction,
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
