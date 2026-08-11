import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getAccountBadges, type AccountBadge } from "../features/verified/api";
import { useSession } from "./session";

type VerifiedUsersContextValue = {
  // 유저의 배지 정보(소속/승격). 없으면 null.
  getBadge: (userId: string) => AccountBadge | null;
  // 배지 목록을 정상적으로 불러온 뒤에만 일반 계정 여부를 확정할 수 있다.
  isBadgeDataReady: boolean;
  // 하위호환: 배지가 하나라도 있으면 true.
  isVerified: (userId: string) => boolean;
};

const EMPTY_BADGES: ReadonlyMap<string, AccountBadge> = new Map();

const VerifiedUsersContext = createContext<VerifiedUsersContextValue>({
  getBadge: () => null,
  isBadgeDataReady: false,
  isVerified: () => false,
});

export function VerifiedUsersProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [badgesByUserId, setBadgesByUserId] =
    useState<ReadonlyMap<string, AccountBadge>>(EMPTY_BADGES);
  const [isBadgeDataReady, setIsBadgeDataReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setBadgesByUserId(EMPTY_BADGES);
    setIsBadgeDataReady(false);

    if (!userId) {
      return () => {
        isMounted = false;
      };
    }

    getAccountBadges()
      .then((badges) => {
        if (isMounted) {
          setBadgesByUserId(
            new Map(badges.map((badge) => [badge.userId, badge])),
          );
          setIsBadgeDataReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBadgesByUserId(EMPTY_BADGES);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const getBadge = useCallback(
    (targetUserId: string) => badgesByUserId.get(targetUserId) ?? null,
    [badgesByUserId],
  );
  const isVerified = useCallback(
    (targetUserId: string) => badgesByUserId.has(targetUserId),
    [badgesByUserId],
  );
  const value = useMemo(
    () => ({ getBadge, isBadgeDataReady, isVerified }),
    [getBadge, isBadgeDataReady, isVerified],
  );

  return (
    <VerifiedUsersContext.Provider value={value}>
      {children}
    </VerifiedUsersContext.Provider>
  );
}

export function useVerifiedUsers() {
  return useContext(VerifiedUsersContext);
}
