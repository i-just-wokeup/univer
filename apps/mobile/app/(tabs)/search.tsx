import { Search } from "lucide-react-native";

import { TabPlaceholderScreen } from "../../src/screens/tabs/TabPlaceholderScreen";

export default function SearchRoute() {
  return (
    <TabPlaceholderScreen
      description="유저 검색과 최근 검색을 앱 화면으로 옮길 예정입니다."
      icon={Search}
      title="검색"
    />
  );
}
