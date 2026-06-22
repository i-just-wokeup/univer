import { Home, Plus, Search, SquarePlay, UserCircle } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import type { AppTab } from "../../app/tabs";
import { colors } from "../../lib/theme";

type BottomTabItem = {
  icon: typeof Home;
  key: AppTab;
  label: string;
  primary?: boolean;
};

const items: BottomTabItem[] = [
  { key: "home", label: "홈", icon: Home },
  { key: "search", label: "검색", icon: Search },
  { key: "write", label: "작성", icon: Plus, primary: true },
  { key: "activity", label: "활동", icon: SquarePlay },
  { key: "profile", label: "프로필", icon: UserCircle },
];

type BottomTabBarProps = {
  activeTab: AppTab;
  onTabPress: (tab: AppTab) => void;
};

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.bottomNav}>
      {items.map(({ icon: Icon, key, label, primary }) => {
        const active = activeTab === key;
        const iconColor = primary
          ? colors.white
          : active
            ? colors.accent
            : colors.textFaint;

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={key}
            onPress={() => onTabPress(key)}
            style={primary ? styles.primaryTab : styles.navTab}
          >
            <Icon
              color={iconColor}
              size={primary ? 36 : 31}
              strokeWidth={primary ? 2.8 : 2.5}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  navTab: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTab: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
});
