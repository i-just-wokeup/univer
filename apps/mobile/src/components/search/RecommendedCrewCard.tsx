import { X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FriendRecommendation } from "../../features/profile/api";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";
import { AccountBadge } from "../common/AccountBadge";
import { Avatar } from "../common/Avatar";

type RecommendedCrewCardProps = {
  onDismiss: (userId: string) => void;
  onPress: (recommendation: FriendRecommendation) => void;
  onRequest: (recommendation: FriendRecommendation) => void;
  recommendation: FriendRecommendation;
};

export function RecommendedCrewCard({
  onDismiss,
  onPress,
  onRequest,
  recommendation,
}: RecommendedCrewCardProps) {
  const { colors } = useTheme();
  const { getBadge } = useVerifiedUsers();
  const styles = useThemedStyles(makeStyles);
  const badge = getBadge(recommendation.userId);
  const reason = recommendation.mutualCount > 0
    ? `공통 크루 ${recommendation.mutualCount}명`
    : recommendation.sameDept
      ? "같은 과"
      : null;

  return (
    <Pressable
      accessibilityLabel={`${recommendation.nickname} 프로필 보기`}
      accessibilityRole="button"
      onPress={() => onPress(recommendation)}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <Pressable
        accessibilityLabel={`${recommendation.nickname} 추천 숨기기`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={(event) => {
          event.stopPropagation();
          onDismiss(recommendation.userId);
        }}
        style={styles.dismissButton}
      >
        <X color={colors.muted} size={17} strokeWidth={2.4} />
      </Pressable>

      <Avatar
        imageUrl={recommendation.avatarUrl}
        label={recommendation.nickname}
        size={72}
      />

      <View style={styles.nicknameRow}>
        <Text numberOfLines={1} style={styles.nickname}>
          {recommendation.nickname}
        </Text>
        {badge ? (
          <View style={styles.badge}>
            <AccountBadge badge={badge} />
          </View>
        ) : null}
      </View>

      <View style={styles.reasonSlot}>
        {reason ? (
          <Text numberOfLines={1} style={styles.reason}>
            {reason}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel={`${recommendation.nickname}에게 크루 신청`}
        accessibilityRole="button"
        onPress={(event) => {
          event.stopPropagation();
          onRequest(recommendation);
        }}
        style={({ pressed }) => [
          styles.requestButton,
          pressed ? styles.requestButtonPressed : null,
        ]}
      >
        <Text style={styles.requestButtonText}>크루 신청</Text>
      </Pressable>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    width: 148,
    minHeight: 220,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: c.card,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 12,
  },
  pressed: {
    opacity: 0.72,
  },
  dismissButton: {
    position: "absolute",
    top: 7,
    right: 7,
    zIndex: 1,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.overlayInkFaint,
  },
  nicknameRow: {
    width: "100%",
    minWidth: 0,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nickname: {
    minWidth: 0,
    flexShrink: 1,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    marginLeft: 4,
  },
  reasonSlot: {
    width: "100%",
    minHeight: 16,
    marginTop: 5,
    justifyContent: "center",
  },
  reason: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  requestButton: {
    width: "100%",
    marginTop: "auto",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: c.accent,
    paddingVertical: 9,
  },
  requestButtonPressed: {
    opacity: 0.72,
  },
  requestButtonText: {
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
});
