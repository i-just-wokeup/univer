"use client";

import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { ExternalLink, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
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
          className="h-9 min-w-32 cursor-pointer rounded-lg bg-zinc-100 px-5 text-sm font-bold text-zinc-950"
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
          className="h-9 min-w-32 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white"
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
            className="h-9 min-w-24 rounded-lg bg-zinc-100 px-4 text-sm font-bold text-zinc-500"
          >
            요청됨
          </button>
          <button
            type="button"
            onClick={onWithdrawFriendRequest}
            className="h-9 min-w-20 rounded-lg border border-zinc-200 px-4 text-sm font-bold text-zinc-700"
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
            className="h-9 min-w-20 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white"
          >
            수락
          </button>
          <button
            type="button"
            onClick={onRejectFriendRequest}
            className="h-9 min-w-20 rounded-lg border border-zinc-200 px-4 text-sm font-bold text-zinc-700"
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
          className="h-9 min-w-24 rounded-lg bg-zinc-100 px-4 text-sm font-bold text-zinc-950"
        >
          친구 ✓
        </button>
        <button
          type="button"
          onClick={onOpenConnectionMenu}
          className="h-9 w-9 rounded-lg border border-zinc-200 text-sm font-bold text-zinc-700"
          aria-label="친구 옵션"
        >
          ⋯
        </button>
      </div>
    );
  }

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
              {profile.real_name ? (
                <p className="mt-1 truncate text-xs font-semibold text-zinc-400">
                  {profile.real_name}
                </p>
              ) : null}
              <p className="mt-1 truncate text-sm font-medium text-zinc-500">
                {profile.department}
              </p>
              {profile.profile_links[0] ? (
                <a
                  href={profile.profile_links[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-blue-600"
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
                  <p className="text-lg font-bold text-zinc-950">{postsCount}</p>
                  <p className="text-xs font-medium text-zinc-500">게시물</p>
                </div>
                {isMine ? (
                  <button
                    type="button"
                    onClick={onOpenConnections}
                    className="text-center"
                  >
                    <span className="block text-lg font-bold text-zinc-950">
                      {connectionStatus.friends_count}
                    </span>
                    <span className="block text-xs font-medium text-zinc-500">
                      크루
                    </span>
                  </button>
                ) : (
                  <div>
                    <p className="text-lg font-bold text-zinc-950">
                      {connectionStatus.friends_count}
                    </p>
                    <p className="text-xs font-medium text-zinc-500">크루</p>
                  </div>
                )}
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

          <div className="mt-4">
            {renderConnectionActions()}
            {!isMine ? (
              <button
                type="button"
                onClick={onSendMessage}
                className="mt-2 h-9 min-w-32 rounded-lg bg-blue-500 px-5 text-sm font-bold text-white"
              >
                메시지 보내기
              </button>
            ) : null}
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectionMenuOpen, setIsConnectionMenuOpen] = useState(false);

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
                profile_links: await getProfileLinks(currentUser.id),
                real_name: currentUser.real_name,
                university_id: currentUser.university_id,
              }
            : await getProfile(profileNickname);

        const isMine = currentUser?.id === loadedProfile.id;
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

        if (requestedNickname === "me") {
          router.replace(`/profile/${encodeURIComponent(profileNickname)}`);
        }

        setState({
          connectionStatus,
          currentUserId: currentUser?.id ?? null,
          isFavorite,
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
    <div className="flex flex-1 flex-col bg-white">
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
