import {
  createSupabaseClient,
  getMobileEnv,
  type GroupPayClient,
} from '@grouppay/shared';
import Constants from 'expo-constants';
import { createContext, ReactNode, useContext, useMemo } from 'react';

const SupabaseContext = createContext<GroupPayClient | null>(null);

function resolveMobileEnv() {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string; supabaseAnonKey?: string }
    | undefined;

  return getMobileEnv({
    EXPO_PUBLIC_SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey,
  });
}

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const env = resolveMobileEnv();
    return createSupabaseClient(
      env.EXPO_PUBLIC_SUPABASE_URL,
      env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider');
  return client;
}
