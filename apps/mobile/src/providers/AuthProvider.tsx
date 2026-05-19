import {
  getProfile,
  listUserGroups,
  resolveActiveGroupId,
  signInWithLoginName,
  signUpWithLoginName,
  type Group,
  type User,
} from '@grouppay/shared';
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
  groupsLoaded: boolean;
  userGroups: Group[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUserGroups: () => Promise<Group[]>;
  signInWithLoginName: (name: string) => Promise<void>;
  signUpWithLoginName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    const p = await getProfile(supabase, session.user.id);
    setProfile(p);
  }, [session?.user.id, supabase]);

  const refreshUserGroups = useCallback(async (): Promise<Group[]> => {
    if (!session?.user.id) {
      setUserGroups([]);
      return [];
    }
    const groups = await listUserGroups(supabase, session.user.id);
    setUserGroups(groups);
    return groups;
  }, [session?.user.id, supabase]);

  const setActiveGroupId = useCallback(async (id: string | null) => {
    setActiveGroupIdState(id);
    if (id) await AsyncStorage.setItem(ACTIVE_GROUP_KEY, id);
    else await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
  }, []);

  const syncActiveGroup = useCallback(
    async (groups: Group[]) => {
      const stored = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
      const resolved = resolveActiveGroupId(groups, stored);
      if (resolved !== stored) {
        if (resolved) await AsyncStorage.setItem(ACTIVE_GROUP_KEY, resolved);
        else await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
      }
      setActiveGroupIdState(resolved);
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session?.user.id) {
      setProfile(null);
      setUserGroups([]);
      setActiveGroupIdState(null);
      setGroupsLoaded(false);
      return;
    }

    let cancelled = false;
    setGroupsLoaded(false);

    (async () => {
      await refreshProfile();
      const groups = await refreshUserGroups();
      if (cancelled) return;
      await syncActiveGroup(groups);
      if (!cancelled) setGroupsLoaded(true);
    })().catch((err) => {
      console.error(err);
      if (!cancelled) setGroupsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, refreshProfile, refreshUserGroups, syncActiveGroup]);

  const signInWithLoginNameHandler = useCallback(
    async (name: string) => {
      await signInWithLoginName(supabase, name);
    },
    [supabase],
  );

  const signUpWithLoginNameHandler = useCallback(
    async (name: string) => {
      await signUpWithLoginName(supabase, name, { displayName: name.trim() });
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await setActiveGroupId(null);
    setUserGroups([]);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase, setActiveGroupId]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        groupsLoaded,
        userGroups,
        activeGroupId,
        setActiveGroupId,
        refreshProfile,
        refreshUserGroups,
        signInWithLoginName: signInWithLoginNameHandler,
        signUpWithLoginName: signUpWithLoginNameHandler,
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
