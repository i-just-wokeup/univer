import * as Sentry from "@sentry/react-native";

// 앱 에러/크래시 모니터링.
// - 개발(Metro)에선 끄고, 실제 빌드(preview/production)에서만 수집(dev 에러로 대시보드 오염 방지).
// - 실명 서비스라 기본 PII(IP·쿠키 등)는 전송하지 않는다(sendDefaultPii: false).
Sentry.init({
  dsn: "https://d53ad6d8939e816ec5ff9589072dee53@o4511698017255424.ingest.us.sentry.io/4511698339168256",
  enabled: !__DEV__,
  // 성능(트랜잭션) 10%만 샘플링 — Sentry 무료 플랜의 Span 한도(월 500만)를 아끼기 위함.
  // 사용자 늘어 데이터가 더 필요하면 그때 올린다.
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});

export { Sentry };
