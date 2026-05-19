export interface NfcPaymentPayload {
  payerId: string;
  cardToken: string;
  timestamp: number;
  /** Optional groupId broadcast by payer — terminal uses its own configured groupId */
  groupId?: string;
}
