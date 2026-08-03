import { StyleSheet, View } from "react-native";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { SkeletonBlock } from "../common/Skeleton";

const GRID_ITEMS = 9;
const GRID_COLUMNS = 3;

type ProfileSkeletonProps = {
  isPushed?: boolean;
};

export function ProfileSkeleton({ isPushed = false }: ProfileSkeletonProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSlot}>
          {isPushed ? (
            <SkeletonBlock radius={6} style={styles.headerIcon} />
          ) : null}
        </View>
        <SkeletonBlock radius={8} style={styles.headerTitle} />
        <View style={styles.headerSlot}>
          <SkeletonBlock radius={6} style={styles.headerIcon} />
        </View>
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
        <SkeletonBlock radius={14} style={styles.button} />
        <View style={styles.grid}>
          {Array.from({ length: Math.ceil(GRID_ITEMS / GRID_COLUMNS) }).map(
            (_, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {Array.from({ length: GRID_COLUMNS }).map((__, columnIndex) => (
                  <SkeletonBlock
                    key={columnIndex}
                    radius={10}
                    style={styles.tile}
                  />
                ))}
              </View>
            ),
          )}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerSlot: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 22,
    height: 22,
  },
  headerTitle: {
    flex: 1,
    height: 20,
    marginHorizontal: 12,
  },
  panel: {
    overflow: "hidden",
    marginTop: 8,
    borderRadius: 22,
    backgroundColor: c.feedCard,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 16,
    paddingBottom: 0,
  },
  avatar: {
    width: 80,
    height: 80,
  },
  statGroup: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    width: 32,
    height: 22,
  },
  statLabel: {
    width: 44,
    height: 14,
  },
  nameLine: {
    width: 96,
    height: 24,
    marginTop: 16,
    marginHorizontal: 16,
  },
  metaLine: {
    width: 136,
    height: 16,
    marginTop: 8,
    marginHorizontal: 16,
  },
  bioLine: {
    width: 84,
    height: 16,
    marginTop: 16,
    marginHorizontal: 16,
  },
  linkChip: {
    width: 136,
    height: 34,
    marginTop: 14,
    marginHorizontal: 16,
  },
  button: {
    height: 42,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  grid: {
    gap: 4,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: c.accentTintBg,
  },
  gridRow: {
    flexDirection: "row",
    gap: 4,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
  },
});
