"use client";

import { Building2, RefreshCw } from "lucide-react";
import { useState } from "react";

import { OfficialAccountCreateForm } from "@/components/admin/OfficialAccountCreateForm";
import { OfficialAccountsTable } from "@/components/admin/OfficialAccountsTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toast } from "@/components/common/Toast";
import type {
  CreateOfficialAccountInput,
  CreatedOfficialAccount,
  OfficialAccount,
  OfficialAccountType,
} from "@/features/admin/officialAccountsApi";
import { useOfficialAccounts } from "@/features/admin/useOfficialAccounts";

type ToastState = {
  message: string;
  type: "success" | "error";
};

export default function AdminOfficialsPage() {
  const {
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
  } = useOfficialAccounts();
  const [createdAccount, setCreatedAccount] =
    useState<CreatedOfficialAccount | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<OfficialAccount | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function handleCreate(input: CreateOfficialAccountInput): Promise<void> {
    setCreatedAccount(null);
    setCreatedEmail(null);

    try {
      const result = await createAccount(input);
      setCreatedAccount(result);
      setCreatedEmail(input.email);
      setToast({ message: `@${result.nickname} 계정을 생성했습니다.`, type: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "공식 계정 생성에 실패했습니다.",
        type: "error",
      });
    }
  }

  async function handleChangeType(
    userId: string,
    type: OfficialAccountType,
  ): Promise<void> {
    try {
      await changeType(userId, type);
      setToast({
        message: `계정 유형을 ${type === "official" ? "학생회" : "동아리"}로 변경했습니다.`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "계정 유형 변경에 실패했습니다.",
        type: "error",
      });
    }
  }

  async function handleRevoke(): Promise<void> {
    if (!revokeTarget) {
      return;
    }

    try {
      await removeAccount(revokeTarget.userId);
      setToast({
        message: `@${revokeTarget.nickname} 공식 계정을 해제했습니다.`,
        type: "success",
      });
      setRevokeTarget(null);
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "공식 계정 해제에 실패했습니다.",
        type: "error",
      });
    }
  }

  async function handleCopyPassword(): Promise<void> {
    if (!createdAccount) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdAccount.tempPassword);
      setToast({ message: "임시 비밀번호를 복사했습니다.", type: "success" });
    } catch {
      setToast({ message: "임시 비밀번호를 복사하지 못했습니다.", type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-950">공식 계정 관리</h1>
            <p className="mt-2 text-sm text-zinc-500">
              학생회와 동아리 계정을 발급하고 인증 유형을 관리합니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => {
            void loadAccounts(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </header>

      {errorMessage ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <OfficialAccountCreateForm
        createdAccount={createdAccount}
        createdEmail={createdEmail}
        isSubmitting={isCreating}
        onCopyPassword={() => {
          void handleCopyPassword();
        }}
        onSubmit={handleCreate}
      />

      <OfficialAccountsTable
        accounts={accounts}
        isLoading={isLoading}
        mutatingUserId={mutatingUserId}
        onChangeType={(userId, type) => {
          void handleChangeType(userId, type);
        }}
        onRevoke={setRevokeTarget}
      />

      <ConfirmDialog
        isOpen={revokeTarget !== null}
        title="공식 계정을 해제하시겠습니까?"
        description="공식 인증이 제거됩니다. 사용자 계정 자체는 삭제되지 않습니다."
        confirmLabel="해제"
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => {
          void handleRevoke();
        }}
      />

      <Toast
        isVisible={toast !== null}
        message={toast?.message ?? ""}
        type={toast?.type}
        onHide={() => setToast(null)}
      />
    </div>
  );
}
