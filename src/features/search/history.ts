const SEARCH_HISTORY_KEY = "search_history";
const MAX_SEARCH_HISTORY = 10;

function canUseLocalStorage() {
  return typeof window !== "undefined";
}

export function getSearchHistory(): string[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(SEARCH_HISTORY_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(nickname: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    return;
  }

  const nextHistory = [
    trimmedNickname,
    ...getSearchHistory().filter((item) => item !== trimmedNickname),
  ].slice(0, MAX_SEARCH_HISTORY);

  window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

export function removeSearchHistory(nickname: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const nextHistory = getSearchHistory().filter((item) => item !== nickname);
  window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

export function clearSearchHistory(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(SEARCH_HISTORY_KEY);
}
