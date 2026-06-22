import { Redirect, Tabs } from "expo-router";

import { BottomTabBar } from "../../src/components/common/BottomTabBar";
import { useSession } from "../../src/lib/session";

export default function TabsLayout() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="write" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
