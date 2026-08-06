import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getActiveConversationId } from "../chat/activeConversation";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

// 포그라운드 알림 표시 규칙. 지금 보고 있는 채팅방의 새 메시지면 배너/목록을 띄우지 않는다.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as {
      conversationId?: unknown;
      targetType?: unknown;
    };
    const isActiveChatMessage =
      data?.targetType === "chat" &&
      typeof data.conversationId === "string" &&
      data.conversationId === getActiveConversationId();

    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: !isActiveChatMessage,
      shouldShowList: !isActiveChatMessage,
    };
  },
});

// 안드로이드는 채널 중요도를 한번 만들면 못 바꿔서, 예전 "default"(낮은 중요도로 굳음)
// 대신 새 채널 id로 heads-up(HIGH) 채널을 만든다. 서버 푸시도 이 channelId로 보낸다.
export const ANDROID_NOTIFICATION_CHANNEL_ID = "alerts";

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    ANDROID_NOTIFICATION_CHANNEL_ID,
    {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colors.accent,
      name: "알림",
      vibrationPattern: [0, 250, 250, 250],
    },
  );

  // 낮은 중요도로 굳은 옛 채널 정리(있으면).
  await Notifications.deleteNotificationChannelAsync("default").catch(
    () => undefined,
  );
}

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function requestNotificationPermission() {
  const currentPermission = await Notifications.getPermissionsAsync();
  if (
    currentPermission.granted ||
    currentPermission.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return currentPermission;
  }

  return Notifications.requestPermissionsAsync();
}

export async function registerForPushNotifications(): Promise<string | null> {
  await ensureAndroidNotificationChannel();

  if (!Device.isDevice) {
    return null;
  }

  const permission = await requestNotificationPermission();
  if (!permission.granted) {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("Expo projectId를 찾지 못했습니다.");
  }

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 이 토큰을 다른 계정에서 떼어내고 현재 유저에 등록한다(한 기기 = 한 계정 수신).
  const { error } = await supabase.rpc("claim_push_token", {
    p_token: expoPushToken,
  });

  if (error) {
    throw new Error("푸시 토큰을 저장하지 못했습니다.");
  }

  return expoPushToken;
}

export { Notifications };
