# WORKLOG

날짜별 작업 기록. 작업 완료 후 반드시 업데이트.

---

## 2026-04-23

### 완료
- 서비스 방향 확정: 기존 팀빌딩 플랫폼(krew) → 대학생 실명 SNS(UniVerse)로 피봇
- 기획안 v1.0 작성 완료
- 프로토타입 화면 확인 (localhost:5173)
- 기술 스택 확정
  - Web: Next.js + TypeScript + Tailwind CSS + Supabase + Vercel
  - App (예정): Expo (React Native)
- `C:\dev\univer` 프로젝트 생성
- 문서 초기 세팅 (AGENTS.md, CLAUDE.md, docs/)
- Notion 문서 구조 세팅 (PRD, 로드맵, DB 스키마, 의사결정 로그, 작업 일지)

### 주요 결정사항
- 영상은 MVP 제외, 사진만 지원
- 팔로우 대신 유저 좋아요 시스템으로 피드 개인화
- 웹 먼저 완성 후 Expo로 앱 전환
- features/ 폴더에 로직 분리해서 앱 전환 시 재사용

### 다음 작업
- GitHub 레포 생성 및 초기 커밋
- Supabase 새 프로젝트 생성
- DB 스키마 마이그레이션 파일 작성
