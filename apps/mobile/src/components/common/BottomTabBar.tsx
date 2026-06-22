import { Home, Plus, Search, SquarePlay, UserCircle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { colors } from "../../lib/theme";

export function BottomTabBar() {
  const items = [
    { key: "home", active: true, icon: Home },
    { key: "search", active: false, icon: Search },
    { key: "write", active: true, icon: Plus, primary: true },
    { key: "explore", active: false, icon: SquarePlay },
    { key: "profile", active: false, icon: UserCircle },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(({ active, icon: Icon, key, primary }) => {
        const iconColor = primary
          ? colors.white
          : active
            ? colors.accent
            : colors.textFaint;

        return (
          <View key={key} style={primary ? styles.primaryTab : styles.navTab}>
            <Icon
              color={iconColor}
              size={primary ? 36 : 31}
              strokeWidth={primary ? 2.8 : 2.5}
            />
          </View>
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
