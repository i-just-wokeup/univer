# APP_MIGRATION

UNIVER 웹 MVP를 Expo 앱으로 전환하기 위한 작업 기준.

## 목표

이번 전환은 전체 기능 이식이 아니라 앱 전환 가능성 검증용 vertical slice를 만든다.
성공 기준은 실제 Android 기기에서 로그인 후 홈 피드가 뜨고, 좋아요/댓글/프로필/탐색 흐름이 동작하는 것이다.

## 앱 1차 범위

### 포함
- Expo 앱 뼈대
- Supabase 세션 유지
- 이메일 로그인
- 홈 피드 조회
- 게시물 이미지 렌더링
- 게시물 좋아요
- 댓글 바텀시트
- 댓글 조회/작성
- 프로필 조회
- 탐색 그리드 조회

### 제외
- Google OAuth
- 게시물 작성/이미지 업로드
- 스토리
- DM
- 알림
- 설정
- 관리자
- 배포 빌드

## 웹/앱 분리 기준

### 공유
- `src/types/database.types.ts`
- 순수 유틸 (`src/lib/utils/*`)
- Supabase 쿼리 로직 중 조회/토글 중심 함수
- KREW 디자인 토큰 값

### 웹 전용
- Next App Router (`src/app/**`)
- `next/image`, `next/link`, `next/navigation`
- 데스크톱 3단 레이아웃
- DOM 기반 바텀시트/토스트/액션시트
- 웹 `File` 업로드와 `browser-image-compression`

### 앱 전용
- Expo Router
- React Native 화면/컴포넌트
- AsyncStorage 기반 Supabase client
- 네이티브 키보드/바텀시트 처리
- Expo 이미지 선택/압축/업로드

## 재사용 후보 API

1차 앱에서 먼저 살펴볼 함수:
- `getCurrentUserProfile`
- `signInWithPassword`
- `getFeed`
- `getLikedPostIds`
- `togglePostLike`
- `getComments`
- `createComment`
- `toggleCommentLike`
- `getProfile`
- `getProfilePosts`
- `getExplorePosts`

## 구조 방향

초기 검증판은 `apps/mobile`에 독립 Expo 앱으로 둔다.
웹 루트 패키지는 그대로 유지하고, 앱이 먼저 동작하는지 확인한 뒤 공유 패키지 또는 Supabase client adapter로 정리한다.

초기에는 필요한 API를 앱 쪽에서 얇게 재구성해도 된다.
검증 성공 후에는 `features`의 Supabase client 직접 의존을 제거하고 client 주입형 구조로 정리한다.

Expo Go 실기기 확인은 현재 Android Expo Go 54.0.8 호환을 우선해 Expo SDK 54 기준으로 진행한다.

## 실행/확인

초기 화면 확인은 실제 Android 기기 + Expo Go를 우선한다.

```bash
cd apps/mobile
npx expo start
```

같은 네트워크에서 QR 연결이 안 되면 다음 명령을 사용한다.

```bash
npx expo start --tunnel
```

## 다음 결정

vertical slice가 동작하면 다음을 판단한다.
- 공유 API adapter를 먼저 정리할지
- 작성/업로드를 앱에 붙일지
- Google OAuth deep link를 먼저 처리할지
- 웹 데스크톱 레이아웃 보정을 병행할지
