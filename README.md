# UniVerse

대학생 실명 SNS 커뮤니티 플랫폼. 1차 타겟: 국민대학교.
같은 학교 가입 즉시 전원 자동 연결, 팔로우 없음.

## 스택

- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase (Auth, DB, Storage, Realtime)
- Vercel 배포

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 문서

- `AGENTS.md` — 에이전트 컨텍스트 및 개발 원칙
- `docs/ARCHITECTURE.md` — 아키텍처, 라우팅, 디렉토리 구조
- `docs/DATABASE.md` — DB 스키마 및 RLS 정책
- `docs/PLAN.md` — 현재 진행 중인 작업 및 다음 작업
- `docs/WORKLOG.md` — 날짜별 완료 기록
- `docs/DECISIONS.md` — 주요 결정사항 기록
- `docs/NOTES.md` — 개발 주의사항 및 트러블슈팅
