import { MoreHorizontal, Settings } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../lib/theme";
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
        themed
        title={nickname}
      />
    );
  }

  // 내 프로필 탭 — 남의 프로필(pushed)과 동일하게 상단 가운데에 내 아이디를 띄운다.
  // 루트 탭이라 뒤로가기는 없고, 오른쪽엔 설정 아이콘만.
  return (
    <ScreenHeader
      right={
        <HeaderIconButton
          accessibilityLabel="설정"
          icon="settings"
          onPress={onPressSettings}
        />
      }
      themed
      title={nickname}
    />
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
  const { colors } = useTheme();
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
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
