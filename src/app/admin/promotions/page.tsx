"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PromotionMediaLightbox } from "@/components/admin/PromotionMediaLightbox";
import { PromotionRequestCard } from "@/components/admin/PromotionRequestCard";
import { PromotionReviewPanel } from "@/components/admin/PromotionReviewPanel";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toast } from "@/components/common/Toast";
import {
  approvePromotion,
  getApplicantPosts,
  getPromotionRequests,
  rejectPromotion,
  type AdminApplicantMedia,
  type AdminApplicantPost,
  type AdminPromotionRequest,
} from "@/features/admin/api";

type ReviewAction = "approve" | "reject";

export default function AdminPromotionsPage() {
  const [requests, setRequests] = useState<AdminPromotionRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [posts, setPosts] = useState<AdminApplicantPost[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<AdminApplicantMedia | null>(null);
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.requestId === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  const loadRequests = useCallback(async (showRefreshing = false) => {
    try {
      setError(null);
      setIsLoading(!showRefreshing);
      setIsRefreshing(showRefreshing);

      const nextRequests = await getPromotionRequests();
      setRequests(nextRequests);
      setSelectedRequestId((currentId) =>
        currentId && nextRequests.some((request) => request.requestId === currentId)
          ? currentId
          : (nextRequests[0]?.requestId ?? null),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "승격 신청 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRequests]);

  useEffect(() => {
    let isCancelled = false;

    if (!selectedRequest) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPosts([]);
      setPostsError(null);
      setIsLoadingPosts(true);

      void getApplicantPosts(selectedRequest.userId)
        .then((nextPosts) => {
          if (!isCancelled) {
            setPosts(nextPosts);
          }
        })
        .catch((loadError: unknown) => {
          if (!isCancelled) {
            setPostsError(
              loadError instanceof Error
                ? loadError.message
                : "신청자 게시물을 불러오지 못했습니다.",
            );
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingPosts(false);
          }
        });
    }, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [selectedRequest]);

  async function handleReviewAction() {
    if (!pendingAction || !selectedRequest || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (pendingAction === "approve") {
        await approvePromotion(selectedRequest.requestId);
      } else {
        await rejectPromotion(selectedRequest.requestId);
      }

      const successMessage =
        pendingAction === "approve"
          ? `${selectedRequest.nickname}님의 승격을 승인했습니다.`
          : `${selectedRequest.nickname}님의 승격 신청을 거절했습니다.`;
      setPendingAction(null);
      await loadRequests(true);
      setToast({ message: successMessage, type: "success" });
    } catch (actionError) {
      setToast({
        message:
          actionError instanceof Error
            ? actionError.message
            : "승격 신청 처리에 실패했습니다.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">승격 신청</h1>
          <p className="mt-2 text-sm text-zinc-500">
            신청자의 활동 성적과 게시물을 검토한 뒤 크리에이터 승격을 결정합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadRequests(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {postsError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
          {postsError}
        </div>
      ) : null}

      {isLoading ? (
        <PromotionPageSkeleton />
      ) : requests.length === 0 ? (
        <div className="rounded-[28px] border border-zinc-200 bg-white px-6 py-20 text-center">
          <p className="text-base font-semibold text-zinc-800">대기 중인 승격 신청이 없습니다.</p>
          <p className="mt-2 text-sm text-zinc-500">새 신청이 접수되면 이곳에 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-3 xl:sticky xl:top-8">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-zinc-800">대기 목록</h2>
              <span className="text-sm font-semibold text-zinc-500">{requests.length}건</span>
            </div>
            {requests.map((request) => (
              <PromotionRequestCard
                key={request.requestId}
                request={request}
                isSelected={request.requestId === selectedRequestId}
                onSelect={() => setSelectedRequestId(request.requestId)}
              />
            ))}
          </aside>

          <PromotionReviewPanel
            request={selectedRequest}
            posts={posts}
            isLoadingPosts={isLoadingPosts}
            isSubmitting={isSubmitting}
            onOpenMedia={setSelectedMedia}
            onReject={() => setPendingAction("reject")}
            onApprove={() => setPendingAction("approve")}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingAction !== null}
        confirmTone={pendingAction === "approve" ? "primary" : "danger"}
        title={pendingAction === "approve" ? "승격을 승인하시겠습니까?" : "신청을 거절하시겠습니까?"}
        description={
          pendingAction === "approve"
            ? "승인 즉시 크리에이터 기능과 배지가 활성화되고 신청자에게 알림이 전송됩니다."
            : "거절 즉시 신청자에게 알림이 전송되며 7일 뒤 다시 신청할 수 있습니다."
        }
        confirmLabel={pendingAction === "approve" ? "승인" : "거절"}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          void handleReviewAction();
        }}
      />

      <PromotionMediaLightbox media={selectedMedia} onClose={() => setSelectedMedia(null)} />

      <Toast
        isVisible={toast !== null}
        message={toast?.message ?? ""}
        type={toast?.type}
        onHide={() => setToast(null)}
      />
    </div>
  );
}

function PromotionPageSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
      <div className="min-h-[640px] animate-pulse rounded-[28px] bg-white" />
    </div>
  );
}
