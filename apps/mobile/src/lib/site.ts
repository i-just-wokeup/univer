export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://univer-six.vercel.app";

// 법적 고지 문서(웹) URL — 온보딩 동의 링크·설정 약관 링크에서 공용으로 쓴다.
export const LEGAL_URLS = {
  terms: `${SITE_URL}/terms`,
  privacy: `${SITE_URL}/privacy`,
  guidelines: `${SITE_URL}/guidelines`,
} as const;

