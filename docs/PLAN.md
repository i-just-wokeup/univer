# PLAN

## 현재 진행 단계
**1단계: SNS MVP — 웹 MVP 안정화 및 배포 전 점검**

---

## 완료된 작업
- [x] 서비스 방향 확정 (대학생 실명 SNS UniVerse)
- [x] 기술 스택 확정
- [x] 화면 구조 및 라우팅 확정
- [x] 메인 레이아웃 껍데기 구현 (`Header`, `BottomTabBar`, `SideBar`, `app/(main)`)
- [x] 학교 이메일 매직링크 로그인 기본 흐름 구현
- [x] 이메일 + 비밀번호 로그인 / 회원가입 / 온보딩 구현
- [x] 게시물 작성 페이지 및 이미지 업로드 저장 로직 구현
- [x] 피드 조회 API (`getFeed`) 구현
- [x] 피드 UI 1차 구현 (`PostCard`, `FeedList`, `app/(main)/page.tsx` 연결)
- [x] 웹 사이드바 고정 및 피드 레이아웃 1차 보정
- [x] DB 스키마 설계 완료 (24개 테이블)
- [x] 프로젝트 폴더 생성 (`C:\dev\univer`)
- [x] Next.js 프로젝트 생성
- [x] GitHub 레포 생성 및 초기 커밋
- [x] 문서 세팅 (AGENTS.md, CLAUDE.md, docs/)
- [x] Supabase universe 프로젝트 생성
- [x] 환경변수 설정 (.env.local)
- [x] Notion 문서 세팅
- [x] 게시물 수정/삭제 구현
- [x] 토스트 메시지 구현 및 피드 연결
- [x] 스토리 업로드/스토리바/뷰어 구현
- [x] ConfirmDialog 공용 컴포넌트 구현
- [x] stories RLS soft delete 호환 정책 수정
- [x] database.types.ts users real_name 컬럼 반영
- [x] 프로필 조회 API 1차 구현 (`src/features/profile/api.ts`)
- [x] 프로필 페이지 1차 구현 (`/profile/[nickname]`)
- [x] 프로필 편집 페이지 구현 (`/profile/edit`)
- [x] 프로필 수정 로직 분리 (`src/features/profile/mutations.ts`)
- [x] 로그아웃 API 추가 (`signOut()`)
- [x] 전체 button 태그 cursor-pointer 전역 적용
- [x] 설정 페이지 (`/settings`) — 로그아웃 포함
- [x] 프로필 편집에서 로그아웃 버튼 제거
- [x] 프로필 페이지에 설정 아이콘(톱니바퀴) 추가
- [x] 자체 헤더 화면용 `(sub)` route group 분리
- [x] 게시물 상세 UI 컴포넌트 구현 (`PostDetail`)
- [x] 게시물 상세 직접 접근 페이지 구현 (`/posts/[postId]`)
- [x] 게시물 상세 웹 인터셉트 모달 구현 (`@modal/(.)posts/[postId]`)
- [x] 게시물 상세 모달 (썸네일 클릭 시)
- [x] 프로필 게시물 썸네일 상세 이동 연결
- [x] Avatar 공용 컴포넌트 구현 및 피드/댓글/스토리/프로필 적용
- [x] UserInfo 공용 컴포넌트 (프로필 링크)
- [x] NavItems 클라이언트 컴포넌트 구현 및 현재 경로 기반 활성 상태 처리
- [x] 모달 내 UserInfo 링크 클릭 시 모달 닫기 처리
- [x] 사이드바 프로필 활성화 조건 수정
- [x] 스토리바 내 스토리 아바타 및 그라데이션 링 UI 적용
- [x] 게시물 작성 페이지 `/write` 경로 추가 및 작성/수정 링크 변경
- [x] 메인 피드 컬럼 폭 `max-w-[470px]` 복구
- [x] 게시물 미디어 테이블 `post_images` → `post_media` 전환 반영
- [x] `reports` 테이블 신규 생성
- [x] 피드/스토리 신고 API 연결
- [x] 유저 앱 신고 버튼 기능
- [x] 알림 API 및 웹/모바일 알림 UI 구현
- [x] 알림 시스템
- [x] 관리자 페이지 1차 구현 (`/admin`, `/admin/reports`, `/admin/users`)
- [x] 관리자 페이지 구현
- [x] 회원가입 플로우 재설계
- [x] 유저 검색
- [x] 친구(크루) 시스템 구현
- [x] React 19/Next 16 hook lint 에러 수정 및 build 검증
- [x] 크루 목록 및 요청 관리 페이지 구현 (`/profile/connections`)
- [x] 스토리 목록 정렬 개선 (내 스토리 → 크루 → 같은 학교)
- [x] 크로스 유저 스토리 네비게이션 구현
- [x] 스토리 뷰어 3열 그리드 레이아웃 보정
- [x] 기존 `/posts/write` 라우트 삭제
- [x] 채팅 (1:1 DM) 1차 구현
- [x] 채팅 메시지 페이지네이션 (최신 50개 초기 로드, 스크롤 위로 이전 메시지 추가 로드)
- [x] 채팅 메시지 낙관적 전송 처리 (임시 메시지 추가/교체/실패 제거, Realtime 중복 방지)
- [x] 채팅 전송 후 UX 보정 (입력창 포커스 유지, 전송 후 하단 스크롤)
- [x] 채팅 연속 전송 UX 개선 (전송 중 입력창 잠금 제거)
- [x] 채팅 수신 메시지 자동 스크롤 (상대방 메시지 수신 시 하단 자동 이동)
- [x] 채팅방 fullscreen route group 분리 (하단 탭바/사이드바 제거, `h-dvh` 전용 레이아웃)
- [x] 채팅 전송 후 모바일 키보드 깜빡임 완화 (조건부 focus, 중복 스크롤/reload 제거)
- [x] 채팅 Realtime 구독 필터 수정 및 publication 등록 migration 추가
- [x] 프로필 대표 링크 기능 구현 (`profile_links` 다중 확장 구조, 프로필 편집/표시)
- [x] 계정 탈퇴/복구 RPC soft delete 정책 보강 (게시글/스토리/댓글/메시지 복구 가능)
- [x] 국민대 Google 로그인/가입, 비밀번호 재설정, 친구 한정 실명 표시 구현
- [x] Supabase migration 로컬 파일 정리 (supabase/migrations/ 생성, 누락 4개 수동 추가)
- [x] **users 테이블 RLS 활성화 + 민감 컬럼 보호 트리거** (자가 admin 승격 방지, 개인정보 노출 차단)
- [x] **보안 패치** — anon 함수 실행 차단, Storage 파일 목록 노출 차단, 함수 search_path 고정
- [x] **Google OAuth 연동** — 국민대 Google Workspace, 이름+학과 자동 파싱 저장 (프로필 사진 제외)
- [x] **실명 공개 범위** — 친구(accepted)이거나 본인일 때만 프로필에서 실명 노출
- [x] **Supabase Auth 설정** — 최소 비밀번호 8자, Letters+digits 조합 강제

