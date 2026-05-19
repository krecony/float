import type { GroupPayClient } from '../supabase/client';
import type { GroupOverview, Transaction, TransactionStatus } from '../types/domain';
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

export async function updateTransactionDescription(
  client: GroupPayClient,
  transactionId: string,
  description: string,
): Promise<void> {
  const { error } = await client
    .from('transactions')
    .update({ description })
    .eq('id', transactionId);
  if (error) throw error;
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
    { transaction_id: transactionId, user_id: userId, approved },
    { onConflict: 'transaction_id,user_id' },
  );
  if (error) throw error;
  await finalizeTransactionIfComplete(client, transactionId);
}

/** Check if all participants have voted and resolve the transaction status. */
async function finalizeTransactionIfComplete(
  client: GroupPayClient,
  transactionId: string,
): Promise<void> {
  const [{ data: participants }, { data: approvals }] = await Promise.all([
    client.from('transaction_participants').select('user_id').eq('transaction_id', transactionId),
    client
      .from('transaction_approvals')
      .select('user_id, approved')
      .eq('transaction_id', transactionId),
  ]);

  if (!participants?.length || !approvals) return;

  const allVoted = participants.every((p) => approvals.some((a) => a.user_id === p.user_id));
  if (!allVoted) return;

  const newStatus: TransactionStatus = approvals.some((a) => !a.approved)
    ? 'rejected'
    : 'completed';

  await client.from('transactions').update({ status: newStatus }).eq('id', transactionId);
}

export interface TransactionWithApprovalState extends Transaction {
  isParticipant: boolean;
  myApproval: boolean | null;
  approvalCount: number;
  participantCount: number;
}

/** Load participant + approval state for a single transaction for the given user. */
export async function getTransactionApprovalState(
  client: GroupPayClient,
  transactionId: string,
  userId: string,
): Promise<{ isParticipant: boolean; myApproval: boolean | null; approvalCount: number; participantCount: number }> {
  const [{ data: participants }, { data: approvals }] = await Promise.all([
    client.from('transaction_participants').select('user_id').eq('transaction_id', transactionId),
    client
      .from('transaction_approvals')
      .select('user_id, approved')
      .eq('transaction_id', transactionId),
  ]);

  const parts = participants ?? [];
  const apprs = approvals ?? [];
  const isParticipant = parts.some((p) => p.user_id === userId);
  const myApprovalRow = apprs.find((a) => a.user_id === userId);
  const myApproval = myApprovalRow ? myApprovalRow.approved : null;
  const approvalCount = apprs.filter((a) => a.approved).length;

  return { isParticipant, myApproval, approvalCount, participantCount: parts.length };
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
