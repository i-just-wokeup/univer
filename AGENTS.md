# UNIVER — Agent Context

## 서비스
대학생 실명 SNS 커뮤니티 플랫폼. 1차 타겟: 국민대학교.
같은 학교 가입 즉시 전원 자동 연결, 팔로우 없음.

## 도구별 역할 분담
- **Claude (claude.ai)** — 문서 작성, DB 스키마 설계, 방향 논의 및 결정
- **Claude Code** — 실제 코드 구현 담당. 코드 작성 외 역할 없음
- **Codex** — 코드 검수, 리뷰, 보완점 피드백 담당. 코드 직접 작성 금지

## 스택
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase (Auth, DB, Storage, Realtime) / Vercel 배포
- 앱 전환 예정: Expo (React Native)

## 핵심 결정사항
- 기존 krew(팀빌딩) 버리고 새 프로젝트로 시작
- 영상 MVP 제외, 사진만 지원
- 팔로우 대신 유저 좋아요 시스템 (피드 개인화)
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
- 프로젝트 ID: (생성 후 기입)
- `.env.local`: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

## 작업 완료 후 필수 (Claude Code / Codex 모두 적용)
1. `docs/WORKLOG.md` 날짜 + 완료 내용 추가
2. `docs/PLAN.md` 완료 항목 체크 + 다음 작업 업데이트
3. 스키마 변경 시 `docs/DATABASE.md` 반영
4. **이 규칙 미준수 시 작업 완료로 인정하지 않음**

## 문서 규칙
- AGENTS.md / CLAUDE.md 는 100줄 이하 유지
- 상세 내용은 docs/ 폴더 각 문서에 작성
- 넘칠 것 같으면 해당 내용을 docs/로 이동 후 링크
