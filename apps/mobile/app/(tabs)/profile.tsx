import { UserCircle } from "lucide-react-native";

import { TabPlaceholderScreen } from "../../src/screens/tabs/TabPlaceholderScreen";

export default function ProfileRoute() {
  return (
    <TabPlaceholderScreen
      description="내 프로필, 설정, 활동 내역 진입점을 앱 화면으로 연결할 예정입니다."
      icon={UserCircle}
      title="프로필"
    />
  );
}
