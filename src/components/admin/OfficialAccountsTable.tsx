"use client";

import type {
  OfficialAccount,
  OfficialAccountType,
} from "@/features/admin/officialAccountsApi";

type OfficialAccountsTableProps = {
  accounts: OfficialAccount[];
  isLoading: boolean;
  mutatingUserId: string | null;
  onChangeType: (userId: string, type: OfficialAccountType) => void;
  onRevoke: (account: OfficialAccount) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function OfficialAccountsTable({
  accounts,
  isLoading,
  mutatingUserId,
  onChangeType,
  onRevoke,
}: OfficialAccountsTableProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">등록된 공식 계정</h2>
          <p className="mt-1 text-sm text-zinc-500">현재 {accounts.length}개 계정</p>
        </div>
      </div>

      {isLoading ? (
        <OfficialAccountsSkeleton />
      ) : accounts.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-semibold text-zinc-700">등록된 공식 계정이 없습니다.</p>
          <p className="mt-2 text-sm text-zinc-500">위 폼에서 첫 계정을 생성하세요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left">
            <thead className="bg-zinc-50 text-xs font-semibold text-zinc-500">
              <tr>
                <th className="px-6 py-4">닉네임</th>
                <th className="px-4 py-4">단체명</th>
                <th className="px-4 py-4">유형</th>
                <th className="px-4 py-4">이메일</th>
                <th className="px-4 py-4">생성일</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {accounts.map((account) => {
                const isMutating = mutatingUserId === account.userId;
                const nextType: OfficialAccountType =
                  account.type === "official" ? "club" : "official";

                return (
                  <tr key={account.userId} className="text-sm text-zinc-700">
                    <td className="px-6 py-4 font-semibold text-zinc-950">
                      @{account.nickname}
                    </td>
                    <td className="max-w-56 px-4 py-4">
                      <span className="block truncate">{account.orgName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          account.type === "official"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {account.type === "official" ? "학생회" : "동아리"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-600">{account.email}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-zinc-500">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => onChangeType(account.userId, nextType)}
                          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {account.type === "official" ? "동아리로 변경" : "학생회로 변경"}
                        </button>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => onRevoke(account)}
                          className="rounded-xl px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          해제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OfficialAccountsSkeleton() {
  return (
    <div className="space-y-1 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />
      ))}
    </div>
  );
}
