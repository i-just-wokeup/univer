const nicknamePattern = /^[a-z0-9._]+$/;
const temporaryNicknamePattern = /^user_[a-f0-9]{12}$/;

export function normalizeNickname(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
}

export function isValidNickname(value: string) {
  const normalizedNickname = normalizeNickname(value);

  return (
    normalizedNickname.length > 0 && nicknamePattern.test(normalizedNickname)
  );
}

export function isTemporaryNickname(value: string | null | undefined) {
  return temporaryNicknamePattern.test(value ?? "");
}
