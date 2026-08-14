"use client";

import { CalendarDays, ExternalLink, Play, Video } from "lucide-react";
import Link from "next/link";

import type {
  AdminApplicantMedia,
  AdminApplicantPost,
  AdminPromotionRequest,
} from "@/features/admin/api";

type PromotionReviewPanelProps = {
  isLoadingPosts: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onOpenMedia: (media: AdminApplicantMedia) => void;
  onReject: () => void;
  posts: AdminApplicantPost[];
  request: AdminPromotionRequest | null;
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function PromotionReviewPanel({
  isLoadingPosts,
  isSubmitting,
  onApprove,
  onOpenMedia,
  onReject,
  posts,
  request,
}: PromotionReviewPanelProps) {
  if (!request) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-[28px] border border-zinc-200 bg-white px-6 text-center text-sm font-medium text-zinc-500">
        심사할 신청을 선택하세요.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-zinc-950">{request.nickname}</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                심사 대기
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {request.department ?? "학과 미입력"}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> 가입 {formatDate(request.userCreatedAt)}
              </span>
              <span>신청 {formatDate(request.createdAt)}</span>
            </div>
          </div>

          <Link
            href={`/profile/${encodeURIComponent(request.nickname)}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            프로필 원본
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <h3 className="text-base font-bold text-zinc-950">활동 성적표</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="전체 게시물" value={numberFormatter.format(request.postsCount)} />
          <Stat label="최근 30일" value={numberFormatter.format(request.posts30d)} />
          <Stat label="조회" value={numberFormatter.format(request.views)} />
          <Stat label="도달" value={numberFormatter.format(request.reach)} />
          <Stat label="참여" value={numberFormatter.format(request.engagement)} />
          <Stat label="참여율" value={`${request.engagementRate.toFixed(2)}%`} />
          <Stat label="영상" value={`${numberFormatter.format(request.videoCount)}개`} />
          <Stat label="평균 완주율" value={`${request.avgCompletion.toFixed(1)}%`} />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-950">게시물 검토</h3>
            <p className="mt-1 text-sm text-zinc-500">
              현재 관리자에게 보이는 게시물과 미디어입니다.
            </p>
          </div>
          <span className="text-sm font-semibold text-zinc-500">{posts.length}개</span>
        </div>

        {isLoadingPosts ? (
          <PostGridSkeleton />
        ) : posts.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-zinc-50 px-5 py-14 text-center text-sm font-medium text-zinc-500">
            조회 가능한 게시물이 없습니다.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => {
              const media = post.media[0] ?? null;
              const previewUrl =
                media?.type === "video" ? media.thumbnailUrl : media?.url;

              return (
                <button
                  key={post.id}
                  type="button"
                  disabled={!media}
                  onClick={() => {
                    if (media) {
                      onOpenMedia(media);
                    }
                  }}
                  className="group overflow-hidden rounded-2xl bg-zinc-100 text-left disabled:cursor-default"
                >
                  <div className="relative aspect-square overflow-hidden bg-zinc-200">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">
                        {media?.type === "video" ? (
                          <Video className="h-7 w-7" />
                        ) : (
                          <span className="text-xs font-medium">미디어 없음</span>
                        )}
                      </div>
                    )}
                    {media?.type === "video" ? (
                      <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    ) : null}
                    {post.media.length > 1 ? (
                      <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-white">
                        {post.media.length}장
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-xs text-zinc-600">
                      {post.content?.trim() || "내용 없음"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{formatDate(post.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-5 lg:px-8">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onReject}
          className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          거절
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onApprove}
          className="rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {isSubmitting ? "처리 중" : "승인"}
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function PostGridSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="aspect-square animate-pulse rounded-2xl bg-zinc-100" />
      ))}
    </div>
  );
}
