# NOTES

작업하면서 알아야 할 것들, 주의사항, 트러블슈팅 기록.

---

## 환경 설정

### Supabase MCP 연결
- `.mcp.json` 파일에 Supabase MCP 설정 추가 필요
- 프로젝트 ID 생성 후 AGENTS.md에 기입

### 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 개발 주의사항

### 이미지 업로드
- 업로드 전 클라이언트에서 반드시 압축 (`browser-image-compression`)
- Supabase Storage 버킷명: `post-images`, `story-images`, `avatars`
- DB에는 URL만 저장

### 스토리 자동 만료
- `expires_at` 컬럼 기준으로 Supabase Edge Function으로 처리
- 조회 시 `expires_at > now()` 조건 항상 포함

### 학교별 데이터 분리
- `posts`, `stories` 테이블에 `university` 컬럼 필수
- RLS 정책으로 같은 학교 유저만 조회 가능하게 설정

### 카카오 로그인 (krew에서 겪은 이슈)
- Supabase가 카카오 로그인 시 이메일 scope를 강제 포함
- 카카오 비즈앱 전환 필요 (개인 개발자도 가능, 본인인증으로)
- 이메일 없이도 로그인 가능하도록 `users.email` nullable 처리

### Next.js 미들웨어
- 파일명 `middleware.ts` 사용 (proxy.ts 아님)
- 로그인 여부 + 온보딩 완료 여부 체크

---

## 트러블슈팅

### users RLS 재귀 문제 (2026-04-27)
- 증상: 게시물 작성 시 "현재 로그인 유저의 학교 정보를 찾을 수 없습니다" 500 에러
- 원인: users RLS 정책에서 university_id 조회 시 무한 재귀 발생
- 해결: users 테이블 RLS 임시 비활성화 (개발용)
- TODO: 서비스 오픈 전 RLS 재설계 필요

### Supabase Storage 버킷 정책 (2026-04-27)
- post-images, story-images, avatars 버킷 생성 후 정책 추가 필요
- 로그인 유저만 업로드, 조회는 공개

---

## 구조적 부채 (앱 전환 전 해결 필요)

> Codex 코드 리뷰 결과 (2026-04-27)

### 1. features/가 브라우저에 묶여있음 ← 우선순위 높음
- features/feed/api.ts, features/auth/api.ts가 createBrowserClient에 직접 의존
- Expo에서는 createBrowserClient, 쿠키 세션, DOM File 객체 사용 불가
- 앱 전환 시 Supabase 클라이언트 주입 방식으로 리팩터링 필요

### 2. 로직이 페이지 컴포넌트에 들어있음 ← 우선순위 높음
- posts/write/page.tsx에 해시태그 파싱, 업로드 orchestration 들어있음
- onboarding, login, signup 폼에도 로직 혼재
- 앱 전환 시 UI만 바꾸는 게 아니라 플로우 전체를 다시 뽑아야 함
- 해결: 로직을 features/ 커스텀 훅으로 분리

### 3. kookmin.ac.kr 하드코딩 ← 지금 당장 수정 필요
- features/auth/api.ts에 kookmin.ac.kr 하드코딩
- 문서에는 universities 테이블 기반으로 확장한다고 했는데 실제와 다름
- 해결: universities 테이블에서 domain 조회하는 방식으로 변경

### 4. 인증 셸이 Next.js 전용
- middleware.ts, supabase/server.ts, auth/callback/route.ts가 쿠키/미들웨어 의존
- Expo에서는 딥링크 콜백, 모바일 세션 방식으로 별도 구현 필요
- 웹 인증은 그대로 유지, 앱용 인증 별도 작성 예정

### 5. 공용 타입/유틸 분산
- PostCard 컴포넌트가 features/feed/api.ts 타입 직접 import
- 해시태그 정규화 규칙 중복 (page.tsx, api.ts)
- 앱 전환 시 src/types/, src/utils/ 정리 필요

### 6. 문서와 실제 버전 불일치
- AGENTS.md, ARCHITECTURE.md에 Next.js 14로 기재
- 실제 package.json 기준 Next.js 16 / React 19
- TODO: 문서 버전 수정 필요
