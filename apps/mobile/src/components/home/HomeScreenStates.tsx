import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StateView } from "../common/StateView";
import { HomeFeedSkeleton } from "./HomeFeedSkeleton";
import { HomeHeader } from "./HomeHeader";

type HomeLoadingStateProps = {
  message: string;
  title: string;
};

type HomeErrorStateProps = {
  errorMessage: string;
  onPressMessages: () => void;
  onPressNotifications: () => void;
  onRetry: () => void;
  onSignOut: () => void | Promise<void>;
  unreadChatCount: number;
  unreadCount: number;
};

export function HomeLoadingState(_props: HomeLoadingStateProps) {
  return <HomeFeedSkeleton />;
}

export function HomeErrorState({
  errorMessage,
  onPressMessages,
  onPressNotifications,
  onRetry,
  onSignOut,
  unreadChatCount,
  unreadCount,
}: HomeErrorStateProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.screen}>
      <HomeHeader
        onPressMessages={onPressMessages}
        onPressNotifications={onPressNotifications}
        onSignOut={onSignOut}
        unreadChatCount={unreadChatCount}
        unreadCount={unreadCount}
      />
      <StateView
        actionLabel="다시 시도"
        message={errorMessage}
        onAction={onRetry}
        title="피드를 불러오지 못했습니다"
        type="error"
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
});
