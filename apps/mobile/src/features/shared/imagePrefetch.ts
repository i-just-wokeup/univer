import { Image } from "expo-image";

type PrefetchCandidate = string | null | undefined;

export function prefetchImageUrls(
  urls: PrefetchCandidate[],
  limit: number,
): void {
  const uniqueUrls = Array.from(
    new Set(urls.filter((url): url is string => Boolean(url))),
  ).slice(0, limit);

  if (uniqueUrls.length === 0) {
    return;
  }

  // 프리패치는 체감 개선용 보조 작업이다. 실패해도 렌더/재생을 막으면 안 된다.
  void Image.prefetch(uniqueUrls, "memory-disk").catch(() => undefined);
}
