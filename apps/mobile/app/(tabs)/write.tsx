import { SquarePen } from "lucide-react-native";

import { TabPlaceholderScreen } from "../../src/screens/tabs/TabPlaceholderScreen";

export default function WriteRoute() {
  return (
    <TabPlaceholderScreen
      description="사진 선택, 비율 선택, 공개 범위 설정을 앱 작성 흐름으로 연결할 예정입니다."
      icon={SquarePen}
      title="작성"
    />
  );
}
