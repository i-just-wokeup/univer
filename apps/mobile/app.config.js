// app.json을 그대로 두고, 빌드 프로필에 따라 값만 덮어쓴다.
// 목적: 개발 빌드를 Play 스토어 앱과 나란히 설치하기 위해 패키지명을 분리한다.
// (Expo 공식 권장 방식 — 한 기기에 동시 설치하려면 Application ID가 서로 달라야 한다)

const PROD_PACKAGE = "com.univer.app";
const DEV_PACKAGE = "com.univer.app.dev";

// 값을 못 읽었을 때 개발용으로 떨어지도록 방향을 잡는다.
// 프로덕션 패키지명은 profile이 production/preview일 때만 나온다.
// 반대로 두면 환경변수 하나가 빠졌을 때 개발 빌드가 스토어 앱을 덮어쓴다.
const profile =
  process.env.EAS_BUILD_PROFILE ?? process.env.APP_VARIANT ?? "development";
const IS_PROD = profile === "production" || profile === "preview";

module.exports = ({ config }) => {
  if (IS_PROD) {
    // 프로덕션 경로에서 패키지명이 어긋나면 조용히 넘어가지 않고 즉시 실패시킨다.
    if (config.android?.package !== PROD_PACKAGE) {
      throw new Error(
        `프로덕션 빌드의 android.package가 어긋났습니다: ${config.android?.package}`,
      );
    }

    return config;
  }

  // google-services.json은 com.univer.app 하나만 담고 있다.
  // 개발 빌드는 푸시를 쓰지 않으므로 항목 자체를 뺀다.
  // (없으면 @expo/config-plugins가 google-services Gradle 플러그인을 붙이지 않는다)
  const { googleServicesFile, ...android } = config.android ?? {};

  return {
    ...config,
    name: "unip (dev)",
    android: { ...android, package: DEV_PACKAGE },
    ios: { ...config.ios, bundleIdentifier: DEV_PACKAGE },
  };
};
