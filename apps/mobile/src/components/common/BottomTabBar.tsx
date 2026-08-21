import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Plus, Search, SquarePlay } from "lucide-react-native";
import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HOME_COACH_MARK_TARGETS } from "../../lib/coachMarkTargets";
import { useCoachMarkTarget } from "../../lib/coachMarks";
import { emitHomeTabReselect } from "../../lib/navigation/homeTabReselect";
import { useSession } from "../../lib/session";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Avatar } from "./Avatar";

type TabMeta = {
  icon?: ComponentType<LucideProps>;
  label: string;
  primary?: boolean;
};

const TAB_META: Record<string, TabMeta> = {
  index: { icon: Home, label: "홈" },
  search: { icon: Search, label: "검색" },
  write: { icon: Plus, label: "작성", primary: true },
  activity: { icon: SquarePlay, label: "탐색" },
  profile: { label: "프로필" },
};

export function BottomTabBar({ navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { currentAvatarUrl, currentNickname } = useSession();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const searchTargetRef = useCoachMarkTarget(
    HOME_COACH_MARK_TARGETS.searchTab,
  );
  const createTargetRef = useCoachMarkTarget(
    HOME_COACH_MARK_TARGETS.createTab,
  );
  const activityTargetRef = useCoachMarkTarget(
    HOME_COACH_MARK_TARGETS.activityTab,
  );
  const profileTargetRef = useCoachMarkTarget(
    HOME_COACH_MARK_TARGETS.profileTab,
  );

  return (
    <View
      style={[
        styles.bottomNav,
        {
          height: 54 + insets.bottom,
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
        const targetRef =
          route.name === "search"
            ? searchTargetRef
            : route.name === "write"
              ? createTargetRef
              : route.name === "activity"
                ? activityTargetRef
                : route.name === "profile"
                  ? profileTargetRef
                  : undefined;
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

          if (isActive && route.name === "index" && !event.defaultPrevented) {
            emitHomeTabReselect();
          }

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
            ref={targetRef}
            style={meta.primary ? styles.primaryTab : styles.navTab}
          >
            {route.name === "profile" ? (
              <View
                style={[
                  styles.profileAvatarRing,
                  isActive ? styles.profileAvatarRingActive : null,
                ]}
              >
                <Avatar
                  imageUrl={currentAvatarUrl}
                  label={currentNickname ?? "프로필"}
                  size={26}
                />
              </View>
            ) : Icon ? (
              <Icon
                color={iconColor}
                size={meta.primary ? 27 : 25}
                strokeWidth={meta.primary ? 2.4 : 2}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  bottomNav: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: c.navBar,
  },
  navTab: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTab: {
    height: 46,
    width: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.brand,
  },
  profileAvatarRing: {
    height: 30,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  profileAvatarRingActive: {
    borderWidth: 2,
    borderColor: c.accent,
  },
});
