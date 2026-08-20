"use client";

import Link from "next/link";
import { useState } from "react";

import { deleteAccount, signOut } from "@/features/auth/api";

const CONTACT_EMAIL = "unip.support@gmail.com";

type DeleteAccountPageClientProps = {
  accountEmail: string | null;
  accountNickname: string | null;
  isAuthenticated: boolean;
};

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-12 text-zinc-950">
      <div className="mx-auto w-full max-w-xl">{children}</div>
    </main>
  );
}

function ContactNotice() {
  return (
    <p className="mt-8 border-t border-zinc-200 pt-5 text-sm leading-6 text-zinc-600">
      로그인할 수 없거나 직접 삭제 요청이 어려우면 {CONTACT_EMAIL}(으)로 문의해
      주세요.
    </p>
  );
}

export default function DeleteAccountPageClient({
  accountEmail,
  accountNickname,
  isAuthenticated,
}: DeleteAccountPageClientProps) {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDeleteAccount() {
    if (!hasAgreed || isSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await deleteAccount();

      try {
        await signOut();
      } finally {
        setIsComplete(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "계정 삭제 요청을 처리하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <PageShell>
        <p className="text-sm font-semibold text-emerald-700">요청 완료</p>
        <h1 className="mt-2 text-2xl font-bold">삭제 요청이 접수됐습니다</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-700">
          계정은 즉시 비활성화되었으며, 요청일로부터 30일 후 계정과 관련 데이터가
          영구적으로 삭제됩니다.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          로그인 화면으로 이동
        </Link>
        <ContactNotice />
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <p className="text-sm font-semibold text-zinc-500">UNIVER 계정 관리</p>
        <h1 className="mt-2 text-2xl font-bold">계정 삭제 요청</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-700">
          앱을 설치하지 않아도 이 페이지에서 계정 삭제를 요청할 수 있습니다.
          본인 확인을 위해 삭제할 계정으로 먼저 로그인해 주세요.
        </p>

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold">삭제 절차</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-zinc-600">
            <li>가입한 학교 계정으로 로그인합니다.</li>
            <li>삭제 결과를 확인하고 동의합니다.</li>
            <li>계정 삭제 버튼을 눌러 요청을 완료합니다.</li>
          </ol>
        </section>

        <Link
          href="/auth/login?redirectTo=%2Fdelete-account"
          className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          학교 계정으로 로그인
        </Link>
        <ContactNotice />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className="text-sm font-semibold text-zinc-500">UNIVER 계정 관리</p>
      <h1 className="mt-2 text-2xl font-bold">계정을 삭제하시겠습니까?</h1>

      <div className="mt-7 border-y border-zinc-200 py-4">
        <p className="text-xs font-medium text-zinc-500">삭제할 계정</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">닉네임</dt>
            <dd className="mt-1 font-semibold text-zinc-900">
              {accountNickname ?? "확인할 수 없음"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">이메일</dt>
            <dd className="mt-1 break-all font-semibold text-zinc-900">
              {accountEmail ?? "확인할 수 없음"}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-7">
        <h2 className="text-base font-semibold text-zinc-900">
          삭제 전에 확인해 주세요
        </h2>
        <ul className="mt-3 list-outside list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
          <li>삭제 요청 즉시 계정이 비활성화되어 서비스를 이용할 수 없습니다.</li>
          <li>
            30일 후 게시물, 댓글, 스토리, 메시지, 프로필 등 관련 데이터가
            영구적으로 삭제됩니다.
          </li>
          <li>영구 삭제가 완료된 데이터는 복구할 수 없습니다.</li>
        </ul>
      </section>

      <label className="mt-7 flex cursor-pointer items-start gap-3 border-t border-zinc-200 pt-5">
        <input
          type="checkbox"
          checked={hasAgreed}
          onChange={(event) => setHasAgreed(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-red-600"
        />
        <span className="text-sm leading-6 text-zinc-700">
          위 내용을 확인했으며 계정 삭제와 30일 후 데이터 영구 삭제에
          동의합니다.
        </span>
      </label>

      {errorMessage ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!hasAgreed || isSubmitting}
        onClick={() => void handleDeleteAccount()}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? "삭제 요청 중..." : "계정 삭제"}
      </button>

      <Link
        href="/"
        className="mt-3 inline-flex h-11 w-full items-center justify-center text-sm font-semibold text-zinc-600 hover:text-zinc-950"
      >
        취소하고 돌아가기
      </Link>
      <ContactNotice />
    </PageShell>
  );
}
