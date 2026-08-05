import "../src/lib/globalFont";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import { AppSplash } from "../src/components/common/AppSplash";
import { Logo } from "../src/components/common/Logo";
import { usePushNotifications } from "../src/features/notifications/usePushNotifications";
import { SessionProvider, useSession } from "../src/lib/session";
import { Sentry } from "../src/lib/sentry";
import { SystemBarsController } from "../src/lib/systemBars";
import { colors, ThemeProvider } from "../src/lib/theme";
import { VerifiedUsersProvider } from "../src/lib/verifiedUsers";

// 네이티브 스플래시(배경색)를 JS가 준비될 때까지 유지 → AppSplash(워드마크)로 이어받는다.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  // JS 첫 렌더 시 네이티브 스플래시를 내리고 AppSplash 오버레이가 이어받게 한다.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardProvider>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <BottomSheetModalProvider>
              <SessionProvider>
                <VerifiedUsersProvider>
                  <RootNavigator />
                  <PushNotificationsController />
                  <SystemBarsController />
                  <StatusBar style="auto" />
                  <AppSplash />
                </VerifiedUsersProvider>
              </SessionProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
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
          <Logo height={30} />
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
    <Stack screenOptions={{ headerShown: false, animation: "simple_push" }}>
      <Stack.Screen name="login" options={{ animation: "none" }} />
      <Stack.Screen name="onboarding" options={{ animation: "none" }} />
      <Stack.Screen name="reels" options={{ animation: "simple_push" }} />
      <Stack.Screen
        name="story/[userId]"
        options={{ animation: "fade" }}
      />
      <Stack.Screen name="compose" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen
        name="story/create"
        options={{ animation: "slide_from_bottom" }}
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
    borderColor: colors.accentBorderSoft,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 24,
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
