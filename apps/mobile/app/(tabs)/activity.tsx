import { SquarePlay } from "lucide-react-native";

import { TabPlaceholderScreen } from "../../src/screens/tabs/TabPlaceholderScreen";

export default function ActivityRoute() {
  return (
    <TabPlaceholderScreen
      description="탐색 피드와 활동성 콘텐츠를 앱 탭 구조에 맞춰 연결할 예정입니다."
      icon={SquarePlay}
      title="활동"
    />
  );
}
