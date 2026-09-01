import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export type ConnectionTab = "friends" | "received" | "sent";

export const CONNECTION_TABS: Array<{ label: string; value: ConnectionTab }> = [
  { label: "내 크루", value: "friends" },
  { label: "받은 신청", value: "received" },
  { label: "보낸 신청", value: "sent" },
];

type ConnectionTabsProps = {
  activeTab: ConnectionTab;
  onChange: (tab: ConnectionTab) => void;
};

export function ConnectionTabs({ activeTab, onChange }: ConnectionTabsProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      {CONNECTION_TABS.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <Pressable
            accessibilityRole="button"
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={({ pressed }) => [
              styles.tab,
              isActive ? styles.activeTab : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.label, isActive ? styles.activeLabel : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 18,
    backgroundColor: c.surfaceBorder,
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  activeTab: {
    backgroundColor: c.accent,
  },
  label: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  activeLabel: {
    color: c.onAccent,
  },
  pressed: {
    opacity: 0.72,
  },
});
