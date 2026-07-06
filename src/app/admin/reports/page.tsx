"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toast } from "@/components/common/Toast";
import {
  getAdminReports,
  handleReport,
  type AdminReport,
} from "@/features/admin/api";
import { getRelativeTimeLabel } from "@/lib/utils/time";

type ReportTab = "all" | "pending" | "completed";

const REPORT_TABS: Array<{ label: string; value: ReportTab }> = [
  { label: "전체", value: "all" },
  { label: "대기중", value: "pending" },
  { label: "처리완료", value: "completed" },
];

function ReportSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-5"
        >
          <div className="h-4 w-20 rounded-full bg-zinc-100" />
          <div className="mt-4 h-5 w-3/5 rounded-full bg-zinc-100" />
          <div className="mt-3 h-4 w-2/5 rounded-full bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

function getFilteredReports(reports: AdminReport[], tab: ReportTab) {
  if (tab === "pending") {
    return reports.filter((report) => report.status === "pending");
  }

  if (tab === "completed") {
    return reports.filter((report) => report.status !== "pending");
  }

  return reports;
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("all");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<AdminReport | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const statusFilter =
        tab === "all" ? "all" : tab === "pending" ? "pending" : "all";
      const nextReports = await getAdminReports(statusFilter, 50, 0);
      setReports(nextReports);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "신고 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReports]);

  function showToast(message: string, type: "success" | "error") {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  }

  async function handleDismissReport(reportId: string) {
    try {
      await handleReport(reportId, "dismiss");
      showToast("신고를 기각했습니다.", "success");
      await loadReports();
    } catch (actionError) {
      showToast(
        actionError instanceof Error ? actionError.message : "신고 기각에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleDeleteReport() {
    if (!reportToDelete) {
      return;
    }

    try {
      await handleReport(reportToDelete.id, "delete");
      setReportToDelete(null);
      showToast("신고 대상을 삭제 처리했습니다.", "success");
      await loadReports();
    } catch (actionError) {
      showToast(
        actionError instanceof Error ? actionError.message : "신고 처리에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleRestoreReport(reportId: string) {
    try {
      await handleReport(reportId, "restore");
      showToast("콘텐츠를 복구했습니다.", "success");
      await loadReports();
    } catch (actionError) {
      showToast(
        actionError instanceof Error ? actionError.message : "콘텐츠 복구에 실패했습니다.",
        "error",
      );
    }
  }

  const visibleReports = getFilteredReports(reports, tab);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-zinc-950">신고 관리</h1>
        <p className="mt-2 text-sm text-zinc-500">
          접수된 신고를 확인하고 삭제 또는 기각 처리합니다.
        </p>

        <div className="mt-5 inline-flex rounded-2xl bg-zinc-100 p-1">
          {REPORT_TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === item.value
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <ReportSkeleton />
      ) : (
        <div className="space-y-3">
          {visibleReports.length === 0 ? (
            <div className="rounded-[28px] border border-zinc-200 bg-white px-6 py-16 text-center text-sm font-medium text-zinc-500">
              표시할 신고가 없습니다.
            </div>
          ) : null}

          {visibleReports.map((report) => (
            <div
              key={report.id}
              className="flex items-start gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                {report.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={report.thumbnailUrl}
                    alt=""
                    className="aspect-square h-full w-full object-cover"
                  />
                ) : (
                  <div className="aspect-square h-full w-full bg-zinc-100" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-400">
                    {getRelativeTimeLabel(report.createdAt)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      report.targetType === "story"
                        ? "bg-amber-100 text-amber-700"
                        : report.targetType === "comment"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {report.targetType === "story"
                      ? "스토리"
                      : report.targetType === "comment"
                        ? "댓글"
                        : "게시물"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      report.status === "pending"
                        ? "bg-red-100 text-red-600"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {report.status === "pending" ? "대기중" : "처리완료"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-800">
                  {report.previewText?.slice(0, 50) || "미리보기 내용이 없습니다."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                  <span>
                    작성자 {report.authorNickname ?? report.targetAuthorNickname ?? "알 수 없음"}
                  </span>
                  <span>신고자 {report.reporterNickname ?? "알 수 없음"}</span>
                </div>
              </div>

              {report.status === "pending" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleDismissReport(report.id);
                    }}
                    className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
                  >
                    기각
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportToDelete(report)}
                    className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
              ) : report.status === "action_taken" &&
                report.targetType !== "comment" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRestoreReport(report.id);
                    }}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    복구
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(reportToDelete)}
        title="신고 대상을 삭제하시겠습니까?"
        description="삭제 처리 후에는 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onCancel={() => setReportToDelete(null)}
        onConfirm={() => {
          void handleDeleteReport();
        }}
      />

      <Toast
        isVisible={isToastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setIsToastVisible(false)}
      />
    </div>
  );
}
