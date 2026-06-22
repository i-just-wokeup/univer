import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseMobileClient, isSupabaseConfigured } from "./supabase";

type SessionState = {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
};

const SessionContext = createContext<SessionState>({
  isConfigured: false,
  isLoading: true,
  session: null,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? getSupabaseMobileClient() : null),
    [],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<SessionState>(
    () => ({ isConfigured: Boolean(supabase), isLoading, session }),
    [supabase, isLoading, session],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
