import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GroupPayClient } from './client';
import type {
  GroupMember,
  Transaction,
  TransactionApproval,
  TransactionParticipant,
  VirtualCard,
} from '../types/domain';

export type RealtimeHandlers<T> = {
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (row: T) => void;
};

/** Remove an existing channel with this name so .on() is never called after subscribe(). */
function removeChannelByName(client: GroupPayClient, channelName: string) {
  const topic = `realtime:${channelName}`;
  const existing = client.getChannels().find((ch) => ch.topic === topic);
  if (existing) {
    void client.removeChannel(existing);
  }
}

export function unsubscribe(client: GroupPayClient, channel: RealtimeChannel | null) {
  if (channel) {
    void client.removeChannel(channel);
  }
}

export function subscribeToGroupTransactions(
  client: GroupPayClient,
  groupId: string,
  handlers: RealtimeHandlers<Transaction>,
  channelSuffix = 'default',
): RealtimeChannel {
  const channelName = `group-transactions:${groupId}:${channelSuffix}`;
  removeChannelByName(client, channelName);
  return client
    .channel(channelName)
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

export function subscribeToGroupCard(
  client: GroupPayClient,
  groupId: string,
  handlers: RealtimeHandlers<VirtualCard>,
  channelSuffix = 'default',
): RealtimeChannel {
  const channelName = `group-card:${groupId}:${channelSuffix}`;
  removeChannelByName(client, channelName);
  return client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'virtual_cards',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const row = payload.new as VirtualCard | undefined;
        const old = payload.old as VirtualCard | undefined;
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
  const channelName = `tx-approvals:${transactionId}`;
  removeChannelByName(client, channelName);
  return client
    .channel(channelName)
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
  return subscribeToGroupTransactions(
    client,
    groupId,
    {
      onInsert: (row) => {
        if (row.status === 'pending') handlers.onInsert?.(row);
      },
      onUpdate: (row) => handlers.onUpdate?.(row),
      onDelete: handlers.onDelete,
    },
    'pending',
  );
}

export function subscribeToGroupMembers(
  client: GroupPayClient,
  groupId: string,
  handlers: RealtimeHandlers<GroupMember>,
  channelSuffix = 'default',
): RealtimeChannel {
  const channelName = `group-members:${groupId}:${channelSuffix}`;
  removeChannelByName(client, channelName);
  return client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const row = payload.new as GroupMember | undefined;
        const old = payload.old as GroupMember | undefined;
        if (payload.eventType === 'INSERT' && row) handlers.onInsert?.(row);
        if (payload.eventType === 'UPDATE' && row) handlers.onUpdate?.(row);
        if (payload.eventType === 'DELETE' && old) handlers.onDelete?.(old);
      },
    )
    .subscribe();
}

/**
 * Subscribe to transaction_participants rows inserted for a specific user.
 * Used to send notifications only to participants the payer explicitly selected,
 * and only after they have confirmed (not at transaction creation time).
 */
export function subscribeToUserTransactionParticipants(
  client: GroupPayClient,
  userId: string,
  handlers: Pick<RealtimeHandlers<TransactionParticipant>, 'onInsert'>,
  channelSuffix = 'default',
): RealtimeChannel {
  const channelName = `user-tx-participants:${userId}:${channelSuffix}`;
  removeChannelByName(client, channelName);
  return client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transaction_participants',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as TransactionParticipant | undefined;
        if (row) handlers.onInsert?.(row);
      },
    )
    .subscribe();
}

export function subscribeToTransactionParticipants(
  client: GroupPayClient,
  transactionId: string,
  handlers: RealtimeHandlers<TransactionParticipant>,
): RealtimeChannel {
  const channelName = `tx-participants:${transactionId}`;
  removeChannelByName(client, channelName);
  return client
    .channel(channelName)
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
