import { useRouter } from "expo-router";
import { MoreHorizontal, Settings } from "lucide-react-native";
import { useCallback, useState } from "react";
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
import { useProfile } from "../../features/profile/useProfile";
import { colors } from "../../lib/theme";

type ProfileScreenProps = {
  nickname?: string;
};

export function ProfileScreen({ nickname }: ProfileScreenProps) {
  const router = useRouter();
  const {
    connectionStatus,
    counts,
    errorMessage,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleRemoveFriend,
    handleSendFriendRequest,
    handleToggleFavorite,
    isActionPending,
    isFavorite,
    isLoading,
    isMine,
    isRefreshing,
    posts,
    profile,
    refresh,
    retry,
    startConversation,
  } = useProfile(nickname);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  async function handleStartMessage() {
    const conversationId = await startConversation();
    if (conversationId) {
      router.push({
        pathname: "/messages/[conversationId]",
        params: { conversationId },
      });
    }
  }

  const handlePressPost = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/[id]", params: { id: postId } });
    },
    [router],
  );

  const handlePressSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handlePressEdit = useCallback(() => {
    router.push("/profile/edit");
  }, [router]);

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
          onAction={retry}
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
            ) : (
              <Pressable
                accessibilityLabel="설정"
                accessibilityRole="button"
                onPress={handlePressSettings}
                style={styles.headerButton}
              >
                <Settings color={colors.text} size={22} strokeWidth={2.4} />
              </Pressable>
            )
          }
          title={profile?.nickname ?? ""}
        />
      ) : (
        <View style={styles.tabHeader}>
          <Text style={styles.logo}>KREW</Text>
          <Pressable
            accessibilityLabel="설정"
            accessibilityRole="button"
            onPress={handlePressSettings}
            style={styles.headerButton}
          >
            <Settings color={colors.text} size={22} strokeWidth={2.4} />
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
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
            {isMine ? (
              <Pressable
                accessibilityRole="button"
                onPress={handlePressEdit}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed ? styles.editButtonPressed : null,
                ]}
              >
                <Text style={styles.editButtonText}>프로필 편집</Text>
              </Pressable>
            ) : null}
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
  editButton: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  editButtonPressed: {
    opacity: 0.75,
  },
  editButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
});
