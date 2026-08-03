import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getVerifiedUserIds } from "../features/verified/api";
import { useSession } from "./session";

type VerifiedUsersContextValue = {
  isVerified: (userId: string) => boolean;
};

const VerifiedUsersContext = createContext<VerifiedUsersContextValue>({
  isVerified: () => false,
});

export function VerifiedUsersProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [verifiedUserIds, setVerifiedUserIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let isMounted = true;

    setVerifiedUserIds(new Set());

    if (!userId) {
      return () => {
        isMounted = false;
      };
    }

    getVerifiedUserIds()
      .then((ids) => {
        if (isMounted) {
          setVerifiedUserIds(new Set(ids));
        }
      })
      .catch(() => {
        if (isMounted) {
          setVerifiedUserIds(new Set());
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const isVerified = useCallback(
    (targetUserId: string) => verifiedUserIds.has(targetUserId),
    [verifiedUserIds],
  );
  const value = useMemo(() => ({ isVerified }), [isVerified]);

  return (
    <VerifiedUsersContext.Provider value={value}>
      {children}
    </VerifiedUsersContext.Provider>
  );
}

export function useVerifiedUsers() {
  return useContext(VerifiedUsersContext);
}
