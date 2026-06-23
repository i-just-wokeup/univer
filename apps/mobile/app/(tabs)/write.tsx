import { Redirect } from "expo-router";

// 작성은 탭 바깥 /write 라우트에서 처리한다. 이 탭으로 직접 진입하면 그쪽으로 보낸다.
export default function WriteTabRoute() {
  return <Redirect href="/write" />;
}
