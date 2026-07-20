import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";
import { SkeletonBlock } from "../common/Skeleton";

const CARD_COUNT = 3;

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
            <SkeletonBlock radius={26} style={styles.headerButton} />
            <SkeletonBlock radius={26} style={styles.headerButton} />
          </View>
        </View>
        <SkeletonBlock radius={26} style={styles.storyTile} />
        {Array.from({ length: CARD_COUNT }).map((_, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <SkeletonBlock radius={24} style={styles.avatar} />
              <View style={styles.headerLines}>
                <SkeletonBlock radius={8} style={styles.nameLine} />
                <SkeletonBlock radius={7} style={styles.metaLine} />
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
    paddingTop: 22,
    paddingBottom: 20,
  },
  logo: {
    width: 124,
    height: 42,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 52,
    height: 52,
  },
  storyTile: {
    width: 116,
    height: 152,
    marginLeft: 24,
    marginBottom: 14,
  },
  card: {
    overflow: "hidden",
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: colors.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  avatar: {
    width: 48,
    height: 48,
  },
  headerLines: {
    flex: 1,
    gap: 8,
    marginLeft: 14,
  },
  nameLine: {
    width: "42%",
    height: 16,
  },
  metaLine: {
    width: "30%",
    height: 13,
  },
  moreDots: {
    width: 36,
    height: 10,
  },
  media: {
    width: "100%",
    aspectRatio: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  actionIcon: {
    width: 28,
    height: 28,
  },
  actionSpacer: {
    flex: 1,
  },
  captionLine: {
    width: "40%",
    height: 16,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
});
