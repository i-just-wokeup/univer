import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ProfileCounts,
  ProfileDetail,
  ProfileLink,
} from "../../features/profile/types";
import { colors, nicknameTextStyle } from "../../lib/theme";
import { getSocialPlatformFromUrl } from "../../lib/utils/profileLinks";
import { Avatar } from "../common/Avatar";
import { SocialIcon } from "../common/SocialIcon";

type ProfileInfoPanelProps = {
  counts: ProfileCounts;
  onLinkPress?: (link: ProfileLink) => void;
  onPressCrew?: () => void;
  profile: ProfileDetail;
};

// 프로필 상단 정보 영역(아바타+통계+이름/실명/학과+소개+링크). 순수 UI.
export function ProfileInfoPanel({
  counts,
  onLinkPress,
  onPressCrew,
  profile,
}: ProfileInfoPanelProps) {
  return (
    <View style={styles.section}>
      <View style={styles.identityRow}>
        <Avatar imageUrl={profile.avatar_url} label={profile.nickname} size={80} />
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{counts.posts}</Text>
            <Text style={styles.statLabel}>게시물</Text>
          </View>
          {onPressCrew ? (
            <Pressable
              accessibilityLabel="크루 관리 열기"
              accessibilityRole="button"
              onPress={onPressCrew}
              style={({ pressed }) => [
                styles.stat,
                pressed ? styles.pressedStat : null,
              ]}
            >
              <Text style={styles.statNumber}>{counts.crew}</Text>
              <Text style={styles.statLabel}>크루</Text>
            </Pressable>
          ) : (
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{counts.crew}</Text>
              <Text style={styles.statLabel}>크루</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.nameBlock}>
        <Text style={styles.nickname}>{profile.nickname}</Text>
        {profile.real_name ? (
          <Text style={styles.realName}>실명 {profile.real_name}</Text>
        ) : null}
        {profile.department ? (
          <Text style={styles.department}>{profile.department}</Text>
        ) : null}
      </View>

      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      {profile.links.length > 0 ? (
        <View style={styles.links}>
          {profile.links.map((link) => {
            const platform = getSocialPlatformFromUrl(link.url);

            return (
              <Pressable
                accessibilityLabel={`프로필 링크 열기: ${link.label}`}
                accessibilityRole="link"
                key={link.id}
                onPress={() => {
                  if (onLinkPress) {
                    onLinkPress(link);
                  } else {
                    void Linking.openURL(link.url);
                  }
                }}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed ? styles.pressedLinkButton : null,
                ]}
              >
                <SocialIcon platform={platform} size={23} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  stats: {
    flex: 1,
    flexDirection: "row",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  pressedStat: {
    opacity: 0.65,
  },
  statNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  nameBlock: {
    marginTop: 16,
  },
  nickname: {
    ...nicknameTextStyle,
    fontSize: 20,
  },
  realName: {
    marginTop: 4,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "700",
  },
  department: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  bio: {
    marginTop: 16,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
  },
  links: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressedLinkButton: {
    opacity: 0.68,
  },
});
