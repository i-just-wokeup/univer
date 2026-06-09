"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { deleteAccount, signOut } from "@/features/auth/api";

function Section({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="border-b border-zinc-100 px-4 py-5">
      <h2 className="mb-3 text-xs font-bold text-zinc-400">{label}</h2>
      <div className="divide-y divide-zinc-100">{children}</div>
    </section>
  );
}

function Row({
  disabled = false,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}) {
  const className =
    "flex h-12 w-full items-center justify-between text-left text-sm font-semibold";

  if (disabled) {
    return (
      <div className={`${className} text-zinc-400`}>
        <span>{label}</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} text-zinc-950`}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden="true" />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  async function handleLogoutConfirm() {
    setIsLogoutDialogOpen(false);
    setErrorMessage("");

    try {
      await signOut();
      router.replace("/auth/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그아웃에 실패했습니다.",
      );
    }
  }

  async function handleDeleteConfirm() {
    setIsDeleteDialogOpen(false);
    setErrorMessage("");

    try {
      await deleteAccount();
      await signOut();
      window.location.href = "/auth/login";
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "계정 탈퇴에 실패했습니다.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="grid h-14 grid-cols-3 items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="justify-self-start text-2xl font-light text-zinc-800"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 text-zinc-800" aria-hidden="true" />
          </button>
          <h1 className="justify-self-center text-base font-bold">설정</h1>
          <div aria-hidden="true" />
        </div>
      </header>

      <main>
        <Section label="계정">
          <Row label="프로필 편집" onClick={() => router.push("/profile/edit")} />
          <Row label="내 활동" onClick={() => router.push("/settings/activity")} />
          <Row label="차단한 계정" onClick={() => router.push("/settings/blocked")} />
        </Section>

        <Section label="지원">
          <Row label="공지사항" disabled />
          <Row label="문의하기" disabled />
        </Section>

        <section className="px-4 py-5">
          <div className="flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="h-12 text-sm font-bold text-red-500"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-sm font-semibold text-zinc-500"
            >
              탈퇴하기
            </button>
          </div>

          {errorMessage ? (
            <p className="mt-3 text-sm font-semibold text-red-500">
              {errorMessage}
            </p>
          ) : null}
        </section>
      </main>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="로그아웃 하시겠어요?"
        description="현재 계정에서 로그아웃합니다."
        confirmLabel="로그아웃"
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="정말 탈퇴하시겠습니까?"
        description="30일 이내 복구 가능합니다."
        confirmLabel="탈퇴"
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