## 진행 중인 작업
- [ ] Google 인증/실명 저장 migration 원격 적용 및 OAuth 실사용 테스트
- [ ] 배포 전 필수 항목 점검 (Cron Job, 이메일 인증 Resend 연동, Storage 정책)
- [ ] 계정 탈퇴/복구 soft delete 실사용 테스트

## 다음 작업 (순서대로)

1. Google 인증/실명 저장 migration 원격 적용 및 OAuth 실사용 테스트
2. Resend 이메일 연동 + 이메일 인증 재활성화
3. Cron Job 설정 (스토리 24시간 만료, 게시물 30일 완전 삭제)
4. 계정 탈퇴/복구 실사용 테스트
5. Expo 앱 전환 준비

### 검증 필요
- [ ] Google OAuth 신규 가입 시 이름+학과 자동 저장 확인
- [ ] 친구 아닌 유저 프로필에서 실명 안 뜨는지 확인
- [ ] 계정 탈퇴 후 피드/프로필/채팅 목록에서 탈퇴 유저 콘텐츠가 정상적으로 숨겨지는지 확인
- [ ] `restore_account()` 호출 시 30일 내 계정과 작성 콘텐츠가 정상 복구되는지 확인

### 앱 전환 전 정리 체크리스트
- [ ] `features/chat/api.ts`의 `window.dispatchEvent` 제거 또는 hook 레이어로 이동
- [ ] `features/chat/hooks.ts`의 `window` 이벤트 사용을 웹 전용 refresh bus로 분리
- [ ] `features/auth/api.ts`의 `window.location.origin` 기반 redirect를 플랫폼별 callback URL 주입 방식으로 변경
- [ ] `features/search/history.ts`의 `localStorage` 접근을 웹 storage adapter로 분리
- [ ] 이미지 업로드 API의 `File` 의존성(`uploadPostImages`, `uploadStoryImage`, `uploadAvatar`)을 앱 업로드 입력 타입과 분리
- [ ] `features/*/api.ts`에서 DOM/Next Router 의존성이 새로 들어오지 않도록 점검
- [ ] Expo 전환 시 재사용할 핵심 타입 정리: Profile, FeedPost, StoryGroup, Message, Conversation

