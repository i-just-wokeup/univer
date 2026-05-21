"use client";

import { Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { HeartIcon } from "@/components/feed/PostCard";
import { getCurrentUserProfile } from "@/features/auth/api";
import {
  getUserLikeStatus,
  getPostsCount,
  getProfile,
  getProfilePosts,
  toggleUserLike,
  type Profile,
  type ProfilePost,
} from "@/features/profile/api";

type ProfilePageState = {
  currentUserId: string | null;
  isLiked: boolean;
  likesCount: number;
  posts: ProfilePost[];
  postsCount: number;
  profile: Profile | null;
};

function ProfileSkeleton() {
  return (
    <div className="animate-pulse px-4 py-6">
      <section className="flex gap-5">
        <div className="h-20 w-20 shrink-0 rounded-full bg-zinc-100" />
        <div className="flex flex-1 flex-col justify-center">
          <div className="h-5 w-32 rounded-full bg-zinc-100" />
          <div className="mt-3 h-4 w-24 rounded-full bg-zinc-100" />
          <div className="mt-5 h-8 w-28 rounded-2xl bg-zinc-100" />
        </div>
      </section>
      <div className="mt-6 h-4 w-3/4 rounded-full bg-zinc-100" />
      <div className="mt-8 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="aspect-square bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}

function ProfileHeader({
  isMine,
  isLiked,
  likesCount,
  onEditProfile,
  onOpenSettings,
  onToggleLike,
  postsCount,
  profile,
}: {
  isMine: boolean;
  isLiked: boolean;
  likesCount: number;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onToggleLike: () => void;
  postsCount: number;
  profile: Profile;
}) {
  return (
    <section className="px-4 py-6">
      <div className="flex gap-5">
        <Avatar
          src={profile.avatar_url}
          nickname={profile.nickname}
          size="xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-zinc-950">
                {profile.nickname}
              </h1>
              <p className="mt-1 truncate text-sm font-medium text-zinc-500">
                {profile.department}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-start justify-end gap-3">
                <div>
                  <p className="text-lg font-bold text-zinc-950">{postsCount}</p>
                  <p className="text-xs font-medium text-zinc-500">게시물</p>
                </div>
                {isMine ? (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700"
                    aria-label="설정"
                  >
                    <Settings className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 h-9">
            {isMine ? (
              <button
                type="button"
                onClick={onEditProfile}
                className="h-9 min-w-32 cursor-pointer rounded-lg bg-zinc-100 px-5 text-sm font-bold text-zinc-950"
              >
                프로필 편집
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleLike}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-bold transition ${
                  isLiked
                    ? "text-red-500 hover:text-red-600"
                    : "text-zinc-700 hover:text-zinc-950"
                }`}
                aria-label="유저 좋아요"
              >
                <HeartIcon isLiked={isLiked} />
                <span>{likesCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
          {profile.bio}
        </p>
      ) : null}
    </section>
  );
}

function PostsGrid({
  onPostClick,
  posts,
}: {
  onPostClick: (postId: string) => void;
  posts: ProfilePost[];
}) {
  if (posts.length === 0) {
    return (
      <section className="flex min-h-56 items-center justify-center px-6">
        <p className="text-sm font-medium text-zinc-500">
          아직 게시물이 없습니다
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-3 gap-px bg-white">
      {posts.map((post) => {
        const thumbnail = post.images[0];

        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onPostClick(post.id)}
            className="aspect-square bg-zinc-100"
          >
            {thumbnail ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail.url}
                  alt="게시물 썸네일"
                  className="h-full w-full object-cover"
                />
              </>
            ) : (
              <div className="h-full w-full bg-zinc-100" />
            )}
          </button>
        );
      })}
    </section>
  );
}

export default function ProfilePage() {
  const params = useParams<{ nickname: string }>();
  const router = useRouter();
  const [state, setState] = useState<ProfilePageState>({
    currentUserId: null,
    isLiked: false,
    likesCount: 0,
    posts: [],
    postsCount: 0,
    profile: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError(null);

        const requestedNickname = decodeURIComponent(params.nickname);
        const currentUser = await getCurrentUserProfile();
        const profileNickname =
          requestedNickname === "me" ? currentUser?.nickname : requestedNickname;

        if (!profileNickname) {
          throw new Error("프로필을 찾을 수 없습니다.");
        }

        const loadedProfile: Profile =
          requestedNickname === "me" && currentUser
            ? {
                avatar_url: currentUser.avatar_url,
                bio: currentUser.bio,
                created_at: currentUser.created_at,
                department: currentUser.department,
                id: currentUser.id,
                nickname: currentUser.nickname,
                real_name: currentUser.real_name,
                university_id: currentUser.university_id,
              }
            : await getProfile(profileNickname);

        const isMine = currentUser?.id === loadedProfile.id;
        const [loadedPosts, loadedPostsCount, likeStatus] = await Promise.all([
          getProfilePosts(loadedProfile.id),
          getPostsCount(loadedProfile.id),
          isMine
            ? Promise.resolve({ is_liked: false, likes_count: 0 })
            : getUserLikeStatus(loadedProfile.id),
        ]);

        if (!isMounted) {
          return;
        }

        if (requestedNickname === "me") {
          router.replace(`/profile/${encodeURIComponent(profileNickname)}`);
        }

        setState({
          currentUserId: currentUser?.id ?? null,
          isLiked: likeStatus.is_liked,
          likesCount: likeStatus.likes_count,
          posts: loadedPosts,
          postsCount: loadedPostsCount,
          profile: loadedProfile,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "프로필을 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [params.nickname, router]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !state.profile) {
    return (
      <section className="flex min-h-80 items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-zinc-500">
          {error ?? "프로필을 찾을 수 없습니다."}
        </p>
      </section>
    );
  }

  async function handleToggleLike() {
    if (!state.profile || state.currentUserId === state.profile.id) {
      return;
    }

    const previousIsLiked = state.isLiked;
    const previousLikesCount = state.likesCount;
    const nextIsLiked = !previousIsLiked;
    const nextLikesCount = Math.max(
      0,
      previousLikesCount + (nextIsLiked ? 1 : -1),
    );

    setState((currentState) => ({
      ...currentState,
      isLiked: nextIsLiked,
      likesCount: nextLikesCount,
    }));

    try {
      await toggleUserLike(state.profile.id);
    } catch {
      setState((currentState) => ({
        ...currentState,
        isLiked: previousIsLiked,
        likesCount: previousLikesCount,
      }));
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <ProfileHeader
        isMine={state.currentUserId === state.profile.id}
        isLiked={state.isLiked}
        likesCount={state.likesCount}
        onEditProfile={() => router.push("/profile/edit")}
        onOpenSettings={() => router.push("/settings")}
        onToggleLike={() => {
          void handleToggleLike();
        }}
        postsCount={state.postsCount}
        profile={state.profile}
      />
      <div className="relative left-1/2 w-screen -translate-x-1/2 lg:w-[calc(100vw-36rem)] lg:max-w-[832px] xl:w-[calc(100vw-38rem)]">
        <section className="border-y border-zinc-200">
          <div className="mx-auto flex h-11 w-full items-center justify-around">
            <button
              type="button"
              className="flex h-full w-24 items-center justify-center border-b-2 border-zinc-950 text-zinc-950"
              aria-label="게시물 그리드"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 5h4v4H5V5Zm5 0h4v4h-4V5Zm5 0h4v4h-4V5ZM5 10h4v4H5v-4Zm5 0h4v4h-4v-4Zm5 0h4v4h-4v-4ZM5 15h4v4H5v-4Zm5 0h4v4h-4v-4Zm5 0h4v4h-4v-4Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
          </div>
        </section>
        <PostsGrid
          posts={state.posts}
          onPostClick={(postId) => router.push(`/posts/${postId}`)}
        />
      </div>
    </div>
  );
}
