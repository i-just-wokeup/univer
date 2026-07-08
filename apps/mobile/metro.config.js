// Expo 기본 Metro 설정 위에 Sentry 설정을 얹는다.
// (@sentry/core의 ESM 서브패스 해석 + 소스맵 처리를 위해 필요)
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = config;
