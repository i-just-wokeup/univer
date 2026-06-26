import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getUserOnboardingRequired } from "../features/auth/api";
import { getSupabaseMobileClient, isSupabaseConfigured } from "./supabase";

type SessionState = {
  isConfigured: boolean;
  isLoading: boolean;
  isOnboardingLoading: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  requiresOnboarding: boolean;
  session: Session | null;
};

const SessionContext = createContext<SessionState>({
  isConfigured: false,
  isLoading: true,
  isOnboardingLoading: false,
  refreshOnboardingStatus: async () => undefined,
  requiresOnboarding: false,
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
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  const refreshOnboardingStatus = useCallback(async () => {
    if (!supabase) {
      setRequiresOnboarding(false);
      return;
    }

    const required = await getUserOnboardingRequired();
    setRequiresOnboarding(required);
  }, [supabase]);

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

  useEffect(() => {
    if (!session) {
      setRequiresOnboarding(false);
      setIsOnboardingLoading(false);
      return;
    }

    let isMounted = true;
    setIsOnboardingLoading(true);

    refreshOnboardingStatus()
      .catch(() => {
        if (isMounted) {
          setRequiresOnboarding(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsOnboardingLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshOnboardingStatus, session]);

  const value = useMemo<SessionState>(
    () => ({
      isConfigured: Boolean(supabase),
      isLoading,
      isOnboardingLoading,
      refreshOnboardingStatus,
      requiresOnboarding,
      session,
    }),
    [
      supabase,
      isLoading,
      isOnboardingLoading,
      refreshOnboardingStatus,
      requiresOnboarding,
      session,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
