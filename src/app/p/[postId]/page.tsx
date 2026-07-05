import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicPostPreview } from "@/features/public-posts/api";
import { SITE_URL } from "@/lib/site";

type PublicPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

function getOgImage(post: Awaited<ReturnType<typeof getPublicPostPreview>>) {
  const firstMedia = post?.media[0] ?? null;

  if (!firstMedia) {
    return null;
  }

  if (firstMedia.type === "video") {
    return firstMedia.thumbnail_url;
  }

  return firstMedia.url;
}

function getDescription(content: string | null) {
  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    return "UNIVER에서 공유된 게시물입니다.";
  }

  return trimmedContent.length > 140
    ? `${trimmedContent.slice(0, 140)}…`
    : trimmedContent;
}

function getRelativeTimeLabel(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const diffMs = Date.now() - createdTime;
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}분 전`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}시간 전`;
  }

  const days = Math.max(1, Math.floor(diffMs / dayMs));
  return `${days}일 전`;
}

export async function generateMetadata({
  params,
}: PublicPostPageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPublicPostPreview(postId);

  if (!post) {
    return {
      metadataBase: new URL(SITE_URL),
      title: "게시물을 볼 수 없습니다 | UNIVER",
    };
  }

  const description = getDescription(post.content);
  const image = getOgImage(post);
  const url = `/p/${post.id}`;

  return {
    description,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      description,
      images: image ? [{ url: image }] : undefined,
      title: `${post.user.nickname}님의 게시물`,
      type: "article",
      url,
    },
    title: `${post.user.nickname}님의 게시물 | UNIVER`,
    twitter: {
      card: image ? "summary_large_image" : "summary",
      description,
      images: image ? [image] : undefined,
      title: `${post.user.nickname}님의 게시물`,
    },
  };
}

export default async function PublicPostPage({ params }: PublicPostPageProps) {
  const { postId } = await params;
  const post = await getPublicPostPreview(postId);

  if (!post) {
    notFound();
  }

  const firstMedia = post.media[0] ?? null;
  const previewImage =
    firstMedia?.type === "video" ? firstMedia.thumbnail_url : firstMedia?.url;

  return (
    <main className="min-h-dvh bg-[#eee9fb] px-4 py-6 text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col justify-center">
        <article className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_18px_50px_rgba(46,31,85,0.14)]">
          <header className="flex items-center gap-3 px-4 py-4">
            {post.user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${post.user.nickname} 프로필 이미지`}
                className="h-11 w-11 rounded-full object-cover"
                src={post.user.avatar_url}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-sm font-black text-zinc-500">
                {post.user.nickname.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-black">
                {post.user.nickname}
              </p>
              <p className="truncate text-sm font-bold text-zinc-400">
                {post.user.department} · {getRelativeTimeLabel(post.created_at)}
              </p>
            </div>
          </header>

          {previewImage ? (
            <div className="relative aspect-[4/5] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`${post.user.nickname} 게시물 미리보기`}
                className="h-full w-full object-cover"
                src={previewImage}
              />
              {firstMedia?.type === "video" ? (
                <div className="absolute left-1/2 top-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-black text-white -translate-x-1/2 -translate-y-1/2">
                  영상
                </div>
              ) : null}
            </div>
          ) : null}

          <section className="px-4 py-4">
            <div className="flex items-center gap-4 text-sm font-black">
              <span>좋아요 {post.likes_count}</span>
              <span>댓글 {post.comments_count}</span>
            </div>
            {post.content ? (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                <span className="font-black">{post.user.nickname} </span>
                {post.content}
              </p>
            ) : null}
          </section>
        </article>

        <div className="mt-4 rounded-3xl bg-white/85 px-5 py-5 text-center shadow-sm">
          <p className="text-lg font-black text-[#7c3aed]">UNIVER</p>
          <p className="mt-1 text-sm font-bold text-zinc-500">
            대학생 실명 SNS에서 게시물을 확인해보세요.
          </p>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#7c3aed] px-5 py-3 text-sm font-black text-white"
            href={`/auth/login?redirectTo=/posts/${post.id}`}
          >
            UNIVER에서 보기
          </Link>
        </div>
      </div>
    </main>
  );
}

