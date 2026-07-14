import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StateView } from "../../components/common/StateView";
import { ProfileContent } from "../../components/profile/ProfileContent";
import { ProfileHeaderBar } from "../../components/profile/ProfileHeaderBar";
import { ProfileMoreMenu } from "../../components/profile/ProfileMoreMenu";
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
    handleLinkPress,
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
      <ProfileHeaderBar
        isMine={isMine}
        isPushed={Boolean(nickname)}
        nickname={profile?.nickname ?? ""}
        onBack={() => router.back()}
        onOpenMore={() => {
          setIsActionSheetOpen(true);
        }}
        onPressSettings={handlePressSettings}
      />

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
          <ProfileContent
            connectionStatus={connectionStatus}
            counts={counts}
            errorMessage={errorMessage}
            isActionPending={isActionPending}
            isMine={isMine}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onEditProfile={handlePressEdit}
            onLinkPress={handleLinkPress}
            onMessage={() => {
              void handleStartMessage();
            }}
            onPressCrew={() => {
              router.push("/profile/connections");
            }}
            onPressPost={handlePressPost}
            onRejectFriendRequest={handleRejectFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onSendFriendRequest={handleSendFriendRequest}
            posts={posts}
            profile={profile}
          />
        ) : null}
      </ScrollView>
      <ProfileMoreMenu
        connectionStatus={connectionStatus}
        isFavorite={isFavorite}
        isOpen={isActionSheetOpen}
        onClose={() => {
          setIsActionSheetOpen(false);
        }}
        onRemoveFriend={handleRemoveFriend}
        onToggleFavorite={() => {
          void handleToggleFavorite();
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
  scrollContent: {
    paddingBottom: 110,
  },
});
