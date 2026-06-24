// 채팅 구분선용. KST 기준, 오늘이면 "오전/오후 H:MM", 아니면 "M월 D일 오전/오후 H:MM".
export function formatChatTime(isoString: string): string {
  const date = new Date(isoString);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);

  const isToday =
    kst.getUTCFullYear() === now.getUTCFullYear() &&
    kst.getUTCMonth() === now.getUTCMonth() &&
    kst.getUTCDate() === now.getUTCDate();

  const hours = kst.getUTCHours();
  const minutes = String(kst.getUTCMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "오전" : "오후";
  const h = hours % 12 === 0 ? 12 : hours % 12;
  const timeStr = `${ampm} ${h}:${minutes}`;

  if (isToday) {
    return timeStr;
  }

  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${timeStr}`;
}

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
