import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";
import { StateView } from "../common/StateView";
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

export function HomeLoadingState({ message, title }: HomeLoadingStateProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <StateView message={message} title={title} type="loading" />
    </SafeAreaView>
  );
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
});
