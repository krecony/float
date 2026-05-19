import type { GroupPayClient } from '../supabase/client';
import type { GroupOverview, Transaction } from '../types/domain';
import { getGroup, listMembers } from './groups';
import { getGroupCard } from './virtualCards';

export async function listGroupTransactions(
  client: GroupPayClient,
  groupId: string,
): Promise<Transaction[]> {
  const { data, error } = await client
    .from('transactions')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPendingTransactions(
  client: GroupPayClient,
  groupId: string,
): Promise<Transaction[]> {
  const { data, error } = await client
    .from('transactions')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface CreateTransactionRequestInput {
  groupId: string;
  amountCents: number;
  description: string;
  createdBy: string;
  participantUserIds: string[];
}

export async function createTransactionRequest(
  client: GroupPayClient,
  input: CreateTransactionRequestInput,
): Promise<Transaction> {
  const { data: tx, error: txError } = await client
    .from('transactions')
    .insert({
      group_id: input.groupId,
      amount_cents: input.amountCents,
      description: input.description,
      created_by: input.createdBy,
      status: 'pending',
    })
    .select()
    .single();
  if (txError) throw txError;

  if (input.participantUserIds.length > 0) {
    const { error: partError } = await client.from('transaction_participants').insert(
      input.participantUserIds.map((user_id) => ({
        transaction_id: tx.id,
        user_id,
      })),
    );
    if (partError) throw partError;
  }

  return tx;
}

export async function updateTransactionParticipants(
  client: GroupPayClient,
  transactionId: string,
  participantUserIds: string[],
): Promise<void> {
  const { error: delError } = await client
    .from('transaction_participants')
    .delete()
    .eq('transaction_id', transactionId);
  if (delError) throw delError;

  if (participantUserIds.length > 0) {
    const { error: insError } = await client.from('transaction_participants').insert(
      participantUserIds.map((user_id) => ({
        transaction_id: transactionId,
        user_id,
      })),
    );
    if (insError) throw insError;
  }
}

export async function approveTransaction(
  client: GroupPayClient,
  transactionId: string,
  userId: string,
  approved: boolean,
): Promise<void> {
  const { error } = await client.from('transaction_approvals').upsert(
    {
      transaction_id: transactionId,
      user_id: userId,
      approved,
    },
    { onConflict: 'transaction_id,user_id' },
  );
  if (error) throw error;
}

export async function fetchGroupOverview(
  client: GroupPayClient,
  groupId: string,
): Promise<GroupOverview | null> {
  const group = await getGroup(client, groupId);
  if (!group) return null;

  const [members, transactions, virtualCard] = await Promise.all([
    listMembers(client, groupId),
    listGroupTransactions(client, groupId),
    getGroupCard(client, groupId),
  ]);

  return { group, members, transactions, virtual_card: virtualCard };
}
