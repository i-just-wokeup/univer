# 구글 로그인 설정 가이드 (Expo dev build + Supabase)

앱(Expo) 구글 로그인은 **코드보다 외부 설정이 먼저**다. 이 문서는 사용자가 직접 해야 하는 외부 설정 체크리스트.
코드 구현(아래 5단계)은 별도 Codex 작업이며 **네이티브라 dev build 재빌드 필요**.

> **진행 상태 (2026-06-26)**
> - ✅ 외부 설정 완료: 기존 프로젝트(웹 OAuth "Universe 웹") 재사용, Android 클라이언트 ID 생성(`com.univer.app` + dev build SHA-1 `60:E5:...:67`), Supabase Authorized Client IDs에 웹+안드ID 등록·저장
> - ⏳ 남음: 5단계 코드(Codex) + dev build 재빌드. iOS는 나중.

## 방식 결정
- **`@react-native-google-signin/google-signin`(네이티브) → idToken → `supabase.auth.signInWithIdToken()`**
- 이유: 프로덕션 권장, Supabase 공식 지원, 네이티브 구글 UI. (이미 dev build 있음)
- 대안 `expo-auth-session`은 웹뷰 방식이라 UX 떨어짐 → 비채택.

## ⚠️ 클라이언트 ID 3종 (제일 헷갈리는 부분)
| 종류 | 어디에 쓰나 |
|---|---|
| **Web client ID** | Supabase에 등록 + **코드의 `webClientId`(audience)에 사용** ← 코드엔 이거! |
| **Android client ID** | **코드엔 안 씀.** 같은 프로젝트에 package+SHA-1로 등록만 돼 있으면 됨. 없으면 `DEVELOPER_ERROR` |
| iOS client ID | iOS 추가할 때 (지금은 안드 우선) |

> 가장 흔한 사고: 코드에 Android client ID를 넣음 → `DEVELOPER_ERROR`(에러 메시지 불친절). 코드엔 **Web client ID**.

## 외부 설정 단계 (사용자가 직접)

### 1. Google Cloud 프로젝트 + OAuth 동의 화면
- 프로젝트 생성 → "OAuth consent screen" 구성.
- 학교 도메인 제한은 코드 `hostedDomain: 'kookmin.ac.kr'` + 서버 트리거에서 이메일 도메인 재확인으로 처리(동의화면 단독으론 강제 약함).

### 2. Web client ID 생성
- Credentials → Create OAuth client ID → **Web application**.
- **Authorized redirect URIs**에 Supabase 콜백 URL 추가.
  - Supabase 대시보드 → Authentication → Providers → Google 에서 **Callback URL 복사**.
- 생성된 **Web client ID + Client secret** 보관.

### 3. Android client ID 생성
- Create OAuth client ID → **Android**.
- **Package name**: `com.univer.app`
- **SHA-1 지문**: EAS 빌드 keystore에서 꺼냄.
  - `cd apps/mobile && eas credentials` → Android → 빌드용 keystore → **SHA-1 복사**.
  - 로컬 디버그도 테스트하면 디버그 keystore SHA-1도 함께 등록.

### 4. Supabase 설정
- Authentication → Providers → **Google 활성화(ON)**.
- **Client ID = Web client ID**, **Client Secret = Web secret**.
- **Authorized Client IDs** 칸에 **Web client ID + Android client ID** 추가(쉼표 구분).
  - native `signInWithIdToken`이 토큰 audience를 검증하는 데 필요. 누락하면 네이티브 로그인 거부됨.

### 5. 코드 (별도 Codex 작업, 네이티브 → 재빌드 필요)
- `npx expo install @react-native-google-signin/google-signin` + app.json 플러그인 추가.
- `GoogleSignin.configure({ webClientId, hostedDomain: 'kookmin.ac.kr' })`.
- 로그인 버튼 → `GoogleSignin.signIn()` → idToken → `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`.
- 기존 이메일/비번 로그인과 공존(웹은 이미 구글 OAuth 구현됨, 앱만 추가).

## 흔한 에러
- **DEVELOPER_ERROR**: SHA-1 누락/불일치, 또는 코드에 Android client ID를 넣음(→ Web client ID로).
- **네이티브 모듈 없음 크래시**: 설치 후 dev build 재빌드 안 함.
- **Supabase 거부**: Authorized Client IDs에 client ID 누락.

## 빌드 묶기
- 토큰(SecureStore) · 푸시(FCM) · 이 구글 로그인은 **전부 네이티브** → **한 빌드에 묶어** 처리.
- 이 문서 1~4단계(외부 설정)를 먼저 끝내야 빌드가 의미 있음(설정 틀리면 재빌드).

## 참고
- Supabase 공식: https://supabase.com/docs/guides/auth/social-login/auth-google
- 메모: 학교 이메일=구글 워크스페이스(`@kookmin.ac.kr`), 웹은 구글 OAuth + 이메일/비번 이미 구현됨.
