import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../common/Icon";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Logo } from "../common/Logo";

type HomeHeaderProps = {
  onLongPressLogo?: () => void;
  onPressMessages: () => void;
  onPressNotifications: () => void;
  onSignOut: () => void;
  unreadChatCount: number;
  unreadCount: number;
};

export function HomeHeader({
  onLongPressLogo,
  onPressMessages,
  onPressNotifications,
  onSignOut,
  unreadChatCount,
  unreadCount,
}: HomeHeaderProps) {

  const styles = useThemedStyles(makeStyles);

  // 의도: 알림·메시지 아이콘 strokeWidth 2는 2026-07-03 "인스타식 축소"로 2.6에서 내린 값
  return (
    <View style={styles.headerArea}>
      <View style={styles.topBar}>
        {__DEV__ && onLongPressLogo ? (
          <Pressable
            accessibilityLabel="홈 코치마크 다시 보기"
            accessibilityRole="button"
            onLongPress={onLongPressLogo}
          >
            <Logo height={28} />
          </Pressable>
        ) : (
          <Logo height={28} />
        )}
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="알림"
            accessibilityRole="button"
            onPress={onPressNotifications}
            style={styles.iconButton}
          >
            <Icon name="bell" size="md" stroke="thin" tone="text" />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityLabel="메시지"
            accessibilityRole="button"
            onLongPress={onSignOut}
            onPress={onPressMessages}
            style={styles.iconButton}
          >
            <Icon name="messageCircle" size="lg" stroke="thin" tone="text" />
            {unreadChatCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  headerArea: {
    paddingBottom: 6,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 10,
    paddingTop: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  // 의도: 원형 배경은 예쁘지 않아 일부러 뺐다(2026-07-03 축소 이후).
  // 44x44는 터치 영역이고 borderRadius·backgroundColor를 다시 넣지 말 것.
  iconButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: c.danger,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: c.white,
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.heavy,
  },
});
