# WORKLOG

작업 완료 후 날짜별로 누적 기록.

---

## 2026-04-27

### 완료
- 서비스 방향 확정 (팀빌딩 krew → 대학생 실명 SNS UniVerse 피봇)
- 기획안 v1.0 작성
- 프로토타입 화면 확인 (localhost:5173 — 모바일/웹 뷰)
- 기술 스택 확정
  - Web: Next.js 14 + TypeScript + Tailwind CSS + Supabase + Vercel
  - App (예정): Expo (React Native)
- `C:\dev\univer` 프로젝트 생성 + GitHub 레포 초기 커밋
- 문서 세팅 완료 (AGENTS.md, CLAUDE.md, docs/ 전체)
- Notion 문서 구조 세팅 (PRD, 로드맵, DB 스키마, 의사결정 로그, 작업 일지)
- Supabase universe 프로젝트 생성 + 환경변수 설정
- DB 스키마 설계 완료 (총 23개 테이블)
- 화면 구조 확정 (모바일/웹 레이아웃, 라우팅)
- 개발 단계 순서 확정 (SNS → 채팅 → 커뮤니티 → 앱전환 → 부가기능)

### 주요 결정사항
- 친한친구 기능 추가 (일방적, close_friends 테이블)
- 게시물/스토리 visibility: 'public' | 'close_friends'
- 채팅이 커뮤니티보다 우선 (2단계)
- 커뮤니티 댓글 별도 테이블 (community_comments)
- 모바일 하단 탭: 홈 | 검색 | + | 카테고리 | 프로필
- 채팅/알림은 헤더 우측 아이콘으로
- 도구별 역할 분담 확정 (Claude: 문서/설계, Claude Code: 구현, Codex: 리뷰)

### 다음 작업
- [ ] DB 마이그레이션 파일 작성 (1단계 17개 테이블)
- [ ] Supabase 마이그레이션 적용
- [ ] Claude Code로 인증 구현 시작
