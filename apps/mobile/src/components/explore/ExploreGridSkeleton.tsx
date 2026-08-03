import { StyleSheet, useWindowDimensions, View } from "react-native";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { SkeletonBlock } from "../common/Skeleton";

const H_PADDING = 10;
const GAP = 8;
const LEFT_TILE_RATIOS = [1, 4 / 5, 1, 4 / 5] as const;
const RIGHT_TILE_RATIOS = [4 / 5, 1, 4 / 5, 1] as const;

export function ExploreGridSkeleton() {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const tileWidth = (width - H_PADDING * 2 - GAP) / 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock radius={8} style={styles.title} />
      </View>
      <View style={styles.columns}>
        <View style={[styles.column, { width: tileWidth }]}>
          {LEFT_TILE_RATIOS.map((ratio, index) => (
            <SkeletonBlock
              key={`left-${index}`}
              radius={20}
              style={{ width: tileWidth, height: tileWidth / ratio }}
            />
          ))}
        </View>
        <View style={[styles.column, { width: tileWidth }]}>
          {RIGHT_TILE_RATIOS.map((ratio, index) => (
            <SkeletonBlock
              key={`right-${index}`}
              radius={20}
              style={{ width: tileWidth, height: tileWidth / ratio }}
            />
          ))}
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    width: 76,
    height: 28,
  },
  columns: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
  },
  column: {
    gap: GAP,
  },
});
