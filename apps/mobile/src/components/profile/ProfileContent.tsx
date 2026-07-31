import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ConnectionStatus,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
  ProfileLink,
} from "../../features/profile/types";
import { colors } from "../../lib/theme";
import { KrewSurface } from "../common/KrewSurface";
import { ProfileConnectionActions } from "./ProfileConnectionActions";
import { ProfileInfoPanel } from "./ProfileInfoPanel";
import { ProfilePostGridSection } from "./ProfilePostGridSection";

type ProfileContentProps = {
  connectionStatus: ConnectionStatus | null;
  counts: ProfileCounts;
  errorMessage: string;
  isActionPending: boolean;
  isMine: boolean;
  onAcceptFriendRequest: () => void;
  onEditProfile: () => void;
  onLinkPress?: (link: ProfileLink) => void;
  onMessage: () => void;
  onPressCrew?: () => void;
  onPressPost: (postId: string) => void;
  onRejectFriendRequest: () => void;
  onRemoveFriend: () => void;
  onSendFriendRequest: () => void;
  posts: ProfileGridPost[];
  profile: ProfileDetail;
};

export function ProfileContent({
  connectionStatus,
  counts,
  errorMessage,
  isActionPending,
  isMine,
  onAcceptFriendRequest,
  onEditProfile,
  onLinkPress,
  onMessage,
  onPressCrew,
  onPressPost,
  onRejectFriendRequest,
  onRemoveFriend,
  onSendFriendRequest,
  posts,
  profile,
}: ProfileContentProps) {
  return (
    <KrewSurface style={styles.panel}>
      <ProfileInfoPanel
        counts={counts}
        onLinkPress={onLinkPress}
        onPressCrew={isMine ? onPressCrew : undefined}
        profile={profile}
      />
      {isMine ? (
        <Pressable
          accessibilityRole="button"
          onPress={onEditProfile}
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
          onAccept={onAcceptFriendRequest}
          onMessage={onMessage}
          onReject={onRejectFriendRequest}
          onRemove={onRemoveFriend}
          onSend={onSendFriendRequest}
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

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
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
  inlineError: {
    marginHorizontal: 16,
    marginBottom: 12,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: colors.accentTintBg,
  },
});
