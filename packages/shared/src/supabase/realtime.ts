import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GroupPayClient } from './client';
import type {
  Transaction,
  TransactionApproval,
  TransactionParticipant,
} from '../types/domain';

export type RealtimeHandlers<T> = {
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (row: T) => void;
};

export function unsubscribe(channel: RealtimeChannel | null) {
  if (channel) {
    channel.unsubscribe();
  }
}

export function subscribeToGroupTransactions(
  client: GroupPayClient,
  groupId: string,
  handlers: RealtimeHandlers<Transaction>,
): RealtimeChannel {
  return client
    .channel(`group-transactions:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const row = payload.new as Transaction | undefined;
        const old = payload.old as Transaction | undefined;
        if (payload.eventType === 'INSERT' && row) handlers.onInsert?.(row);
        if (payload.eventType === 'UPDATE' && row) handlers.onUpdate?.(row);
        if (payload.eventType === 'DELETE' && old) handlers.onDelete?.(old);
      },
    )
    .subscribe();
}

export function subscribeToTransactionApprovals(
  client: GroupPayClient,
  transactionId: string,
  handlers: RealtimeHandlers<TransactionApproval>,
): RealtimeChannel {
  return client
    .channel(`tx-approvals:${transactionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transaction_approvals',
        filter: `transaction_id=eq.${transactionId}`,
      },
      (payload) => {
        const row = payload.new as TransactionApproval | undefined;
        const old = payload.old as TransactionApproval | undefined;
        if (payload.eventType === 'INSERT' && row) handlers.onInsert?.(row);
        if (payload.eventType === 'UPDATE' && row) handlers.onUpdate?.(row);
        if (payload.eventType === 'DELETE' && old) handlers.onDelete?.(old);
      },
    )
    .subscribe();
}

export function subscribeToGroupPendingTransactions(
  client: GroupPayClient,
  groupId: string,
  handlers: RealtimeHandlers<Transaction>,
): RealtimeChannel {
  return subscribeToGroupTransactions(client, groupId, {
    onInsert: (row) => {
      if (row.status === 'pending') handlers.onInsert?.(row);
    },
    onUpdate: (row) => handlers.onUpdate?.(row),
    onDelete: handlers.onDelete,
  });
}

export function subscribeToTransactionParticipants(
  client: GroupPayClient,
  transactionId: string,
  handlers: RealtimeHandlers<TransactionParticipant>,
): RealtimeChannel {
  return client
    .channel(`tx-participants:${transactionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transaction_participants',
        filter: `transaction_id=eq.${transactionId}`,
      },
      (payload) => {
        const row = payload.new as TransactionParticipant | undefined;
        const old = payload.old as TransactionParticipant | undefined;
        if (payload.eventType === 'INSERT' && row) handlers.onInsert?.(row);
        if (payload.eventType === 'UPDATE' && row) handlers.onUpdate?.(row);
        if (payload.eventType === 'DELETE' && old) handlers.onDelete?.(old);
      },
    )
    .subscribe();
}
