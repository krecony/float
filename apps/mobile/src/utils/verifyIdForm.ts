/** Returns a user-facing error message, or null if valid. */
export function validateVerifyIdForm(
  legalName: string,
  dob: string,
  idLast4: string,
): string | null {
  const name = legalName.trim();
  if (name.length < 2) {
    return 'Enter your full legal name (at least 2 characters).';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return 'Date of birth must be YYYY-MM-DD (e.g. 1990-05-15).';
  }

  const [year, month, day] = dob.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return 'That date of birth is not valid.';
  }

  if (!/^\d{4}$/.test(idLast4)) {
    return 'ID last 4 must be exactly 4 digits.';
  }

  return null;
}
