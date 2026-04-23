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

(발생하는 이슈들 여기에 추가)
