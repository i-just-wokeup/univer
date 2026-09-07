import Constants from "expo-constants";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { getSupabaseMobileClient } from "../../lib/supabase";
import { useSession } from "../../lib/session";

// 이 사용자가 어떤 앱 버전을 쓰는지, 마지막으로 언제 왔는지 서버에 남긴다.
// 없으면 "테스터가 새 버전으로 올라왔나"를 Play Console을 열어야 알 수 있고 iOS는 그것도 안 된다.
// 앱을 켤 때 계정당 한 번만 보낸다. 실패해도 앱 사용을 막지 않는다.
export function useAppSessionRecorder() {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const recordedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const appVersion = Constants.expoConfig?.version ?? null;
    if (!userId || !appVersion) {
      return;
    }

    const key = `${userId}.${appVersion}.${Platform.OS}`;
    if (recordedKeyRef.current === key) {
      return;
    }
    recordedKeyRef.current = key;

    void getSupabaseMobileClient()
      .rpc("record_app_session", {
        p_app_platform: Platform.OS,
        p_app_version: appVersion,
      })
      .then(({ error }) => {
        if (error) {
          // 다음 실행에서 다시 시도할 수 있도록 표시를 지운다.
          recordedKeyRef.current = null;
        }
      });
  }, [userId]);
}
