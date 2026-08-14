import type {
  AdminApplicantPost,
  AdminPostComment,
  AdminPostInsight,
} from "@/features/admin/api";

type PromotionPostDetailSidebarProps = {
  comments: AdminPostComment[];
  error: string | null;
  insight: AdminPostInsight | null;
  isLoading: boolean;
  post: AdminApplicantPost;
};

const numberFormatter = new Intl.NumberFormat("ko-KR");
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export function PromotionPostDetailSidebar({
  comments,
  error,
  insight,
  isLoading,
  post,
}: PromotionPostDetailSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col bg-white">
      <header className="shrink-0 border-b border-zinc-200 px-5 py-4 pr-16">
        <p className="text-xs font-medium text-zinc-500">
          {dateTimeFormatter.format(new Date(post.createdAt))}
        </p>
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
          {post.content?.trim() || "내용 없음"}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="m-5 rounded-2xl bg-red-50 px-4 py-5 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : insight ? (
          <>
            <section className="border-b border-zinc-200 p-5">
              <h3 className="text-sm font-bold text-zinc-950">게시물 지표</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat label="조회" value={insight.views} />
                <Stat label="도달" value={insight.reach} />
                <Stat label="좋아요" value={insight.likes} />
                <Stat label="댓글" value={insight.comments} />
                <Stat label="저장" value={insight.saves} />
                <Stat label="공유" value={insight.shares} />
              </div>

              {insight.isVideo ? (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-violet-50 p-4">
                  <MetricPercent
                    label="완주율"
                    value={insight.completionRate}
                  />
                  <MetricPercent
                    label="평균 시청깊이"
                    value={insight.avgDepth}
                  />
                </div>
              ) : null}
            </section>

            <section className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-zinc-950">댓글</h3>
                <span className="text-xs font-semibold text-zinc-500">
                  {numberFormatter.format(comments.length)}개
                </span>
              </div>

              {comments.length === 0 ? (
                <p className="py-12 text-center text-sm font-medium text-zinc-400">
                  등록된 댓글이 없습니다.
                </p>
              ) : (
                <div className="mt-4 space-y-5">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-3">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-950">
        {numberFormatter.format(value)}
      </p>
    </div>
  );
}

function MetricPercent({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-violet-600">{label}</p>
      <p className="mt-1 text-base font-bold text-violet-950">
        {value === null ? "데이터 없음" : `${value.toFixed(1)}%`}
      </p>
    </div>
  );
}

function CommentItem({ comment }: { comment: AdminPostComment }) {
  return (
    <article className={`flex gap-3 ${comment.parentId ? "ml-6" : ""}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
        {comment.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          comment.nickname.slice(0, 1)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-bold text-zinc-900">
            {comment.nickname}
          </span>
          <time className="text-[11px] text-zinc-400">
            {dateTimeFormatter.format(new Date(comment.createdAt))}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-700">
          {comment.content}
        </p>
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 p-5">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-zinc-100"
          />
        ))}
      </div>
      <div className="h-px bg-zinc-100" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
