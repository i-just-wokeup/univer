import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { WriteScreen } from "../src/screens/write/WriteScreen";

// 게시물 작성. 탭 바깥 라우트라 진입 시 하단 탭바가 가려진다.
export default function ComposeRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <WriteScreen />;
}
