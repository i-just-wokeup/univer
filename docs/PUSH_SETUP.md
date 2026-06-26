# 푸시 알림 설정 가이드 (Expo SDK 54 + FCM + Supabase)

앱 푸시도 구글 로그인처럼 **외부 설정(Firebase/FCM)이 코드보다 먼저**다. 이 문서는 사용자가 직접 해야 하는 외부 설정 + 작업 분할.
**SDK 54부터 Expo Go에서 푸시 안 됨 → dev build 필수** (토큰/구글이랑 같은 빌드에 묶기).

## 방식
- `expo-notifications` + **Expo Push Service**. Android는 **FCM HTTP v1**(서비스 계정 키) 필수.
- 토큰 저장: 기존 `users.fcm_token` 컬럼 재사용(스키마 변경 없음). ※ 이름은 fcm_token이지만 Expo Push 사용 시 **Expo push token**(`ExponentPushToken[...]`)을 저장.

## 1단계: 외부 설정 (사용자가 직접, 지금 가능)
### a. Firebase 프로젝트 + Android 앱
1. Firebase 콘솔에서 프로젝트 생성(또는 기존 재사용).
2. **Android 앱 추가** → 패키지 이름 `com.univer.app`.
3. **`google-services.json` 다운로드** → `apps/mobile/`에 둠.
4. `app.json`에 `expo.android.googleServicesFile: "./google-services.json"` 추가(코드 작업 때 Codex가 함). 이 파일은 공개 식별자라 커밋 OK.

### b. FCM V1 서비스 계정 키 → EAS 업로드
1. Firebase 콘솔 → **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성**(JSON 다운로드).
2. `cd apps/mobile && eas credentials` → Android → **"FCM V1 service account key" 업로드**.
3. ⚠️ 이 JSON은 **민감 → `.gitignore`** (절대 커밋 금지).

## 2단계: 코드 (별도 Codex, 네이티브 → 빌드 필요)
- `npx expo install expo-notifications` + 플러그인/`googleServicesFile` 설정.
- 권한 요청 → **Expo push token 획득** → 로그인 시 `users.fcm_token`에 저장.
- 알림 수신 핸들러 + **탭 시 라우팅**(게시물/스토리/프로필 등, 웹 알림 target과 동일 흐름).

## 3단계: 서버 전송 (별개 — 더 큰 작업, 빌드 무관)
- `notifications` 행 생성 시 **Expo Push API로 전송**하는 Supabase **Edge Function**(또는 트리거→함수 호출).
- 이건 빌드와 무관하니 **클라이언트 수신 되고 나서** 따로 진행. (= 푸시 Phase 2)

## 빌드 묶기
- 토큰(SecureStore) · 구글 로그인 · 푸시 = 전부 네이티브 → **한 빌드**.
- 빌드 전에 **1단계(Firebase 외부 설정)**를 끝내야 푸시가 빌드에 의미 있게 들어감.

## 주의
- Expo Go에서 푸시 테스트 불가(SDK 54) → dev build.
- 서비스 계정 키 커밋 금지. google-services.json은 커밋 가능.

## 참고
- Expo 푸시 설정: https://docs.expo.dev/push-notifications/push-notifications-setup/
- FCM V1 자격증명: https://docs.expo.dev/push-notifications/fcm-credentials/
