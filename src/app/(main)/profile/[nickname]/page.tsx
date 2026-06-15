"use client";

import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { ExternalLink, Settings } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { KrewSurface } from "@/components/common/KrewLayout";
import { getCurrentUserProfile } from "@/features/auth/api";
import {
  getFavoriteUserStatus,
  toggleUserFavorite,
} from "@/features/activity/api";
import { getOrCreateConversation } from "@/features/chat/api";
import {
  acceptFriendRequest,
  getConnectionStatus,
  getProfileLinks,
  getPostsCount,
  getProfile,
  getProfilePosts,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  type ConnectionStatus,
  type Profile,
  type ProfilePost,
} from "@/features/profile/api";
import {
  getProfilePageCache,
  setProfilePageCache,
} from "@/features/profile/page-cache";

type ProfilePageState = {
  connectionStatus: ConnectionStatus;
  currentUserId: string | null;
  isFavorite: boolean;
  posts: ProfilePost[];
  postsCount: number;
  profile: Profile | null;
};

function ProfileSkeleton() {
  return (
    <div className="animate-pulse bg-background px-4 py-4">
      <section className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[var(--krew-card-shadow)]">
        <div className="flex gap-5">
          <div className="h-20 w-20 shrink-0 rounded-full bg-zinc-100" />
          <div className="flex flex-1 flex-col justify-center">
            <div className="h-5 w-32 rounded-full bg-zinc-100" />
            <div className="mt-3 h-4 w-24 rounded-full bg-zinc-100" />
            <div className="mt-5 h-8 w-28 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </section>
      <div className="mt-6 h-4 w-3/4 rounded-full bg-zinc-100" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="aspect-square rounded-2xl bg-white/70" />
        ))}
      </div>
    </div>
  );
}

