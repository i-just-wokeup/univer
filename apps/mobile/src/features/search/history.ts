// 최근 검색어 로컬 저장 — AsyncStorage에 닉네임 배열로 보관(최대 10개). 서버와 무관.
import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "search_history";
const MAX_SEARCH_HISTORY = 10;

// 최근 검색어 목록(깨진 값은 걸러서 반환).
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

// 검색어를 맨 앞에 추가(중복 제거 후, 최대 10개로 자름).
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

// 검색어 하나 삭제.
export async function removeSearchHistory(nickname: string): Promise<void> {
  const nextHistory = (await getSearchHistory()).filter(
    (item) => item !== nickname,
  );

  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

// 최근 검색 전체 삭제.
export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
}
