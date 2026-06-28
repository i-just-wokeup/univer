import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    importance: Notifications.AndroidImportance.MAX,
    lightColor: colors.accent,
    name: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
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
