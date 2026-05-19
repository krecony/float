export function formatCents(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateVirtualCardPan(): string {
  const digits = '0123456789';
  let pan = '4';
  for (let i = 0; i < 15; i++) {
    pan += digits[Math.floor(Math.random() * digits.length)];
  }
  return pan;
}

export const APP_NAME = 'GroupPay';
