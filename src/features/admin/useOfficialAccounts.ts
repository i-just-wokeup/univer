"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createOfficialAccount,
  listOfficialAccounts,
  revokeOfficial,
  setOfficialType,
  type CreateOfficialAccountInput,
  type CreatedOfficialAccount,
  type OfficialAccount,
  type OfficialAccountType,
} from "./officialAccountsApi";

export function useOfficialAccounts() {
  const [accounts, setAccounts] = useState<OfficialAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  const loadAccounts = useCallback(async (refreshing = false) => {
    try {
      setErrorMessage(null);
      setIsLoading(!refreshing);
      setIsRefreshing(refreshing);
      setAccounts(await listOfficialAccounts());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "공식 계정 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAccounts]);

  const createAccount = useCallback(
    async (
      input: CreateOfficialAccountInput,
    ): Promise<CreatedOfficialAccount> => {
      setIsCreating(true);

      try {
        const createdAccount = await createOfficialAccount(input);
        await loadAccounts(true);
        return createdAccount;
      } finally {
        setIsCreating(false);
      }
    },
    [loadAccounts],
  );

  const changeType = useCallback(
    async (userId: string, type: OfficialAccountType): Promise<void> => {
      setMutatingUserId(userId);

      try {
        await setOfficialType(userId, type);
        setAccounts((currentAccounts) =>
          currentAccounts.map((account) =>
            account.userId === userId ? { ...account, type } : account,
          ),
        );
      } finally {
        setMutatingUserId(null);
      }
    },
    [],
  );

  const removeAccount = useCallback(async (userId: string): Promise<void> => {
    setMutatingUserId(userId);

    try {
      await revokeOfficial(userId);
      setAccounts((currentAccounts) =>
        currentAccounts.filter((account) => account.userId !== userId),
      );
    } finally {
      setMutatingUserId(null);
    }
  }, []);

  return {
    accounts,
    changeType,
    createAccount,
    errorMessage,
    isCreating,
    isLoading,
    isRefreshing,
    loadAccounts,
    mutatingUserId,
    removeAccount,
  };
}
