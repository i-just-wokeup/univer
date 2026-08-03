import { Bell, MessageCircle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type HomeHeaderProps = {
  onPressMessages: () => void;
  onPressNotifications: () => void;
  onSignOut: () => void;
  unreadChatCount: number;
  unreadCount: number;
};

export function HomeHeader({
  onPressMessages,
  onPressNotifications,
  onSignOut,
  unreadChatCount,
  unreadCount,
}: HomeHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.headerArea}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>KREW</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="알림"
            accessibilityRole="button"
            onPress={onPressNotifications}
            style={styles.circleButton}
          >
            <Bell color={colors.text} size={23} strokeWidth={2} />
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
            style={styles.circleButton}
          >
            <MessageCircle color={colors.text} size={24} strokeWidth={2} />
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
  logo: {
    color: c.accent,
    fontSize: 32,
    fontWeight: "900",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  circleButton: {
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
    fontSize: 10,
    fontWeight: "900",
  },
});
