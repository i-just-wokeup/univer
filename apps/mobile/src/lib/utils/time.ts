export function getRelativeTimeLabel(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    return `${Math.max(1, Math.floor(diffMs / minuteMs))}분 전`;
  }

  if (diffMs < dayMs) {
    return `${Math.max(1, Math.floor(diffMs / hourMs))}시간 전`;
  }

  return `${Math.max(1, Math.floor(diffMs / dayMs))}일 전`;
}
