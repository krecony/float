function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function luhnCheck(pan: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = pan.length - 1; i >= 0; i--) {
    let n = parseInt(pan[i]!, 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function validatePaymentMethodForm(input: {
  label: string;
  pan: string;
  expMonth: string;
  expYear: string;
}): string | null {
  const label = input.label.trim();
  if (label.length < 2) {
    return 'Enter a card label (at least 2 characters).';
  }

  const pan = digitsOnly(input.pan);
  if (pan.length < 13 || pan.length > 19) {
    return 'Card number must be 13–19 digits.';
  }
  if (!luhnCheck(pan)) {
    return 'Card number is not valid.';
  }

  const month = parseInt(input.expMonth, 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 'Expiry month must be 01–12.';
  }

  const yearRaw = input.expYear.trim();
  let year = parseInt(yearRaw, 10);
  if (yearRaw.length === 2) {
    year = 2000 + year;
  }
  if (!Number.isInteger(year) || year < new Date().getFullYear()) {
    return 'Expiry year must be this year or later.';
  }

  const now = new Date();
  const expiry = new Date(year, month, 0);
  if (expiry < new Date(now.getFullYear(), now.getMonth(), 1)) {
    return 'Card has expired.';
  }

  return null;
}

export function parseExpiryYear(expYear: string): number {
  const trimmed = expYear.trim();
  const year = parseInt(trimmed, 10);
  if (trimmed.length === 2) {
    return 2000 + year;
  }
  return year;
}
