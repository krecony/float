import { getProfile, type User } from '@grouppay/shared';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSupabase } from './SupabaseProvider';

const ACTIVE_GROUP_KEY = '@grouppay/active_group_id';

type AuthContextValue = {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    const p = await getProfile(supabase, session.user.id);
    setProfile(p);
  }, [session?.user.id, supabase]);

  const setActiveGroupId = useCallback(async (id: string | null) => {
    setActiveGroupIdState(id);
    if (id) await AsyncStorage.setItem(ACTIVE_GROUP_KEY, id);
    else await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const stored = AsyncStorage.getItem(ACTIVE_GROUP_KEY).then((id) => {
      if (id) setActiveGroupIdState(id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      sub.subscription.unsubscribe();
      void stored;
    };
  }, [supabase]);

  useEffect(() => {
    if (session?.user.id) {
      refreshProfile().catch(console.error);
    } else {
      setProfile(null);
    }
  }, [session?.user.id, refreshProfile]);

  const signInAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }, [supabase]);

  const signOut = useCallback(async () => {
    await setActiveGroupId(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase, setActiveGroupId]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        activeGroupId,
        setActiveGroupId,
        refreshProfile,
        signInAnonymously,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
