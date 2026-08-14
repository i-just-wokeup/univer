import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";

import { ScreenContainer } from "../../components/common/ScreenContainer";
import { StateView } from "../../components/common/StateView";
import { ProfileContent } from "../../components/profile/ProfileContent";
import { ProfileHeaderBar } from "../../components/profile/ProfileHeaderBar";
import { ProfileMoreMenu } from "../../components/profile/ProfileMoreMenu";
import { ProfileSkeleton } from "../../components/profile/ProfileSkeleton";
import { useProfile } from "../../features/profile/useProfile";
import { triggerLightHaptic } from "../../lib/haptics";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";

type ProfileScreenProps = {
  nickname?: string;
};

export function ProfileScreen({ nickname }: ProfileScreenProps) {
  const { colors } = useTheme();
  const { getBadge, isBadgeDataReady } = useVerifiedUsers();
  const styles = useThemedStyles(makeStyles);
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
  const profileBadge = profile ? getBadge(profile.id) : null;
  const isCrewEligible = isBadgeDataReady && profileBadge === null;
  const showInsightsButton = Boolean(
    isMine &&
      isBadgeDataReady &&
      profileBadge &&
      (profileBadge.promoted || profileBadge.affiliation !== null),
  );

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

  const handlePressInsights = useCallback(() => {
    router.push("/insights");
  }, [router]);

  const handlePullRefresh = useCallback(() => {
    triggerLightHaptic();
    refresh();
  }, [refresh]);

  if (isLoading) {
    return (
      <ScreenContainer
        contentBackgroundColor={colors.accentSoft}
        style={styles.screen}
      >
        <ProfileSkeleton isPushed={Boolean(nickname)} />
      </ScreenContainer>
    );
  }

  if (errorMessage && !profile) {
    return (
      <ScreenContainer
        contentBackgroundColor={colors.accentSoft}
        style={styles.screen}
      >
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={retry}
          title="프로필을 불러오지 못했습니다"
          type="error"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ProfileHeaderBar
        isMine={isMine}
        isPushed={Boolean(nickname)}
        nickname={profile?.nickname ?? ""}
        onBack={() => router.back()}
        onOpenMore={() => {
          setIsActionSheetOpen(true);
        }}
        onPressSettings={handlePressSettings}
        userId={profile?.id}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={handlePullRefresh}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
      >
        {profile ? (
          <ProfileContent
            showInsightsButton={showInsightsButton}
            connectionStatus={connectionStatus}
            counts={counts}
            isCrewEligible={isCrewEligible}
            errorMessage={errorMessage}
            isActionPending={isActionPending}
            isMine={isMine}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onEditProfile={handlePressEdit}
            onPressInsights={handlePressInsights}
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
        isCrewEligible={isCrewEligible}
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
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  scrollContent: {
    paddingBottom: 110,
  },
});
