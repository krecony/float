export const COLORS = {
  bg: '#0a0a0f',
  card: '#111118',
  cardElevated: '#16161f',
  border: '#1e1e2e',
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  accent: '#4f46e5',
  text: '#f8fafc',
  subtext: '#94a3b8',
  muted: '#374151',
  mutedLight: '#4b5563',
  success: '#10b981',
  successLight: '#34d399',
  error: '#ef4444',
  errorLight: '#f87171',
} as const;

export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.accent] as [string, string],
  success: ['#059669', '#10b981'] as [string, string],
  error: ['#dc2626', '#ef4444'] as [string, string],
  dark: [COLORS.card, COLORS.bg] as [string, string],
  darkFade: ['#0a0a0f00', COLORS.bg] as [string, string],
} as const;
