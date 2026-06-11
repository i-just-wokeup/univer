# UNIVER — Agent Context

## 서비스
대학생 실명 SNS 커뮤니티 플랫폼. 1차 타겟: 국민대학교.
국민대 MVP는 같은 학교 공개/크루공개 중심, 다학교 확장 시 팔로우 기반 탐색/피드 확장 예정.

## 도구별 역할 분담
- **Claude (claude.ai)** — 문서 작성, DB 스키마 설계, 방향 논의 및 결정
- **Claude Code** — 실제 코드 구현 담당
- **Codex** — 실제 코드 구현 담당 (Claude Code와 동일한 역할)

## 스택
- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase (Auth, DB, Storage, Realtime) / Vercel 배포
- 앱 전환 예정: Expo (React Native)

## 핵심 결정사항
- 기존 krew(팀빌딩) 버리고 새 프로젝트로 시작
- 영상 MVP 제외, 사진만 지원
- 국민대 MVP는 학교 내 콘텐츠와 크루 공개 범위 우선
- 웹 먼저 완성 → Expo로 앱 전환
- 디자인은 나중에, 지금은 구조/로직 우선

## 개발 원칙
- `features/` 로직과 `components/` UI 반드시 분리 (앱 전환 재사용)
- Supabase 쿼리는 `features/*/api.ts` 에서만
- 모바일 퍼스트 (375px 기준)
- `any` 타입 금지 / soft delete: `deleted_at` 패턴
- 시간: UTC 저장, KST 출력

## 디렉토리
```
src/app/          ← 라우팅, API routes
src/components/   ← UI만 (공통/피드/스토리/레이아웃)
src/features/     ← 로직/훅/API (앱 전환 시 재사용)
src/lib/          ← Supabase 클라이언트, 유틸
src/types/        ← DB 타입
supabase/migrations/
docs/             ← 운영 문서
```

## 현재 진행상황
→ `docs/PLAN.md` 참고 (현재 작업 / 다음 작업)
→ `docs/WORKLOG.md` 참고 (날짜별 완료 기록)

## Supabase
- 프로젝트 ID: qmslcvnuzjraphvnaqxx
- 리전: ap-northeast-2 (서울)
- `.env.local`: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
- users RLS 활성화 완료 (2026-05-27) — 민감 컬럼(role/university_id/is_active/real_name 등) BEFORE UPDATE 트리거로 보호

## 현재 완료된 작업 요약
- 레이아웃 (Header, SideBar, BottomTabBar, 웹 3단 구조)
- 인증 (이메일+비밀번호 로그인/회원가입/온보딩/미들웨어)
- 게시물 작성(`/write`) + 이미지 업로드 + 수정/삭제 + 상세 페이지/웹 모달
- 피드 (getFeed limit 20, 무한 스크롤, PostCard/FeedList, 이미지 슬라이드, 비율 선택 표시)
- 피드 인터랙션 (좋아요/댓글/대댓글/댓글 좋아요/신고/차단/저장/토스트)
- 탐색 탭 1차 (같은 학교 공개 게시물 그리드, 무한 스크롤)
- 스토리 (업로드/스토리바/뷰어/삭제/RLS, 공개범위, 크루 우선 정렬, 유저 간 이동)
- 프로필 페이지 + 편집 페이지 + 설정 페이지 + 크루 관리(`/profile/connections`) + 대표 링크
- 내 활동(`/settings/activity`) — 스토리 보관함, 저장/좋아요/댓글 단 게시물, 즐겨찾기
- 채팅 1:1 DM (`/messages`, Realtime, 낙관적 전송, 모바일 fullscreen 채팅방)
- 유저 검색 + 최근 검색
- 알림 API + 웹 알림 패널 + 모바일 알림 페이지 + 뱃지
- 관리자 1차 페이지 (`/admin`, `/admin/reports`, `/admin/users`)
- 차단 기능 1~2차 (피드/검색/프로필/게시물/채팅 반영, 차단 목록/해제)
- 공용 컴포넌트 (Avatar, ActionSheet, ConfirmDialog, Toast)
- NavItems 클라이언트 컴포넌트

## 다음 작업
1. Supabase migration 원문 확보 및 로컬 파일 보강 (`docs/MIGRATION_SYNC.md`)
2. 탐색 상세 흐름 고도화 (탐색 게시물 연속 피드)
3. 모바일 게시물 상세/댓글 바텀시트 실제 기기 재확인
4. Expo 앱 전환 준비
5. 배포 전 필수 항목 점검 (Cron Job, Storage 정책, 비밀번호 재설정 메일)

## 작업 완료 후 필수 (Claude Code / Codex 모두 적용)
1. `docs/WORKLOG.md` 날짜 + 완료 내용 추가
2. `docs/PLAN.md` 완료 항목 체크 + 다음 작업 업데이트
3. 스키마 변경 시 `docs/DATABASE.md` 반영
4. **이 규칙 미준수 시 작업 완료로 인정하지 않음**

## 문서 규칙
- AGENTS.md / CLAUDE.md 는 100줄 이하 유지
- 상세 내용은 docs/ 폴더 각 문서에 작성
- 넘칠 것 같으면 해당 내용을 docs/로 이동 후 링크
