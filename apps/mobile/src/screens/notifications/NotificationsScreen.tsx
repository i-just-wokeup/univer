import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../../components/common/ScreenContainer";
import { NotificationRow } from "../../components/notifications/NotificationRow";
import { StateView } from "../../components/common/StateView";
import { routeToNotificationTarget } from "../../features/notifications/navigation";
import type { NotificationItem } from "../../features/notifications/types";
import { useNotifications } from "../../features/notifications/useNotifications";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const {
    errorMessage,
    isLoading,
    markAllRead,
    markRead,
    notifications,
    retry,
  } = useNotifications();

  const handlePress = useCallback(
    (notification: NotificationItem) => {
      markRead(notification);
      routeToNotificationTarget(router, notification.target);
    },
    [markRead, router],
  );

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color={colors.text} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>알림</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void markAllRead();
          }}
          style={({ pressed }) => [
            styles.markAllButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.markAllText}>모두 읽음</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <StateView
          message="알림을 불러오는 중입니다."
          title="알림 준비 중"
          type="loading"
        />
      ) : errorMessage ? (
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={retry}
          title="알림을 불러오지 못했습니다"
          type="error"
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={notifications}
          keyExtractor={(notification) => notification.id}
          ListEmptyComponent={
            <StateView
              message="새로운 소식이 생기면 여기에 표시됩니다."
              title="아직 알림이 없습니다"
            />
          }
          renderItem={({ item }) => (
            <NotificationRow notification={item} onPress={handlePress} />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: c.navBackground,
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    color: c.text,
    fontSize: 22,
    fontWeight: "900",
  },
  markAllButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
  },
  markAllText: {
    color: c.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
});
