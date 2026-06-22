import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Plus, Search, SquarePlay, UserCircle } from "lucide-react-native";
import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";

type TabMeta = {
  icon: ComponentType<LucideProps>;
  label: string;
  primary?: boolean;
};

const TAB_META: Record<string, TabMeta> = {
  index: { icon: Home, label: "홈" },
  search: { icon: Search, label: "검색" },
  write: { icon: Plus, label: "작성", primary: true },
  activity: { icon: SquarePlay, label: "활동" },
  profile: { icon: UserCircle, label: "프로필" },
};

export function BottomTabBar({ navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomNav,
        {
          height: 78 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];

        if (!meta) {
          return null;
        }

        const Icon = meta.icon;
        const isActive = state.index === index;
        const iconColor = meta.primary
          ? colors.white
          : isActive
            ? colors.accent
            : colors.textFaint;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            accessibilityLabel={meta.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={route.key}
            onPress={onPress}
            style={meta.primary ? styles.primaryTab : styles.navTab}
          >
            <Icon
              color={iconColor}
              size={meta.primary ? 36 : 31}
              strokeWidth={meta.primary ? 2.8 : 2.5}
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
