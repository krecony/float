const DEFAULT_DEMO_PASSWORD = 'grouppay-demo';

/** Normalize display/login name for storage and lookup (lowercase, single spaces). */
export function normalizeLoginName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Slug for synthetic Supabase email addresses (demo only). */
export function loginNameToEmailSlug(loginName: string): string {
  return normalizeLoginName(loginName).replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

export function loginNameToEmail(loginName: string): string {
  const slug = loginNameToEmailSlug(loginName);
  if (!slug) {
    throw new Error('Login name is required');
  }
  return `${slug}@grouppay.demo`;
}

export function getDemoAuthPassword(
  source: Record<string, string | undefined> = typeof process !== 'undefined'
    ? (process.env as Record<string, string | undefined>)
    : {},
): string {
  return (
    source.EXPO_PUBLIC_DEMO_AUTH_PASSWORD ??
    source.VITE_DEMO_AUTH_PASSWORD ??
    DEFAULT_DEMO_PASSWORD
  );
}

export function validateLoginNameInput(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Enter a name with at least 2 characters.';
  }
  if (trimmed.length > 32) {
    return 'Name must be 32 characters or fewer.';
  }
  if (!/^[\p{L}\p{N}\s.'-]+$/u.test(trimmed)) {
    return 'Name can only contain letters, numbers, spaces, and . \' -';
  }
  return null;
}
