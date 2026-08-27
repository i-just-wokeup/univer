import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ConnectionStatus,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
  ProfileLink,
} from "../../features/profile/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { KrewSurface } from "../common/KrewSurface";
import { ProfileConnectionActions } from "./ProfileConnectionActions";
import { ProfileInfoPanel } from "./ProfileInfoPanel";
import { ProfilePostGridSection } from "./ProfilePostGridSection";

type ProfileContentProps = {
  showInsightsButton: boolean;
  connectionStatus: ConnectionStatus | null;
  counts: ProfileCounts;
  errorMessage: string;
  followerCount: number;
  isActionPending: boolean;
  isCrewEligible: boolean;
  isFollowEligible: boolean;
  isFollowing: boolean;
  isMine: boolean;
  isProfileActionsReady: boolean;
  onAcceptFriendRequest: () => void;
  onEditProfile: () => void;
  onPressInsights: () => void;
  onLinkPress?: (link: ProfileLink) => void;
  onMessage: () => void;
  onPressCrew?: () => void;
  onPressPost: (postId: string) => void;
  onRejectFriendRequest: () => void;
  onRemoveFriend: () => void;
  onSendFriendRequest: () => void;
  onToggleFollow: () => void;
  posts: ProfileGridPost[];
  profile: ProfileDetail;
};

export function ProfileContent({
  showInsightsButton,
  connectionStatus,
  counts,
  errorMessage,
  followerCount,
  isActionPending,
  isCrewEligible,
  isFollowEligible,
  isFollowing,
  isMine,
  isProfileActionsReady,
  onAcceptFriendRequest,
  onEditProfile,
  onPressInsights,
  onLinkPress,
  onMessage,
  onPressCrew,
  onPressPost,
  onRejectFriendRequest,
  onRemoveFriend,
  onSendFriendRequest,
  onToggleFollow,
  posts,
  profile,
}: ProfileContentProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <KrewSurface style={styles.panel}>
      <ProfileInfoPanel
        counts={counts}
        followerCount={followerCount}
        onLinkPress={onLinkPress}
        onPressCrew={isMine ? onPressCrew : undefined}
        profile={profile}
        showFollowerCount={isFollowEligible}
      />
      {isMine ? (
        <View style={styles.profileActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onEditProfile}
            style={({ pressed }) => [
              styles.profileActionButton,
              pressed ? styles.profileActionButtonPressed : null,
            ]}
          >
            <Text style={styles.profileActionButtonText}>프로필 편집</Text>
          </Pressable>
          {showInsightsButton ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressInsights}
              style={({ pressed }) => [
                styles.profileActionButton,
                pressed ? styles.profileActionButtonPressed : null,
              ]}
            >
              <Text style={styles.profileActionButtonText}>인사이트</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {!isMine && connectionStatus && isProfileActionsReady ? (
        <ProfileConnectionActions
          connectionStatus={connectionStatus}
          disabled={isActionPending}
          isCrewEligible={isCrewEligible}
          isFollowEligible={isFollowEligible}
          isFollowing={isFollowing}
          onAccept={onAcceptFriendRequest}
          onMessage={onMessage}
          onReject={onRejectFriendRequest}
          onRemove={onRemoveFriend}
          onSend={onSendFriendRequest}
          onToggleFollow={onToggleFollow}
        />
      ) : null}
      {errorMessage ? (
        <Text style={styles.inlineError}>{errorMessage}</Text>
      ) : null}
      <View style={styles.divider} />
      <ProfilePostGridSection onPressPost={onPressPost} posts={posts} />
    </KrewSurface>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  panel: {
    marginTop: 8,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: c.feedCard,
  },
  profileActions: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profileActionButton: {
    minWidth: 0,
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.chipFill,
  },
  profileActionButtonPressed: {
    opacity: 0.75,
  },
  profileActionButtonText: {
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  inlineError: {
    marginHorizontal: 16,
    marginBottom: 12,
    color: c.danger,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: c.accentTintBg,
  },
});
