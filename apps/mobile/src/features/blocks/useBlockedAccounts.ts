import { useCallback, useEffect, useState } from "react";

import { getBlockedUsers, unblockUser, type BlockedUser } from "./api";

// 차단 목록 로드 + 차단 해제(낙관적). 해제 확인 다이얼로그/렌더는 화면이 담당.
export function useBlockedAccounts() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      setBlockedUsers(await getBlockedUsers());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "차단 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setIsLoading(true);
    void load();
  }

  async function unblockUserById(targetId: string) {
    if (isUnblocking) {
      return;
    }

    const previousUsers = blockedUsers;

    setIsUnblocking(true);
    setBlockedUsers((current) => current.filter((user) => user.id !== targetId));

    try {
      await unblockUser(targetId);
    } catch (error) {
      setBlockedUsers(previousUsers);
      setErrorMessage(
        error instanceof Error ? error.message : "차단 해제에 실패했습니다.",
      );
    } finally {
      setIsUnblocking(false);
    }
  }

  return {
    blockedUsers,
    errorMessage,
    isLoading,
    isUnblocking,
    retry,
    unblockUserById,
  };
}
