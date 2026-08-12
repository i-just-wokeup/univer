import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { StoryGroup } from "../../features/stories/types";
import { getStorySharedPostThumbnail } from "../../features/stories/storySharedPosts";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type StoryBarProps = {
  groups: StoryGroup[];
  onPressCreate: () => void;
  onPressGroup: (group: StoryGroup) => void;
};

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

// 미리보기 이미지 + 닉네임 + 미열람 테두리로 구성된 단일 스토리 카드.
function StoryCard({
  hasUnviewed,
  nickname,
  thumbnailUrl,
}: {
  hasUnviewed: boolean;
  nickname: string;
  thumbnailUrl: string | null;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={[
        styles.card,
        hasUnviewed ? styles.cardUnviewed : styles.cardViewed,
      ]}
    >
      {thumbnailUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={thumbnailUrl}
          source={{ uri: thumbnailUrl }}
          style={styles.cardImage}
        />
      ) : null}
      <LinearGradient
        colors={["transparent", colors.scrimStrong]}
        style={styles.cardShade}
      />
      <Text numberOfLines={1} style={styles.cardName}>
        {nickname}
      </Text>
    </View>
  );
}

// 홈 상단 스토리 레일. 첫 칸은 내 스토리(없으면 추가, 있으면 미리보기+추가 배지), 이후 타 유저 그룹.
export function StoryBar({ groups, onPressCreate, onPressGroup }: StoryBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const myGroup = groups.find((group) => group.stories[0]?.isMine);
  const otherGroups = groups.filter((group) => !group.stories[0]?.isMine);
  const latestMyStory = myGroup?.stories[myGroup.stories.length - 1] ?? null;
  const myThumbnail =
    getStorySharedPostThumbnail(latestMyStory?.sharedPost ?? null) ??
    latestMyStory?.thumbnail_url ??
    latestMyStory?.image_url ??
    null;

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {myGroup ? (
        <View style={styles.myStory}>
          <Pressable
            accessibilityLabel="내 스토리 보기"
            accessibilityRole="button"
            onPress={() => onPressGroup(myGroup)}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <StoryCard
              hasUnviewed={false}
              nickname="내 스토리"
              thumbnailUrl={myThumbnail}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="스토리 추가"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onPressCreate}
            style={styles.addBadge}
          >
            <Plus color={colors.onAccent} size={18} strokeWidth={3} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel="내 스토리 추가"
          accessibilityRole="button"
          onPress={onPressCreate}
          style={({ pressed }) => [
            styles.createCard,
            pressed ? styles.pressed : null,
          ]}
        >
          <View style={styles.createPlus}>
            <Plus color={colors.onAccent} size={26} strokeWidth={2.6} />
          </View>
          <Text style={styles.createLabel}>내 스토리</Text>
        </Pressable>
      )}

      {otherGroups.map((group) => (
        <Pressable
          accessibilityLabel={`${group.user.nickname} 스토리`}
          accessibilityRole="button"
          key={group.user.id}
          onPress={() => onPressGroup(group)}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <StoryCard
            hasUnviewed={group.hasUnviewed}
            nickname={group.user.nickname}
            thumbnailUrl={
              getStorySharedPostThumbnail(
                group.stories[group.stories.length - 1]?.sharedPost ?? null,
              ) ??
              group.stories[group.stories.length - 1]?.thumbnail_url ??
              group.stories[group.stories.length - 1]?.image_url ??
              null
            }
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  myStory: {
    position: "relative",
  },
  addBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: c.white,
    backgroundColor: c.accent,
  },
  card: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: c.lavenderTint,
  },
  cardUnviewed: {
    borderColor: c.accent,
  },
  cardViewed: {
    borderColor: c.border,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardShade: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 56,
  },
  cardName: {
    margin: 8,
    color: c.white,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
  },
  createCard: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    borderColor: c.lavenderBorder,
    borderRadius: 22,
    borderWidth: 2.5,
    backgroundColor: c.onMediaFill,
  },
  createPlus: {
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: c.accent,
  },
  createLabel: {
    marginTop: 10,
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  pressed: {
    opacity: 0.8,
  },
});
