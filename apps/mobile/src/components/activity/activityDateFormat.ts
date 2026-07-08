export function formatActivityStoryDateTime(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatActivityViewerTime(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
