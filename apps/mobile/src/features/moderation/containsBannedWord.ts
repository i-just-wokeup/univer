import { BANNED_WORDS } from "./bannedWords";

export const BANNED_WORD_GUIDANCE =
  "사용할 수 없는 표현이 포함되어 있어요.";

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function containsBannedWord(text: string): boolean {
  const normalizedText = normalize(text);

  return BANNED_WORDS.some((word) => normalizedText.includes(normalize(word)));
}
