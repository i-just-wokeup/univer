import * as Sentry from "@sentry/react-native";

// 앱 에러/크래시 모니터링.
// - 개발(Metro)에선 끄고, 실제 빌드(preview/production)에서만 수집(dev 에러로 대시보드 오염 방지).
// - 실명 서비스라 기본 PII(IP·쿠키 등)는 전송하지 않는다(sendDefaultPii: false).
Sentry.init({
  dsn: "https://d53ad6d8939e816ec5ff9589072dee53@o4511698017255424.ingest.us.sentry.io/4511698339168256",
  enabled: !__DEV__,
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
});

export { Sentry };
