import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUserProfile,
  shouldRequireOnboarding,
  signOutMobile,
} from "../features/auth/api";
import {
  clearStoredOnboardingComplete,
  getStoredOnboardingComplete,
  setStoredOnboardingComplete,
} from "../features/auth/onboardingStorage";
import { clearAllPageCaches } from "../features/session/page-caches";
import { clearUserContextCaches } from "../features/shared/userContext";
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
  const lastAuthUserIdRef = useRef<string | null | undefined>(undefined);

  const refreshOnboardingStatus = useCallback(async () => {
    if (!supabase) {
      setRequiresOnboarding(false);
      return;
    }

    const profile = await getCurrentUserProfile();
    if (!profile) {
      setRequiresOnboarding(false);
      return;
    }

    if (profile.deleted_at) {
      await clearStoredOnboardingComplete(profile.id).catch(() => undefined);
      await signOutMobile();
      return;
    }

    const required = shouldRequireOnboarding(profile);
    if (required) {
      await clearStoredOnboardingComplete(profile.id).catch(() => undefined);
    } else {
      await setStoredOnboardingComplete(profile.id).catch(() => undefined);
    }
    setRequiresOnboarding(required);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) {
        return;
      }

      const restoredSession = data.session;
      const restoredUserId = restoredSession?.user.id ?? null;

      if (restoredUserId) {
        const hasCompletedOnboarding = await getStoredOnboardingComplete(
          restoredUserId,
        ).catch(() => false);

        if (!isMounted) {
          return;
        }

        setRequiresOnboarding(false);
        setIsOnboardingLoading(!hasCompletedOnboarding);
      } else {
        setRequiresOnboarding(false);
        setIsOnboardingLoading(false);
      }

      lastAuthUserIdRef.current = restoredUserId;
      setSession(restoredSession);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null;
      const previousUserId = lastAuthUserIdRef.current;
      const hasUserChanged =
        previousUserId !== undefined && previousUserId !== nextUserId;

      lastAuthUserIdRef.current = nextUserId;

      if (event === "SIGNED_OUT" || hasUserChanged) {
        clearAllPageCaches();
        clearUserContextCaches();
      }

      if (nextUserId) {
        setRequiresOnboarding(false);
        setIsOnboardingLoading(true);
        getStoredOnboardingComplete(nextUserId)
          .then((hasCompletedOnboarding) => {
            if (lastAuthUserIdRef.current === nextUserId) {
              setIsOnboardingLoading(!hasCompletedOnboarding);
            }
          })
          .catch(() => undefined);
      } else {
        setRequiresOnboarding(false);
        setIsOnboardingLoading(false);
      }

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
    const sessionUserId = session.user.id;

    (async () => {
      const hasCompletedOnboarding = await getStoredOnboardingComplete(
        sessionUserId,
      ).catch(() => false);

      if (!isMounted) {
        return;
      }

      if (hasCompletedOnboarding) {
        setRequiresOnboarding(false);
        setIsOnboardingLoading(false);
      } else {
        setIsOnboardingLoading(true);
      }

      const profile = await getCurrentUserProfile();
      if (!isMounted || profile?.id !== sessionUserId) {
        return;
      }

      // 탈퇴(soft delete)된 계정은 재로그인 차단 → 즉시 로그아웃.
      if (profile.deleted_at) {
        await clearStoredOnboardingComplete(sessionUserId).catch(
          () => undefined,
        );
        await signOutMobile();
        return;
      }

      const required = shouldRequireOnboarding(profile);
      if (required) {
        await clearStoredOnboardingComplete(sessionUserId).catch(
          () => undefined,
        );
      } else {
        await setStoredOnboardingComplete(sessionUserId).catch(
          () => undefined,
        );
      }

      if (isMounted) {
        setRequiresOnboarding(required);
      }
    })()
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
