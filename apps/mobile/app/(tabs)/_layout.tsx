import { Redirect, Tabs, useRouter } from "expo-router";

import { BottomTabBar } from "../../src/components/common/BottomTabBar";
import { useSession } from "../../src/lib/session";

export default function TabsLayout() {
  const { session } = useSession();
  const router = useRouter();

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
      <Tabs.Screen
        name="write"
        listeners={{
          // 작성은 탭 화면이 아니라 탭 바깥 라우트로 띄워 하단 탭바가 가려지게 한다.
          tabPress: (event) => {
            event.preventDefault();
            router.push("/write");
          },
        }}
      />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
