"use client";

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

import { getCurrentUserProfile } from "@/features/auth/api";
import { getChatUnreadCount } from "@/features/chat/api";
import { getUnreadCount } from "@/features/notifications/api";
import { clearAllPageCaches } from "@/features/session/page-caches";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type CurrentUserProfile = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>,
  "avatar_url" | "id" | "nickname" | "role"
>;

type AppSessionContextValue = {
  chatUnreadCount: number;
  currentUserProfile: CurrentUserProfile | null;
  refreshChatUnreadCount: () => Promise<void>;
  refreshCurrentUserProfile: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  unreadCount: number;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [currentUserProfile, setCurrentUserProfile] =
    useState<CurrentUserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const lastAuthUserIdRef = useRef<string | null | undefined>(undefined);

  const refreshCurrentUserProfile = useCallback(async () => {
    try {
      const profile = await getCurrentUserProfile();

      setCurrentUserProfile(
        profile
          ? {
              avatar_url: profile.avatar_url,
              id: profile.id,
              nickname: profile.nickname,
              role: profile.role,
            }
          : null,
      );
    } catch {
      setCurrentUserProfile(null);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const refreshChatUnreadCount = useCallback(async () => {
    try {
      setChatUnreadCount(await getChatUnreadCount());
    } catch {
      setChatUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshCurrentUserProfile();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshCurrentUserProfile]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id ?? null;
      const previousUserId = lastAuthUserIdRef.current;
      const hasUserChanged =
        previousUserId !== undefined && previousUserId !== nextUserId;
      const shouldRefreshSession =
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        hasUserChanged;

      lastAuthUserIdRef.current = nextUserId;

      if (!shouldRefreshSession) {
        return;
      }

      clearAllPageCaches();

      if (event === "SIGNED_OUT" || !nextUserId) {
        setCurrentUserProfile(null);
        setUnreadCount(0);
        setChatUnreadCount(0);
        return;
      }

      window.setTimeout(() => {
        if (!isMounted) {
          return;
        }

        void refreshCurrentUserProfile();
        void refreshUnreadCount();
        void refreshChatUnreadCount();
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [
    refreshChatUnreadCount,
    refreshCurrentUserProfile,
    refreshUnreadCount,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshUnreadCount();
    }, 0);
    window.addEventListener("notifications:refresh", refreshUnreadCount);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("notifications:refresh", refreshUnreadCount);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshChatUnreadCount();
    }, 0);
    window.addEventListener("chat:refresh", refreshChatUnreadCount);

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ?.channel("app-session:conversations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          void refreshChatUnreadCount();
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("chat:refresh", refreshChatUnreadCount);
      if (channel) {
        void supabase?.removeChannel(channel);
      }
    };
  }, [refreshChatUnreadCount]);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      chatUnreadCount,
      currentUserProfile,
      refreshChatUnreadCount,
      refreshCurrentUserProfile,
      refreshUnreadCount,
      unreadCount,
    }),
    [
      chatUnreadCount,
      currentUserProfile,
      refreshChatUnreadCount,
      refreshCurrentUserProfile,
      refreshUnreadCount,
      unreadCount,
    ],
  );

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }

  return context;
}
