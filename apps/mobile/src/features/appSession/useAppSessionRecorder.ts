import Constants from "expo-constants";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { getSupabaseMobileClient } from "../../lib/supabase";
import { useSession } from "../../lib/session";

// 같은 사람이 앱을 자주 여닫아도 서버를 계속 두드리지 않도록 최소 간격을 둔다.
const RECORD_INTERVAL_MS = 60 * 60 * 1000;

// 이 사용자가 어떤 앱 버전을 쓰는지, 마지막으로 언제 왔는지 서버에 남긴다.
// 없으면 "테스터가 새 버전으로 올라왔나"를 Play Console을 열어야 알 수 있고 iOS는 그것도 안 된다.
//
// 앱을 켤 때와, 백그라운드에서 돌아올 때 기록한다. 켤 때만 기록하면
// 앱을 완전히 끄지 않고 매일 쓰는 사람이 "7일 이상 안 옴"으로 잡힌다.
// 실패해도 앱 사용을 막지 않는다.
export function useAppSessionRecorder() {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const lastRecordedKeyRef = useRef<string | null>(null);
  const lastRecordedAtRef = useRef(0);

  useEffect(() => {
    const appVersion = Constants.expoConfig?.version ?? null;
    if (!userId || !appVersion) {
      return;
    }

    // 위 가드를 통과한 값을 고정해 둔다(함수 선언 안에서는 좁혀진 타입이 유지되지 않는다).
    const version = appVersion;
    const key = `${userId}.${version}.${Platform.OS}`;

    async function record() {
      const isSameKey = lastRecordedKeyRef.current === key;
      const isTooSoon = Date.now() - lastRecordedAtRef.current < RECORD_INTERVAL_MS;
      if (isSameKey && isTooSoon) {
        return;
      }

      const { error } = await getSupabaseMobileClient().rpc(
        "record_app_session",
        {
          p_app_platform: Platform.OS,
          p_app_version: version,
        },
      );

      if (error) {
        return;
      }

      lastRecordedKeyRef.current = key;
      lastRecordedAtRef.current = Date.now();
    }

    void record();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void record();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId]);
}
