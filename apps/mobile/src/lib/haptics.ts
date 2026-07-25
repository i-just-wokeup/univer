import * as Haptics from "expo-haptics";

export function triggerLightHaptic(): void {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // 햅틱 미지원/비활성 환경에서는 피드백만 생략한다.
    });
  } catch {
    // 네이티브 모듈 호출 자체가 불가능한 환경에서도 앱 동작은 유지한다.
  }
}
