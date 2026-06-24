import { useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActionSheet,
  type ActionSheetItem,
} from "../../components/common/ActionSheet";
import { KrewSurface } from "../../components/common/KrewSurface";
import { PostThumbnailGrid } from "../../components/common/PostThumbnailGrid";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { ProfileConnectionActions } from "../../components/profile/ProfileConnectionActions";
import { ProfileInfoPanel } from "../../components/profile/ProfileInfoPanel";
import { getOrCreateConversation } from "../../features/chat/api";
import {
  acceptFriendRequest,
  getConnectionStatus,
  getFavoriteUserStatus,
  getProfile,
  getProfileCounts,
  getProfilePosts,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  toggleUserFavorite,
} from "../../features/profile/api";
import type {
  ConnectionStatus,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
} from "../../features/profile/types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

type ProfileScreenProps = {
  nickname?: string;
};

export function ProfileScreen({ nickname }: ProfileScreenProps) {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [counts, setCounts] = useState<ProfileCounts>({ crew: 0, posts: 0 });
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null);
  const [posts, setPosts] = useState<ProfileGridPost[]>([]);
  const [isMine, setIsMine] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const { isMine: loadedIsMine, profile: loaded } =
        await getProfile(nickname);
      setProfile(loaded);
      setIsMine(loadedIsMine);

      const [loadedCounts, loadedPosts, loadedConnectionStatus, favoriteStatus] =
        await Promise.all([
          getProfileCounts(loaded.id),
          getProfilePosts(loaded.id),
          loadedIsMine ? Promise.resolve(null) : getConnectionStatus(loaded.id),
          loadedIsMine
            ? Promise.resolve(false)
            : getFavoriteUserStatus(loaded.id),
        ]);
      setCounts(
        loadedConnectionStatus
          ? { ...loadedCounts, crew: loadedConnectionStatus.friends_count }
          : loadedCounts,
      );
      setConnectionStatus(loadedConnectionStatus);
      setIsFavorite(favoriteStatus);
      setPosts(loadedPosts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [nickname]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSignOut() {
    await getSupabaseMobileClient().auth.signOut();
  }

  async function refreshConnectionStatus(profileId: string) {
    const nextConnectionStatus = await getConnectionStatus(profileId);
    setConnectionStatus(nextConnectionStatus);
    setCounts((currentCounts) => ({
      ...currentCounts,
      crew: nextConnectionStatus.friends_count,
    }));
  }

  async function runConnectionAction({
    action,
    optimisticStatus,
  }: {
    action: () => Promise<void>;
    optimisticStatus: ConnectionStatus;
  }) {
    if (!profile || isMine || !connectionStatus || isActionPending) {
      return;
    }

    const previousConnectionStatus = connectionStatus;
    const previousCounts = counts;

    setIsActionPending(true);
    setErrorMessage("");
    setConnectionStatus(optimisticStatus);
    setCounts((currentCounts) => ({
      ...currentCounts,
      crew: optimisticStatus.friends_count,
    }));

    try {
      await action();
      await refreshConnectionStatus(profile.id);
    } catch (error) {
      setConnectionStatus(previousConnectionStatus);
      setCounts(previousCounts);
      setErrorMessage(
        error instanceof Error ? error.message : "친구 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsActionPending(false);
    }
  }

  function handleSendFriendRequest() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => sendFriendRequest(profile.id),
      optimisticStatus: {
        ...connectionStatus,
        is_requester: true,
        status: "pending",
      },
    });
  }

  function handleAcceptFriendRequest() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => acceptFriendRequest(profile.id),
      optimisticStatus: {
        friends_count: connectionStatus.friends_count + 1,
        is_requester: false,
        status: "accepted",
      },
    });
  }

  function handleRejectFriendRequest() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => rejectFriendRequest(profile.id),
      optimisticStatus: {
        ...connectionStatus,
        is_requester: false,
        status: "none",
      },
    });
  }

  function handleRemoveFriend() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => removeFriend(profile.id),
      optimisticStatus: {
        friends_count:
          connectionStatus.status === "accepted"
            ? Math.max(0, connectionStatus.friends_count - 1)
            : connectionStatus.friends_count,
        is_requester: false,
        status: "none",
      },
    });
  }

  async function handleToggleFavorite() {
    if (!profile || isMine || isActionPending) {
      return;
    }

    const previousIsFavorite = isFavorite;
    setIsActionPending(true);
    setErrorMessage("");
    setIsFavorite(!previousIsFavorite);

    try {
      const result = await toggleUserFavorite(profile.id);
      setIsFavorite(result.favorited);
    } catch (error) {
      setIsFavorite(previousIsFavorite);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "즐겨찾기 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsActionPending(false);
    }
  }

  async function handleStartMessage() {
    if (!profile || isMine || isActionPending) {
      return;
    }

    try {
      setIsActionPending(true);
      setErrorMessage("");
      const conversationId = await getOrCreateConversation(profile.id);
      router.push({
        pathname: "/messages/[conversationId]",
        params: { conversationId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "대화를 시작하지 못했습니다.",
      );
    } finally {
      setIsActionPending(false);
    }
  }

  const handlePressPost = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/[id]", params: { id: postId } });
    },
    [router],
  );

  const actionSheetItems: ActionSheetItem[] = [
    {
      label: isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가",
      onPress: () => {
        void handleToggleFavorite();
      },
    },
    ...(connectionStatus?.status === "accepted"
      ? [
          {
            danger: true,
            label: "친구 삭제",
            onPress: handleRemoveFriend,
          } satisfies ActionSheetItem,
        ]
      : []),
    {
      label: "취소",
      onPress: () => {},
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          message="프로필을 불러오는 중입니다."
          title="프로필 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            setIsLoading(true);
            void load();
          }}
          title="프로필을 불러오지 못했습니다"
          type="error"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {nickname ? (
        <ScreenHeader
          onBack={() => router.back()}
          right={
            !isMine ? (
              <Pressable
                accessibilityLabel="프로필 옵션"
                accessibilityRole="button"
                onPress={() => {
                  setIsActionSheetOpen(true);
                }}
                style={styles.headerButton}
              >
                <MoreHorizontal
                  color={colors.text}
                  size={22}
                  strokeWidth={2.4}
                />
              </Pressable>
            ) : undefined
          }
          title={profile?.nickname ?? ""}
        />
      ) : (
        <View style={styles.tabHeader}>
          <Text style={styles.logo}>KREW</Text>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>로그아웃</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setIsRefreshing(true);
              void load();
            }}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
      >
        {profile ? (
          <KrewSurface style={styles.panel}>
            <ProfileInfoPanel
              counts={counts}
              onPressCrew={
                isMine
                  ? () => {
                      router.push("/profile/connections");
                    }
                  : undefined
              }
              profile={profile}
            />
            {!isMine && connectionStatus ? (
              <ProfileConnectionActions
                connectionStatus={connectionStatus}
                disabled={isActionPending}
                onAccept={handleAcceptFriendRequest}
                onMessage={() => {
                  void handleStartMessage();
                }}
                onReject={handleRejectFriendRequest}
                onRemove={handleRemoveFriend}
                onSend={handleSendFriendRequest}
              />
            ) : null}
            {errorMessage ? (
              <Text style={styles.inlineError}>{errorMessage}</Text>
            ) : null}
            <View style={styles.divider} />
            {posts.length === 0 ? (
              <View style={styles.emptyGrid}>
                <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
              </View>
            ) : (
              <PostThumbnailGrid items={posts} onPressItem={handlePressPost} />
            )}
          </KrewSurface>
        ) : null}
      </ScrollView>
      <ActionSheet
        isOpen={isActionSheetOpen}
        items={actionSheetItems}
        onClose={() => {
          setIsActionSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  logo: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900",
  },
  signOutButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  panel: {
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(124,58,237,0.08)",
  },
  emptyGrid: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  inlineError: {
    marginHorizontal: 16,
    marginBottom: 12,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
});
