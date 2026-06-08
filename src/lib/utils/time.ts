export function getRelativeTimeLabel(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const diffMs = Date.now() - createdTime;
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}분 전`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}시간 전`;
  }

  const days = Math.max(1, Math.floor(diffMs / dayMs));
  return `${days}일 전`;
}

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

function getKstDateParts(isoString: string) {
  const date = new Date(isoString);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const hours = kst.getUTCHours();
  const minutes = String(kst.getUTCMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "오전" : "오후";
  const hour = hours % 12 === 0 ? 12 : hours % 12;

  return {
    ampm,
    day: kst.getUTCDate(),
    hour,
    minutes,
    month: kst.getUTCMonth() + 1,
    year: kst.getUTCFullYear(),
  };
}

export function formatKoreanDateTime(isoString: string): string {
  const parts = getKstDateParts(isoString);

  return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${parts.ampm} ${parts.hour}:${parts.minutes}`;
}

export function formatStoryArchiveDate(isoString: string): string {
  const parts = getKstDateParts(isoString);

  return `${parts.month}월 ${parts.day}일`;
}
