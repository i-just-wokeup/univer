import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";
import { SkeletonBlock } from "../common/Skeleton";

const CARD_COUNT = 3;
const STORY_CARD_COUNT = 3;

export function HomeFeedSkeleton() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <SkeletonBlock radius={8} style={styles.logo} />
          <View style={styles.actions}>
            <SkeletonBlock radius={22} style={styles.headerButton} />
            <SkeletonBlock radius={22} style={styles.headerButton} />
          </View>
        </View>
        <View style={styles.storyRow}>
          {Array.from({ length: STORY_CARD_COUNT }).map((_, index) => (
            <SkeletonBlock key={index} radius={22} style={styles.storyTile} />
          ))}
        </View>
        {Array.from({ length: CARD_COUNT }).map((_, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <SkeletonBlock radius={17} style={styles.avatar} />
              <View style={styles.headerLines}>
                <SkeletonBlock radius={8} style={styles.nameLine} />
              </View>
              <SkeletonBlock radius={5} style={styles.moreDots} />
            </View>
            <SkeletonBlock radius={0} style={styles.media} />
            <View style={styles.actionRow}>
              <SkeletonBlock radius={14} style={styles.actionIcon} />
              <SkeletonBlock radius={14} style={styles.actionIcon} />
              <View style={styles.actionSpacer} />
              <SkeletonBlock radius={14} style={styles.actionIcon} />
            </View>
            <SkeletonBlock radius={8} style={styles.captionLine} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  content: {
    paddingBottom: 96,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logo: {
    width: 104,
    height: 38,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
  },
  storyRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  storyTile: {
    width: 100,
    height: 140,
  },
  card: {
    overflow: "hidden",
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  avatar: {
    width: 34,
    height: 34,
  },
  headerLines: {
    flex: 1,
  },
  nameLine: {
    width: "58%",
    height: 15,
  },
  moreDots: {
    width: 40,
    height: 10,
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 5,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 6,
  },
  actionIcon: {
    width: 26,
    height: 26,
  },
  actionSpacer: {
    flex: 1,
  },
  captionLine: {
    width: "40%",
    height: 14,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
  },
});
