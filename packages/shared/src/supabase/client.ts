import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Typed tables are documented in types/database.ts; use loose client until codegen.
export type GroupPayClient = SupabaseClient;

export function createSupabaseClient(url: string, anonKey: string): GroupPayClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
