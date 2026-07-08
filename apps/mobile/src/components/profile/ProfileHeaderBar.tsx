import { MoreHorizontal, Settings } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";
import { ScreenHeader } from "../common/ScreenHeader";

type ProfileHeaderBarProps = {
  isMine: boolean;
  isPushed: boolean;
  nickname: string;
  onBack: () => void;
  onOpenMore: () => void;
  onPressSettings: () => void;
};

export function ProfileHeaderBar({
  isMine,
  isPushed,
  nickname,
  onBack,
  onOpenMore,
  onPressSettings,
}: ProfileHeaderBarProps) {
  if (isPushed) {
    return (
      <ScreenHeader
        onBack={onBack}
        right={
          isMine ? (
            <HeaderIconButton
              accessibilityLabel="설정"
              icon="settings"
              onPress={onPressSettings}
            />
          ) : (
            <HeaderIconButton
              accessibilityLabel="프로필 옵션"
              icon="more"
              onPress={onOpenMore}
            />
          )
        }
        title={nickname}
      />
    );
  }

  return (
    <View style={styles.tabHeader}>
      <Text style={styles.logo}>KREW</Text>
      <HeaderIconButton
        accessibilityLabel="설정"
        icon="settings"
        onPress={onPressSettings}
      />
    </View>
  );
}

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  icon: "more" | "settings";
  onPress: () => void;
};

function HeaderIconButton({
  accessibilityLabel,
  icon,
  onPress,
}: HeaderIconButtonProps) {
  const Icon = icon === "settings" ? Settings : MoreHorizontal;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.headerButton}
    >
      <Icon color={colors.text} size={22} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  logo: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900",
  },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
});