### 1단계 — SNS MVP
1. **인증** — 학교 이메일 가입, 구글/카카오, 온보딩 (학교/학과/닉네임)
   - 완료: 학교 이메일 도메인 검증, 이메일+비밀번호 로그인, 회원가입, 온보딩 저장, middleware 보호 재활성화
   - 완료: users 타입에 real_name 컬럼 반영
   - 완료: 회원가입 이메일 인증 리다이렉트(`/auth/callback`) 및 인증 메일 발송 완료 화면 적용
   - 완료: 계정 탈퇴 RPC 연동 및 설정 페이지 탈퇴 흐름 구현
   - 남음: 비밀번호 재설정 등 부가 흐름
2. **레이아웃** — 모바일/웹 공통 레이아웃, Header, BottomTabBar, SideBar
   - 완료: 메인 화면 껍데기 및 반응형 3단 레이아웃
   - 완료: 현재 경로 기반 사이드바/하단탭 활성 상태 처리
   - 완료: NavItems 클라이언트 컴포넌트 분리
   - 완료: Avatar 공용 컴포넌트 기반 프로필 아이콘 표시
   - 완료: 메인 피드 컬럼 폭 `max-w-[470px]` 복구
   - 완료: `/search` 유저 검색 페이지 및 최근 검색 UI 구현
3. **피드** — 게시물 CRUD, 사진 업로드, 무한 스크롤
   - 완료: 게시물 이미지 업로더 UI 추가
   - 완료: 게시물 작성 페이지 UI 및 저장 로직 추가
   - 완료: `getFeed`, `PostCard`, `FeedList`, 메인 피드 연결
   - 완료: UserInfo 공용 컴포넌트로 작성자 아바타+닉네임 링크 공통화
   - 완료: 피드 이미지 원본 비율 표시 (object-contain, 검정 배경)
   - 완료: 무한 스크롤
   - 완료: PostCard 이미지 슬라이드 화살표 버튼
   - 완료: 좋아요 기능 (DB 연결 + 낙관적 업데이트)
   - 완료: 댓글 / 대댓글 API 1차 구현
   - 완료: 댓글 바텀시트 UI 및 피드 연결
   - 완료: 댓글 좋아요 기능 (DB 연결 + 낙관적 업데이트)
   - 완료: 대댓글 1단계 중첩 UI 및 hard delete 전환
   - 완료: 게시물 수정 모드 (본문/해시태그 수정, 이미지 읽기 전용)
   - 완료: PostCard ... 버튼 메뉴 (본인: 수정/삭제/링크 복사 / 타인: 신고/차단/링크 복사)
   - 완료: 게시물 삭제 soft delete 및 피드 즉시 제거
   - 완료: 토스트 메시지 컴포넌트 및 작성/수정/삭제/링크 복사 피드백 연결
   - 완료: 더보기 버튼 (텍스트 말줄임)
   - 완료: 게시물 상세 UI 컴포넌트 및 `/posts/[postId]` 직접 접근 페이지 구현
   - 완료: 웹 인터셉트 모달 및 프로필 썸네일 상세 이동 연결
   - 완료: 게시물 작성/수정 진입 경로 `/write` 추가 및 링크 변경
   - 완료: 게시물 미디어 테이블 `post_media` 전환 및 `PostMedia` 타입 적용
   - 완료: 게시물 상세 데스크톱 모달 이미지/댓글 입력 레이아웃 보정
   - 완료: 게시물 상세 댓글 좋아요/대댓글/답글달기 기능 복구
   - 완료: 게시물 상세 컴포넌트 파일 분리
   - 완료: 기존 `/posts/write` 라우트 삭제
   - 다음: 좋아요 목록 모달
