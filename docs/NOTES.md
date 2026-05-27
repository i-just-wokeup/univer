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
- TODO: 배포 전 업로드 시 비율 범위 체크(1.91:1 ~ 4:5) 및 크롭 UI 구현 예정

### 스토리 자동 만료
- 조회 시 `expires_at > now()` 조건으로 필터링 (Cron Job 불필요)
- 실제 DB row는 남아있으나 모든 조회 쿼리에서 만료 조건 포함되어 있음

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

### 게시물 작성 라우트 (2026-05-19)
- 작성/수정 진입 경로: `/write`
- 수정 모드: `/write?postId=...` 쿼리 파라미터 사용
- 기존 `/posts/write` 라우트 삭제 완료

### 이미지 비율 정책 (2026-05-18)
- 피드/게시물 모달: 원본 비율 유지 (object-contain, 배경 검정)
- 프로필 썸네일 그리드: 1:1 크롭 (object-cover) 유지
- 인스타 허용 범위 기준: 1.91:1 ~ 4:5
- 업로드 시 비율 체크 및 크롭 UI: 배포 전 TODO

### 영상 도입 고려한 설계 (2026-05-19)
영상 기능은 MVP 이후 도입 예정이지만, 구조를 닫아두면 나중에 다시 뜯어야 하므로 지금부터 영상까지 버틸 수 있는 구조로 설계.

영향받는 부분:
1. DB 스키마: post_images → post_media (type, thumbnail_url, duration 추가)
2. features/feed/api.ts: PostImage → PostMedia 타입 변경
3. UI 컴포넌트: PostCard/PostDetail/PostImageUploader 영상 분기
4. Storage 버킷: post-videos 버킷 추가
5. 스토리도 동일한 확장 필요

MVP 수준에서 무조건 작업:
A. DB 스키마 변경 (post_images → post_media)
B. features/feed/api.ts 타입 마이그레이션
C. Storage 버킷 분리 (post-videos 생성)

기록만 해두고 나중에 작업:
D. UI 컴포넌트 영상 분기 (실제 영상 도입 시점)
E. 영상 트랜스코딩 (FFmpeg + DASH/HLS 또는 Mux)
F. 자동재생/음소거/영상 길이 제한 UI
G. 스토리 영상 지원
H. CDN 전략 (Cloudflare R2, Bunny CDN, Mux)

참고:
- Meta 엔지니어링 블로그: https://engineering.fb.com
- 키워드: video transcoding pipeline FFmpeg, HLS streaming, DASH adaptive streaming

---

## 트러블슈팅

### users RLS 재귀 문제 → 해결 완료 (2026-05-27)
- 증상: 게시물 작성 시 "현재 로그인 유저의 학교 정보를 찾을 수 없습니다" 500 에러
- 원인: users RLS 정책에서 university_id 조회 시 무한 재귀 발생
- 해결: SELECT 정책을 `auth.uid() IS NOT NULL` 조건만 사용 (서브쿼리 제거)
- 민감 컬럼(role 등) 보호는 BEFORE UPDATE 트리거로 분리
- 마이그레이션: `20260527150000_enable_users_rls_with_sensitive_column_protection.sql`

### Supabase Storage 버킷 정책 (2026-04-27)
- post-images, story-images, avatars 버킷 생성 후 정책 추가 필요
- 로그인 유저만 업로드, 조회는 공개

### 모달 내 링크 이동 이슈 (2026-05-18)
- 증상: PostDetail 모달 안에서 UserInfo 링크 클릭 시 모달이 닫히지 않고 뒤에서 페이지만 변경
- 원인: next/link는 router.push와 달리 모달 오버레이를 닫지 않음
- 해결 방향: UserInfo에 onClose? props 추가, 클릭 시 onClose() 호출 후 router.push()

### 이메일 인증 비활성화 (2026-05-19)
- Supabase Authentication → Email → Confirm email 토글 OFF (개발 편의)
- **배포 전 반드시 재활성화** (Supabase 대시보드에서 토글 ON)
- 재활성화 후 Site URL + Redirect URL 설정 필요 (`/auth/callback`)

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

### 6. 문서와 실제 버전 불일치 → 해결 완료 (2026-05-27)
- AGENTS.md, ARCHITECTURE.md Next.js 16 / React 19로 수정 완료