function ProfileHeader({
  connectionStatus,
  isMine,
  onEditProfile,
  onOpenConnections,
  onOpenConnectionMenu,
  onOpenSettings,
  onSendMessage,
  onRejectFriendRequest,
  onRespondFriendRequest,
  onSendFriendRequest,
  onWithdrawFriendRequest,
  postsCount,
  profile,
}: {
  connectionStatus: ConnectionStatus;
  isMine: boolean;
  onEditProfile: () => void;
  onOpenConnections: () => void;
  onOpenConnectionMenu: () => void;
  onOpenSettings: () => void;
  onSendMessage: () => void;
  onRejectFriendRequest: () => void;
  onRespondFriendRequest: () => void;
  onSendFriendRequest: () => void;
  onWithdrawFriendRequest: () => void;
  postsCount: number;
  profile: Profile;
}) {
  function renderConnectionActions() {
    if (isMine) {
      return (
        <button
          type="button"
          onClick={onEditProfile}
          className="h-10 min-w-32 cursor-pointer rounded-2xl bg-white px-5 text-sm font-extrabold text-foreground shadow-sm transition hover:text-krew-accent"
        >
          프로필 편집
        </button>
      );
    }

    if (connectionStatus.status === "none" || connectionStatus.status === "rejected") {
      return (
        <button
          type="button"
          onClick={onSendFriendRequest}
          className="h-10 min-w-32 rounded-2xl bg-krew-accent px-5 text-sm font-extrabold text-white"
        >
          친구 신청
        </button>
      );
    }

    if (connectionStatus.status === "pending" && connectionStatus.is_requester) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="h-10 min-w-24 rounded-2xl bg-white px-4 text-sm font-extrabold text-krew-muted"
          >
            요청됨
          </button>
          <button
            type="button"
            onClick={onWithdrawFriendRequest}
            className="h-10 min-w-20 rounded-2xl border border-krew-border bg-white px-4 text-sm font-extrabold text-krew-muted"
          >
            취소
          </button>
        </div>
      );
    }

    if (connectionStatus.status === "pending") {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRespondFriendRequest}
            className="h-10 min-w-20 rounded-2xl bg-krew-accent px-4 text-sm font-extrabold text-white"
          >
            수락
          </button>
          <button
            type="button"
            onClick={onRejectFriendRequest}
            className="h-10 min-w-20 rounded-2xl border border-krew-border bg-white px-4 text-sm font-extrabold text-krew-muted"
          >
            거절
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <button
          type="button"
          className="h-10 min-w-24 rounded-2xl bg-krew-accent-soft px-4 text-sm font-extrabold text-krew-accent"
        >
          친구 ✓
        </button>
        <button
          type="button"
          onClick={onOpenConnectionMenu}
          className="h-10 w-10 rounded-2xl border border-krew-border bg-white text-sm font-extrabold text-krew-muted"
          aria-label="친구 옵션"
        >
          ⋯
        </button>
      </div>
    );
  }

  return (
    <KrewSurface className="mx-4 mt-4 p-4">
      <div className="flex gap-5">
        <Avatar
          src={profile.avatar_url}
          nickname={profile.nickname}
          size="xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-[-0.02em] text-foreground">
                {profile.nickname}
              </h1>
              {profile.real_name ? (
                <p className="mt-1 truncate text-xs font-semibold text-krew-faint">
                  {profile.real_name}
                </p>
              ) : null}
              <p className="mt-1 truncate text-sm font-semibold text-krew-muted">
                {profile.department}
              </p>
              {profile.profile_links[0] ? (
                <a
                  href={profile.profile_links[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-krew-border bg-white px-3 py-1.5 text-xs font-extrabold text-foreground transition hover:text-krew-accent"
                >
                  <span className="truncate">
                    {profile.profile_links[0].label}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-start justify-end gap-3">
                <div>
                  <p className="text-lg font-black text-foreground">{postsCount}</p>
                  <p className="text-xs font-semibold text-krew-muted">게시물</p>
                </div>
                {isMine ? (
                  <button
                    type="button"
                    onClick={onOpenConnections}
                    className="text-center"
                  >
                    <span className="block text-lg font-black text-foreground">
                      {connectionStatus.friends_count}
                    </span>
                    <span className="block text-xs font-semibold text-krew-muted">
                      크루
                    </span>
                  </button>
                ) : (
                  <div>
                    <p className="text-lg font-black text-foreground">
                      {connectionStatus.friends_count}
                    </p>
                    <p className="text-xs font-semibold text-krew-muted">크루</p>
                  </div>
                )}
                {isMine ? (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm transition hover:text-krew-accent"
                    aria-label="설정"
                  >
                    <Settings className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4">
            {renderConnectionActions()}
            {!isMine ? (
              <button
                type="button"
                onClick={onSendMessage}
                className="mt-2 h-10 min-w-32 rounded-2xl bg-krew-accent px-5 text-sm font-extrabold text-white"
              >
                메시지 보내기
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-5 whitespace-pre-wrap text-sm font-medium leading-6 text-foreground">
          {profile.bio}
        </p>
      ) : null}
    </KrewSurface>
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
      <section className="mx-4 flex min-h-56 items-center justify-center rounded-[22px] border border-white/70 bg-white/70 px-6 shadow-[var(--krew-card-shadow)]">
        <p className="text-sm font-semibold text-krew-muted">
          아직 게시물이 없습니다
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-3 gap-2 px-4 pb-6">
      {posts.map((post) => {
        const thumbnail = post.images[0];

        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onPostClick(post.id)}
            className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 shadow-[0_10px_22px_rgba(66,43,102,0.08)]"
          >
            {thumbnail ? (
              <Image
                src={thumbnail.url}
                alt="게시물 썸네일"
                fill
                sizes="(max-width: 640px) 33vw, 160px"
                className="object-cover"
              />
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
  const requestedNickname = decodeURIComponent(params.nickname);
  const [state, setState] = useState<ProfilePageState>(() => {
    const cachedProfilePage = getProfilePageCache(requestedNickname);

    if (cachedProfilePage) {
      return {
        connectionStatus: cachedProfilePage.connectionStatus,
        currentUserId: cachedProfilePage.currentUserId,
        isFavorite: cachedProfilePage.isFavorite,
        posts: cachedProfilePage.posts,
        postsCount: cachedProfilePage.postsCount,
        profile: cachedProfilePage.profile,
      };
    }

    return {
      connectionStatus: {
        friends_count: 0,
        is_requester: false,
        status: "none",
      },
      currentUserId: null,
      isFavorite: false,
      posts: [],
      postsCount: 0,
      profile: null,
    };
  });
  const [isLoading, setIsLoading] = useState(
    () => getProfilePageCache(requestedNickname) === null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isConnectionMenuOpen, setIsConnectionMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const cachedProfilePage = getProfilePageCache(requestedNickname);

      if (cachedProfilePage) {
        setState({
          connectionStatus: cachedProfilePage.connectionStatus,
          currentUserId: cachedProfilePage.currentUserId,
          isFavorite: cachedProfilePage.isFavorite,
          posts: cachedProfilePage.posts,
          postsCount: cachedProfilePage.postsCount,
          profile: cachedProfilePage.profile,
        });
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

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
                profile_links: await getProfileLinks(currentUser.id),
                real_name: currentUser.real_name,
                university_id: currentUser.university_id,
              }
            : await getProfile(profileNickname);

        const isMine = currentUser?.id === loadedProfile.id;

        if (!isMounted) {
          return;
        }

        setState({
          connectionStatus: {
            friends_count: 0,
            is_requester: false,
            status: "none",
          },
          currentUserId: currentUser?.id ?? null,
          isFavorite: false,
          posts: [],
          postsCount: 0,
          profile: loadedProfile,
        });
        setIsLoading(false);

        if (requestedNickname === "me") {
          router.replace(`/profile/${encodeURIComponent(profileNickname)}`);
        }

        const [
          loadedPosts,
          loadedPostsCount,
          connectionStatus,
          isFavorite,
        ] = await Promise.all([
          getProfilePosts(loadedProfile.id),
          getPostsCount(loadedProfile.id),
          getConnectionStatus(loadedProfile.id),
          isMine ? Promise.resolve(false) : getFavoriteUserStatus(loadedProfile.id),
        ]);

        if (!isMounted) {
          return;
        }

        const nextState = {
          connectionStatus,
          currentUserId: currentUser?.id ?? null,
          isFavorite,
          posts: loadedPosts,
          postsCount: loadedPostsCount,
          profile: loadedProfile,
        };

        setState(nextState);
        setProfilePageCache(profileNickname, nextState);
        setProfilePageCache(requestedNickname, nextState);
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
  }, [requestedNickname, router]);

  useEffect(() => {
    if (isLoading || !state.profile) {
      return;
    }

    const cacheValue = {
      connectionStatus: state.connectionStatus,
      currentUserId: state.currentUserId,
      isFavorite: state.isFavorite,
      posts: state.posts,
      postsCount: state.postsCount,
      profile: state.profile,
    };

    setProfilePageCache(state.profile.nickname, cacheValue);
    setProfilePageCache(requestedNickname, cacheValue);
  }, [isLoading, requestedNickname, state]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !state.profile) {
    return (
      <section className="flex min-h-80 items-center justify-center bg-background px-6 text-center">
        <p className="text-sm font-semibold text-krew-muted">
          {error ?? "프로필을 찾을 수 없습니다."}
        </p>
      </section>
    );
  }

  async function handleSendFriendRequest() {
    if (!state.profile || state.currentUserId === state.profile.id) {
      return;
    }

    const previousConnectionStatus = state.connectionStatus;

    setState((currentState) => ({
      ...currentState,
      connectionStatus: {
        ...currentState.connectionStatus,
        is_requester: true,
        status: "pending",
      },
    }));

    try {
      await sendFriendRequest(state.profile.id);
    } catch {
      setState((currentState) => ({
        ...currentState,
        connectionStatus: previousConnectionStatus,
      }));
    }
  }

  async function handleAcceptFriendRequest() {
    if (!state.profile) {
      return;
    }

    const previousConnectionStatus = state.connectionStatus;

    setState((currentState) => ({
      ...currentState,
      connectionStatus: {
        friends_count: currentState.connectionStatus.friends_count + 1,
        is_requester: false,
        status: "accepted",
      },
    }));

    try {
      await acceptFriendRequest(state.profile.id);
    } catch {
      setState((currentState) => ({
        ...currentState,
        connectionStatus: previousConnectionStatus,
      }));
    }
  }

  async function handleRejectFriendRequest() {
    if (!state.profile) {
      return;
    }

    const previousConnectionStatus = state.connectionStatus;

    setState((currentState) => ({
      ...currentState,
      connectionStatus: {
        ...currentState.connectionStatus,
        is_requester: false,
        status: "none",
      },
    }));

    try {
      await rejectFriendRequest(state.profile.id);
    } catch {
      setState((currentState) => ({
        ...currentState,
        connectionStatus: previousConnectionStatus,
      }));
    }
  }

  async function handleRemoveFriend() {
    if (!state.profile) {
      return;
    }

    const previousConnectionStatus = state.connectionStatus;

    setState((currentState) => ({
      ...currentState,
      connectionStatus: {
        friends_count: Math.max(0, currentState.connectionStatus.friends_count - 1),
        is_requester: false,
        status: "none",
      },
    }));

    try {
      await removeFriend(state.profile.id);
    } catch {
      setState((currentState) => ({
        ...currentState,
        connectionStatus: previousConnectionStatus,
      }));
    }
  }

  async function handleToggleFavorite() {
    if (!state.profile || state.currentUserId === state.profile.id) {
      return;
    }

    const previousIsFavorite = state.isFavorite;

    setState((currentState) => ({
      ...currentState,
      isFavorite: !currentState.isFavorite,
    }));

    try {
      const result = await toggleUserFavorite(state.profile.id);

      setState((currentState) => ({
        ...currentState,
        isFavorite: result.favorited,
      }));
    } catch {
      setState((currentState) => ({
        ...currentState,
        isFavorite: previousIsFavorite,
      }));
    }
  }

  async function handleSendMessage() {
    if (!state.profile || state.currentUserId === state.profile.id) {
      return;
    }

    const conversationId = await getOrCreateConversation(state.profile.id);
    router.push(`/messages/${conversationId}`);
  }

  const connectionMenuItems: ActionSheetItem[] = [
    {
      label: state.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가",
      onClick: () => {
        void handleToggleFavorite();
      },
    },
    {
      danger: true,
      label: "친구 삭제",
      onClick: () => {
        void handleRemoveFriend();
      },
    },
    {
      label: "취소",
      onClick: () => {},
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ProfileHeader
        connectionStatus={state.connectionStatus}
        isMine={state.currentUserId === state.profile.id}
        onEditProfile={() => router.push("/profile/edit")}
        onOpenConnections={() => router.push("/profile/connections")}
        onOpenConnectionMenu={() => {
          setIsConnectionMenuOpen(true);
        }}
        onOpenSettings={() => router.push("/settings")}
        onSendMessage={() => {
          void handleSendMessage();
        }}
        onRejectFriendRequest={() => {
          void handleRejectFriendRequest();
        }}
        onRespondFriendRequest={() => {
          void handleAcceptFriendRequest();
        }}
        onSendFriendRequest={() => {
          void handleSendFriendRequest();
        }}
        onWithdrawFriendRequest={() => {
          void handleRemoveFriend();
        }}
        postsCount={state.postsCount}
        profile={state.profile}
      />
      <div className="relative left-1/2 mt-4 w-screen -translate-x-1/2 lg:w-[calc(100vw-36rem)] lg:max-w-[832px] xl:w-[calc(100vw-38rem)]">
        <section className="mx-4 mb-3 rounded-[20px] border border-white/70 bg-white/70">
          <div className="mx-auto flex h-11 w-full items-center justify-around">
            <button
              type="button"
              className="flex h-full w-24 items-center justify-center text-krew-accent"
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
      <ActionSheet
        isOpen={isConnectionMenuOpen}
        items={connectionMenuItems}
        onClose={() => {
          setIsConnectionMenuOpen(false);
        }}
      />
    </div>
  );
}
