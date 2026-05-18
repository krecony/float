import { z } from 'zod';

export const mobileEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const terminalEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

export type MobileEnv = z.infer<typeof mobileEnvSchema>;
export type TerminalEnv = z.infer<typeof terminalEnvSchema>;

function parseEnv<T>(
  schema: z.ZodSchema<T>,
  source: Record<string, string | undefined>,
  label: string,
): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(
      `Missing or invalid ${label} environment variables: ${missing}. Copy .env.example to .env`,
    );
  }
  return result.data;
}

export function getMobileEnv(
  source: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): MobileEnv {
  return parseEnv(mobileEnvSchema, source, 'mobile');
}

export function getTerminalEnv(
  source: Record<string, string | undefined>,
): TerminalEnv {
  return parseEnv(terminalEnvSchema, source, 'terminal');
}
