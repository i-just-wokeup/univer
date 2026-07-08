import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import { usePushNotifications } from "../src/features/notifications/usePushNotifications";
import { SessionProvider, useSession } from "../src/lib/session";
import { Sentry } from "../src/lib/sentry";
import { SystemBarsController } from "../src/lib/systemBars";
import { colors } from "../src/lib/theme";

function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <BottomSheetModalProvider>
          <SessionProvider>
            <RootNavigator />
            <PushNotificationsController />
            <SystemBarsController />
          </SessionProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Sentry가 렌더 에러까지 잡도록 루트를 감싼다.
export default Sentry.wrap(RootLayout);

function PushNotificationsController() {
  usePushNotifications();
  return null;
}

function RootNavigator() {
  const { isConfigured, isLoading } = useSession();

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.logo}>KREW</Text>
          <Text style={styles.title}>앱 환경변수가 필요합니다</Text>
          <Text style={styles.description}>
            apps/mobile/.env.local에 EXPO_PUBLIC_SUPABASE_URL과
            EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="story/[userId]"
        options={{
          animation: "none",
          contentStyle: { backgroundColor: colors.black },
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    padding: 20,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderColor: "rgba(124,58,237,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 24,
  },
  logo: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    marginTop: 28,
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
});
