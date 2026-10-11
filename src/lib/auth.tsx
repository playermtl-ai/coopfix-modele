import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/types";

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  recoveryPending: boolean;
  finishRecovery: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryPending, setRecoveryPending] = useState(() => localStorage.getItem('coopfix-recovery') === '1' || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery');
  const finishRecovery = useCallback(() => { localStorage.removeItem('coopfix-recovery'); setRecoveryPending(false); }, []);

  useEffect(() => {
    const syncRecovery = (event: StorageEvent) => { if (event.key === 'coopfix-recovery') setRecoveryPending(event.newValue === '1'); };
    window.addEventListener('storage', syncRecovery);
    return () => window.removeEventListener('storage', syncRecovery);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (_event === 'PASSWORD_RECOVERY') { localStorage.setItem('coopfix-recovery', '1'); setRecoveryPending(true); }
      if (_event === 'SIGNED_OUT') { localStorage.removeItem('coopfix-recovery'); setRecoveryPending(false); }
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      // Quelques tentatives : le profil est créé par un déclencheur à l'inscription.
      for (let attempt = 0; attempt < 4 && active; attempt++) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (data) {
          if (active) setProfile(data as Profile);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, [userId]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, recoveryPending, finishRecovery, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  return ctx;
}