4. **좋아요 / 댓글 / 대댓글**
5. **스토리** — 업로드, 뷰어, 24시간 자동 만료
   - 완료: `StoryBar` UI 추가, 더미 데이터 제거 완료
   - 완료: 스토리 작성 1차 구현 (사진 1장 업로드, stories 저장, 24시간 만료 설정)
   - 완료: 스토리바 실제 데이터 조회 연결 (같은 학교/만료 전/읽음 여부/본인 우선)
   - 완료: 내 스토리 생성 아이템 아바타 표시, 내 스토리 중복 제거, 진입/생성 클릭 분리
   - 완료: 스토리 뷰어 연결 (9:16 비율, 5초 자동 진행, 조회 기록, 본인 조회자 목록, 좋아요)
   - 완료: 스토리 삭제 soft delete 및 ... 메뉴 연결
   - 완료: stories SELECT RLS soft delete 호환 정책 수정
   - 완료: ConfirmDialog 공용 컴포넌트 및 스토리 삭제 확인 흐름 연결
   - 완료: 스토리바 정렬을 내 스토리 → 크루 → 같은 학교 순서로 개선
   - 완료: 스토리 뷰어에서 이전/다음 유저 스토리 이동 및 사이드 프리뷰 구현
   - 완료: 스토리 뷰어 3열 그리드 배치 및 화살표 위치 보정
   - 다음: 스토리 UI/UX 개선
6. **프로필 페이지**
   - 완료: 프로필 조회/프로필 게시물/게시물 수 API 1차 구현
   - 완료: `/profile/[nickname]` 페이지 1차 구현 (프로필 영역, 게시물 3열 그리드, 로딩 스켈레톤)
   - 완료: `/profile/me` 현재 유저 프로필 alias 처리
   - 완료: 프로필 게시물 그리드 모바일 전체 폭 확장 및 탭 구분선 추가
   - 완료: 프로필 게시물 그리드 웹 폭 확장
   - 완료: 프로필 버튼에 현재 유저 프로필 사진 표시
   - 완료: 프로필 편집 페이지 구현 (프로필 사진/닉네임/소개 수정)
   - 완료: `features/profile/mutations.ts` 분리
   - 완료: `signOut()` 추가
   - 완료: 전체 button 태그 cursor-pointer 전역 적용
   - 완료: 설정 페이지 구현 (`/settings`, 로그아웃 포함)
   - 완료: 본인 프로필 설정 아이콘 추가
   - 완료: 프로필 편집 페이지 로그아웃 버튼 제거
   - 완료: 자체 헤더 화면용 `(sub)` route group 분리
   - 완료: 프로필 게시물 썸네일 상세 이동 연결
   - 완료: 타인 프로필 친구 신청/수락/거절/삭제 UI 및 RPC 연동
   - 완료: 프로필 대표 링크 저장/표시 구현 (`profile_links` 테이블 기반, 추후 다중 링크 확장 가능)
   - 완료: `profile_links` 원격 Supabase migration 적용 및 로컬 저장/표시 테스트
   - 완료: 관리자 전용 레이아웃, 대시보드, 신고 관리, 유저 관리 1차 구현
   - 다음: 관리자 액션 범위 확장
