import { StyleSheet, View } from "react-native";

import { colors } from "../../lib/theme";
import { SkeletonBlock } from "../common/Skeleton";

const GRID_ITEMS = 9;

export function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock radius={8} style={styles.logo} />
        <SkeletonBlock radius={26} style={styles.headerButton} />
      </View>
      <View style={styles.panel}>
        <View style={styles.topRow}>
          <SkeletonBlock radius={52} style={styles.avatar} />
          <View style={styles.statGroup}>
            <SkeletonBlock radius={8} style={styles.statNumber} />
            <SkeletonBlock radius={7} style={styles.statLabel} />
          </View>
          <View style={styles.statGroup}>
            <SkeletonBlock radius={8} style={styles.statNumber} />
            <SkeletonBlock radius={7} style={styles.statLabel} />
          </View>
        </View>
        <SkeletonBlock radius={8} style={styles.nameLine} />
        <SkeletonBlock radius={8} style={styles.metaLine} />
        <SkeletonBlock radius={8} style={styles.bioLine} />
        <SkeletonBlock radius={999} style={styles.linkChip} />
        <SkeletonBlock radius={16} style={styles.button} />
        <View style={styles.grid}>
          {Array.from({ length: GRID_ITEMS }).map((_, index) => (
            <SkeletonBlock key={index} radius={10} style={styles.tile} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 18,
  },
  logo: {
    width: 112,
    height: 40,
  },
  headerButton: {
    width: 52,
    height: 52,
  },
  panel: {
    marginHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.card,
    paddingTop: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 44,
    paddingHorizontal: 28,
  },
  avatar: {
    width: 104,
    height: 104,
  },
  statGroup: {
    alignItems: "center",
    gap: 10,
  },
  statNumber: {
    width: 38,
    height: 24,
  },
  statLabel: {
    width: 52,
    height: 16,
  },
  nameLine: {
    width: 112,
    height: 30,
    marginTop: 34,
    marginHorizontal: 28,
  },
  metaLine: {
    width: 160,
    height: 18,
    marginTop: 14,
    marginHorizontal: 28,
  },
  bioLine: {
    width: 96,
    height: 18,
    marginTop: 24,
    marginHorizontal: 28,
  },
  linkChip: {
    width: 150,
    height: 42,
    marginTop: 24,
    marginHorizontal: 28,
  },
  button: {
    height: 56,
    marginTop: 28,
    marginHorizontal: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 28,
    padding: 12,
  },
  tile: {
    width: "32.5%",
    aspectRatio: 1,
  },
});
