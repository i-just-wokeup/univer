"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { deleteAccount, signOut } from "@/features/auth/api";

const SETTINGS_SURFACE_CLASS = "rounded-[22px] bg-white";

function Section({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="px-4 py-3 lg:px-0">
      <h2 className="mb-2 px-1 text-xs font-extrabold text-krew-muted">
        {label}
      </h2>
      <div className={`${SETTINGS_SURFACE_CLASS} p-2`}>
        {children}
      </div>
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
    "flex h-12 w-full items-center justify-between rounded-2xl px-3 text-left text-sm font-extrabold transition";

  if (disabled) {
    return (
      <div className={`${className} text-krew-faint`}>
        <span>{label}</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} text-foreground hover:bg-krew-accent-soft hover:text-krew-accent`}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-krew-faint" aria-hidden="true" />
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
    <div className="min-h-screen bg-background pb-24 text-foreground lg:pb-12">
      <header className="sticky top-0 z-20 border-b border-krew-line bg-background/95 backdrop-blur lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="mx-auto grid h-14 w-full max-w-[620px] grid-cols-3 items-center px-4 lg:block lg:h-auto lg:px-0 lg:pb-2 lg:pt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center justify-self-start rounded-2xl bg-white text-foreground shadow-sm transition hover:text-krew-accent lg:hidden"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="justify-self-center text-base font-black tracking-[-0.02em] lg:text-xl lg:font-extrabold">
            설정
          </h1>
          <div className="lg:hidden" aria-hidden="true" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[620px] py-2 lg:py-4">
        <Section label="계정">
          <Row label="프로필 편집" onClick={() => router.push("/profile/edit")} />
          <Row label="내 활동" onClick={() => router.push("/settings/activity")} />
          <Row label="차단한 계정" onClick={() => router.push("/settings/blocked")} />
        </Section>

        <Section label="지원">
          <Row label="공지사항" disabled />
          <Row label="문의하기" disabled />
        </Section>

        <section className="px-4 py-3 lg:px-0">
          <div className={`${SETTINGS_SURFACE_CLASS} p-2`}>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="flex h-12 w-full items-center rounded-2xl px-3 text-left text-sm font-extrabold text-red-500 transition hover:bg-red-50"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex h-12 w-full items-center rounded-2xl px-3 text-left text-sm font-bold text-krew-muted transition hover:bg-krew-accent-soft hover:text-krew-accent"
            >
              탈퇴하기
            </button>
          </div>

          {errorMessage ? (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
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
