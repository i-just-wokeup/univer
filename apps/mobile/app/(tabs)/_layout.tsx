import { Redirect, Tabs, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { BottomTabBar } from "../../src/components/common/BottomTabBar";
import { useSession } from "../../src/lib/session";
import { colors } from "../../src/lib/theme";

export default function TabsLayout() {
  const { isOnboardingLoading, requiresOnboarding, session } = useSession();
  const router = useRouter();

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (isOnboardingLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (requiresOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen
        name="write"
        listeners={{
          // 작성은 탭 화면이 아니라 탭 바깥 라우트로 띄워 하단 탭바가 가려지게 한다.
          tabPress: (event) => {
            event.preventDefault();
            router.push("/compose");
          },
        }}
      />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
});