7. **유저 좋아요 + 친한친구**
   - 완료: `user_connections` 기반 친구 신청/수락/거절/삭제 흐름 적용
   - 완료: 크루 목록/받은 요청/보낸 요청 관리 페이지 구현
   - 다음: 친한친구 기능 설계 및 구현
8. **북마크 / 해시태그**
9. **알림**
   - 완료: `features/notifications/api.ts` 신규 생성 (`getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`)
   - 완료: 웹 알림 패널 구현 (사이드바 벨 클릭, 전체 읽음, 읽음 상태, 썸네일, 이동 처리)
   - 완료: 모바일 알림 페이지 구현 (`/notifications`)
   - 완료: Header/NavItems 벨 아이콘 읽지 않은 알림 뱃지 표시
   - 완료: 알림 목록 actor 닉네임 역추적 표시 보정
   - 완료: 친구 신청/수락 알림 타입 반영
10. **차단 / 신고**
   - 완료: `reports` 테이블 기반 피드 게시물/스토리 신고 연결
   - 완료: 신고 전 확인 다이얼로그 및 성공/실패 피드백 연결

### 2단계 — 채팅
- 방식: Supabase Realtime 기반 1:1 DM (외부 라이브러리 없이 자체 구현)
- DB: conversations (대화방), messages (메시지 + read_at 읽음처리)
- 완료:
  - `features/chat/api.ts` + `hooks.ts` (Realtime 구독 포함)
  - `components/chat/` (`ConversationItem`, `MessageBubble`, `MessageInput`)
  - `/messages` (대화 목록), `/messages/[conversationId]` (채팅방)
  - 프로필 페이지 "메시지 보내기" 버튼
  - 헤더/사이드바 메시지 아이콘 뱃지 (안읽은 메시지 수, Realtime 즉시 갱신)
  - 메시지 간격 축소, 시간 표시 hover 시 옆에 표시, 5분 구분선
  - NavItems Realtime 채널 중복 버그 수정
  - 메시지 낙관적 전송 처리 및 Realtime 중복 표시 방지
  - 전송 후 입력창 포커스 유지 및 하단 스크롤 보정
  - 채팅방을 `(fullscreen)` route group으로 분리하고 뒤로가기를 `/messages`로 고정
  - 메시지 구독 filter 복구 및 채팅 테이블 Realtime publication 등록
- MVP 제외: 사진 전송, 타이핑 인디케이터, 메시지 삭제/수정, 그룹채팅, 읽음 실시간 반영

### 3단계 — 커뮤니티
- 자유게시판, 베스트, 수업찾기 (카테고리 확정 후)

### 4단계 — 앱 전환
- Expo 세팅, 모노레포 구조 전환

## 2026-04-28 업데이트

### 방금 완료
- [x] 메인 피드 초기 연결 완료
- [x] 피드 카드 / 스토리바 / 웹 사이드바 1차 레이아웃 보정 완료
- [x] 웹 사이드바 sticky 고정 처리 완료
- [x] 인증/피드/스토리/Supabase 유틸 주석 정리 및 운영 문서 최신화 완료

### 남은 점검
1. 배포 전 이메일 인증/리다이렉트 설정 확인
2. 배포 후 스토리 만료 정리용 Cron Job 구성
3. Storage 업로드 정책 및 파일 크기/type 제한 점검
4. 핵심 플로우 실기기 테스트 후 치명 버그만 수정

## 주의사항
- 영상 업로드는 MVP 제외 (사진만)
- 디자인은 나중에, 지금은 구조/로직 우선
- 모든 컴포넌트 모바일 퍼스트 (375px)
- features/ 로직은 UI와 반드시 분리 (앱 전환 대비)
- Supabase 쿼리는 features/*/api.ts 에서만
