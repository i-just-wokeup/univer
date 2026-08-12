import AsyncStorage from "@react-native-async-storage/async-storage";

const HOME_COACH_MARK_COMPLETE_KEY_PREFIX =
  "univer:home-coach-mark-complete:";

function getHomeCoachMarkCompleteKey(userId: string) {
  return `${HOME_COACH_MARK_COMPLETE_KEY_PREFIX}${userId}`;
}

export async function getStoredHomeCoachMarkComplete(
  userId: string,
): Promise<boolean> {
  const value = await AsyncStorage.getItem(
    getHomeCoachMarkCompleteKey(userId),
  );
  return value === "true";
}

export async function setStoredHomeCoachMarkComplete(
  userId: string,
): Promise<void> {
  await AsyncStorage.setItem(getHomeCoachMarkCompleteKey(userId), "true");
}
