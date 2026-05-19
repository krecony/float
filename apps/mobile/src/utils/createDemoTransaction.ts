import { createTransactionRequest, type GroupPayClient } from '@grouppay/shared';

// TODO: remove this demo helper once real terminal integration is in place.
// The rest of the transaction flow (participant modal, realtime banner, list update)
// is independent of this function and works with any createTransactionRequest call.
export async function createDemoTransaction(
  client: GroupPayClient,
  groupId: string,
  createdByUserId: string,
  participantUserIds: string[],
) {
  return createTransactionRequest(client, {
    groupId,
    amountCents: 1000, // €10
    description: 'Demo purchase',
    createdBy: createdByUserId,
    participantUserIds,
  });
}
