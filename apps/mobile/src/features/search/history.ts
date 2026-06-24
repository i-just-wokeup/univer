import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "search_history";
const MAX_SEARCH_HISTORY = 10;

export async function getSearchHistory(): Promise<string[]> {
  try {
    const rawValue = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function addSearchHistory(nickname: string): Promise<void> {
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    return;
  }

  const nextHistory = [
    trimmedNickname,
    ...(await getSearchHistory()).filter((item) => item !== trimmedNickname),
  ].slice(0, MAX_SEARCH_HISTORY);

  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

export async function removeSearchHistory(nickname: string): Promise<void> {
  const nextHistory = (await getSearchHistory()).filter(
    (item) => item !== nickname,
  );

  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
}
