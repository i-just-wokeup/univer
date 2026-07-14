// 안드로이드 자동완성(삼성패스 등)을 앱 전체에서 끈다.
// 이유: 삼성패스가 프로필 편집 폼을 "닉네임=아이디, 다음 칸=비번"으로 오판해
// 소개 칸에 ID/비번 저장·채우기를 제안하는 문제. RN은 View 레벨/ multiline TextInput에
// importantForAutofill이 제대로 안 먹어 JS로는 막을 수 없어, MainActivity에 직접 선언한다.
// RN은 단일 액티비티라 이 설정은 앱 전체에 적용된다(로그인 자동완성도 함께 비활성).
const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

const withDisableAutofill = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      cfg.modResults,
    );
    mainActivity.$["android:importantForAutofill"] = "noExcludeDescendants";
    return cfg;
  });
};

module.exports = withDisableAutofill;
