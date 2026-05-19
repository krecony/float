export const PAYMENT_TOTAL = 48.2;
export const GROUP_MEMBERS = 3;
export const SHARE_AMOUNT =
  Math.round((PAYMENT_TOTAL / GROUP_MEMBERS) * 100) / 100;

export function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}
