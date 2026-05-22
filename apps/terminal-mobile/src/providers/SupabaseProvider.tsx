import { createSupabaseClient, type GroupPayClient } from '@grouppay/shared';
import Constants from 'expo-constants';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SupabaseContext = createContext<GroupPayClient | null>(null);

/** Read Supabase credentials without throwing — returns nulls when unconfigured. */
function resolveCredentials(): { url: string | null; key: string | null } {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string; supabaseAnonKey?: string }
    | undefined;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? null;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey ?? null;
  return { url, key };
}

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { url, key } = resolveCredentials();

  // If env vars are missing (e.g. EAS secrets not configured), show a clear
  // error instead of crashing with an unreadable native exception.
  if (!url || !key) {
    return (
      <View style={cfg.screen}>
        <Text style={cfg.title}>⚠️ Not configured</Text>
        <Text style={cfg.body}>
          Supabase credentials are missing.{'\n\n'}
          Set{' '}
          <Text style={cfg.code}>EXPO_PUBLIC_SUPABASE_URL</Text> and{'\n'}
          <Text style={cfg.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
          {'\n\n'}as EAS secrets for this project, then rebuild.
        </Text>
      </View>
    );
  }

  return <ReadyProvider url={url} anonKey={key}>{children}</ReadyProvider>;
}

function ReadyProvider({
  url,
  anonKey,
  children,
}: {
  url: string;
  anonKey: string;
  children: ReactNode;
}) {
  const client = useMemo(() => createSupabaseClient(url, anonKey), [url, anonKey]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sign in anonymously so createTransactionRequest can write to Supabase.
    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        return;
      }
      client.auth.signInAnonymously().then(() => setReady(true));
    });
  }, [client]);

  if (!ready) return null;

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

const cfg = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: { color: '#ffc857', fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  body: { color: '#a0a0b8', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  code: { color: '#3dffa8', fontFamily: 'monospace' },
});

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider');
  return client;
}
