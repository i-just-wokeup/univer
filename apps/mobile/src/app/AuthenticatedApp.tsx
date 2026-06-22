import { Search, SquarePen, SquarePlay, UserCircle } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BottomTabBar } from "../components/common/BottomTabBar";
import { HomeScreen } from "../screens/home/HomeScreen";
import { TabPlaceholderScreen } from "../screens/tabs/TabPlaceholderScreen";
import type { AppTab } from "./tabs";

export function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  return (
    <View style={styles.shell}>
      {activeTab === "home" ? <HomeScreen /> : null}
      {activeTab === "search" ? (
        <TabPlaceholderScreen
          description="유저 검색과 최근 검색을 앱 화면으로 옮길 예정입니다."
          icon={Search}
          title="검색"
        />
      ) : null}
      {activeTab === "write" ? (
        <TabPlaceholderScreen
          description="사진 선택, 비율 선택, 공개 범위 설정을 앱 작성 흐름으로 연결할 예정입니다."
          icon={SquarePen}
          title="작성"
        />
      ) : null}
      {activeTab === "activity" ? (
        <TabPlaceholderScreen
          description="탐색 피드와 활동성 콘텐츠를 앱 탭 구조에 맞춰 연결할 예정입니다."
          icon={SquarePlay}
          title="활동"
        />
      ) : null}
      {activeTab === "profile" ? (
        <TabPlaceholderScreen
          description="내 프로필, 설정, 활동 내역 진입점을 앱 화면으로 연결할 예정입니다."
          icon={UserCircle}
          title="프로필"
        />
      ) : null}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
