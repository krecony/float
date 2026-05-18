import { createSupabaseClient, getTerminalEnv, type GroupPayClient } from '@grouppay/shared';
import { createContext, ReactNode, useContext, useMemo } from 'react';

const SupabaseContext = createContext<GroupPayClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const env = getTerminalEnv(import.meta.env);
    return createSupabaseClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  }, []);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider');
  return client;
}
