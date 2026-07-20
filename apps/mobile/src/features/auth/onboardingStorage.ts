import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_COMPLETE_KEY_PREFIX = "univer:onboarding-complete:";

function getOnboardingCompleteKey(userId: string) {
  return `${ONBOARDING_COMPLETE_KEY_PREFIX}${userId}`;
}

export async function getStoredOnboardingComplete(
  userId: string,
): Promise<boolean> {
  const value = await AsyncStorage.getItem(getOnboardingCompleteKey(userId));
  return value === "true";
}

export async function setStoredOnboardingComplete(
  userId: string,
): Promise<void> {
  await AsyncStorage.setItem(getOnboardingCompleteKey(userId), "true");
}

export async function clearStoredOnboardingComplete(
  userId: string,
): Promise<void> {
  await AsyncStorage.removeItem(getOnboardingCompleteKey(userId));
}
