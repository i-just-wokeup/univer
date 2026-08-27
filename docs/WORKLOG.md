# WORKLOG

작업 완료 후 날짜별로 누적 기록.

---

## 2026-08-27

### 완료
- **앱 기관·승격 계정 팔로우 Phase 1** — 프로필 배지 로드가 끝난 기관·승격 타인 계정에 `팔로우/팔로잉 | 메시지` 액션을 노출하고, API 상태 조회와 낙관적 토글·팔로워 수 증감·실패 롤백·연타 방지를 feature 훅으로 분리했다. 기관·승격 프로필 통계는 정적인 팔로워 수로 교체하고, 일반 학생의 크루 액션·크루 수·크루 관리 탭은 그대로 유지했다. 남은 범위는 팔로우 피드 밴드, 팔로워/팔로잉 목록, 알림이다.
- **앱 릴스 processing·failed 영상 노출 제외** — 홈 피드의 본인 업로드 진행 표시는 유지하면서, 릴스 조회 경로(`getReelsRanked`·`getVideoFeed`)는 모든 미디어가 `ready`인 게시물만 반환하도록 분리했다. 필터 전 랭킹/조회 행으로 페이지 커서를 계산해 제외 항목 때문에 다음 페이지 커서가 사라지지 않게 했다. 스토리는 기존처럼 본인에게 처리 상태를 보여주고 타인에게는 ready 이후 노출하는 정책을 유지한다.
- **웹 커뮤니티 가이드라인 아동 안전 표준 추가 및 초안 확정** — Google Play 아동 안전 표준(CSAE) 정책이 소셜 카테고리 앱에 공개 문서를 요구해, 별도 페이지 대신 이미 공개 경로인 커뮤니티 가이드라인에 `child-safety` 앵커 섹션을 추가했다. CSAE 전면 금지, 학교 계정 전용·만 18세 이상 이용 대상과 익명·무작위 매칭 미제공, 앱 내 신고 경로, 인지 즉시 삭제·영구정지 및 24시간 내 검토, 확인된 성착취물의 수사기관·NCMEC 신고, 담당 연락처를 명시했다. 함께 남아 있던 초안 배너를 제거하고 문의 연락처 플레이스홀더를 `unip.support@gmail.com`으로 확정했다.

## 2026-08-26

### 완료
- **앱 하단 프로필 탭 Android 활성 링 SVG 교체** — Android Fabric에서 RN View의 border와 배경 채움 모두 radius가 무시되어 사각형으로 렌더링됐다. 실패한 배경 채움 방식을 제거하고 활성 상태에만 30px SVG 원을 아바타 뒤에 그려, 플랫폼 border 렌더링에 의존하지 않는 2px 원형 링으로 교체했다. 비활성 상태와 링·아바타 크기, 테마 색은 유지했다.
- **앱 스토리 카메라 촬영 결과 9:16 정규화** — 내장 카메라 촬영 결과를 SDK 54 ImageManipulator의 컨텍스트 API로 디코딩해 표시 방향을 정규화하고, 가로 픽셀이 남는 기기는 세로로 회전한 뒤 중앙 9:16 영역을 잘라 저장하도록 했다. 갤러리 선택 경로와 스토리 뷰어는 변경하지 않았다.
- **앱 스토리 작성 동작 명확화** — 스토리 작성에서 크루공개 선택을 제거한 기존 변경을 유지하고, 즉시 게시되는 우측 하단 화살표 버튼을 `게시하기` 텍스트로 바꿨다. 처리 중 문구와 접근성 라벨도 `게시 중`·`스토리 게시`로 통일했다.
- **앱 Sentry 소스맵 업로드 설정 연결** — 프로덕션 빌드에서 소스맵 자동 업로드가 실패하던 구조를 해소했다. `app.json`의 `@sentry/react-native` 플러그인에 조직·프로젝트(`krew-7d` / `react-native`)를 지정하고, `eas.json` production 프로필에 `environment: "production"`을 추가해 EAS 환경변수가 빌드에 주입되도록 했다. 인증 토큰은 저장소에 넣지 않고 EAS 환경변수(production, Secret)로만 등록했으며 웹과 같은 조직 토큰을 재사용한다. development·preview 프로필의 업로드 비활성화 설정은 그대로 유지했다.
- **Google Play 앱 생성 및 앱 콘텐츠 선언 완료** — 신원인증 통과로 콘솔이 열려 `unip`(`com.univer.app`) 앱을 생성하고 출시에 필요한 선언을 모두 채웠다. 개인정보처리방침 URL, 심사용 로그인 정보(데모 계정 + 이메일·비밀번호 로그인 안내), 광고 없음, 콘텐츠 등급(IARC 소셜), 타겟층 만 18세 이상, 광고 ID 미사용을 선언했다. 데이터 안전 폼은 수집 항목(이름·이메일·사용자ID·기타 정보·사진·동영상·인앱 메시지·앱 상호작용·사용자 제작 콘텐츠·비정상 종료 로그·진단·기기 ID)을 등록하고 제3자 공유 없음, 전송 중 암호화, 웹 계정삭제 URL을 연결했다.
- **Android 프로덕션 AAB 빌드 성공** — `eas build -p android --profile production`으로 첫 배포용 번들을 만들었다. versionCode가 1에서 2로 자동 증가했고 키스토어는 EAS 원격 자격증명으로 자동 생성·사용됐으며 `production` 업데이트 채널과 브랜치가 함께 생성됐다. 비공개 테스트 트랙(Alpha)도 만들어 업로드를 준비했다.
- **iOS 프로덕션 빌드 착수** — 같은 커밋 기준으로 `eas build -p ios --profile production`을 실행했다. 기존 배포 인증서를 재사용하고 App Store 배포용 프로비저닝 프로파일을 새로 생성했다.

## 2026-08-25

### 완료
- **앱 게시물 상세 공유 기능 연결** — 프로필·탐색·알림 등에서 진입하는 게시물 상세 화면에 홈과 동일한 공유 시트를 연결해 대화·크루 전송, 전체공개 게시물 외부 링크 공유, 작성 가능한 본인 게시물의 스토리 리셰어를 지원한다. 기존 상세 피드백 함수를 공유 성공 안내에도 재사용했다.

## 2026-08-24

### 완료
- **앱 댓글 시트 키보드 여백 수정** — 댓글 시트 전체를 다시 줄이던 기본 `KeyboardAvoidingView`를 제거하고 채팅과 같은 `react-native-keyboard-controller`의 `KeyboardStickyView`로 입력 영역만 키보드에 붙였다. 키보드가 열린 동안 입력바의 safe-area 추가 여백을 제외하고, 피드백 토스트도 입력 영역과 함께 이동하도록 해 iOS·Android의 입력창 아래 과도한 간격을 줄였다.
- **웹·앱 검색의 해시태그 안내 제거** — 실제 검색 범위가 닉네임인 현재 동작에 맞춰 검색 입력 placeholder와 빈 검색 안내에서 해시태그 문구를 제거했다. 기존 게시물 해시태그 저장·표시 기능은 변경하지 않았다.
- **웹 데스크톱 사이드바·설정 화면 앱 디자인 정렬** — 데스크톱 전용 사이드바에 `/settings` 링크와 현재 경로 활성 표시를 추가하고, 웹의 보라색 바탕을 앱 라이트 팔레트의 중립 배경으로 교체했다. 설정 배경을 남은 화면 전체로 연결하고 콘텐츠만 적정 폭으로 제한했으며 카드 그림자를 제거했다. 사이드바 선택 상태는 옅은 중립색으로 정리하되 작성 버튼의 브랜드 보라는 유지했고, 모바일 하단 내비게이션 데이터는 변경하지 않았다.
- **앱 온보딩 키보드 회피·공식 계정 프로필 편집 정리** — 온보딩의 기본 `KeyboardAvoidingView`·`ScrollView` 조합을 설치된 `react-native-keyboard-controller`의 `KeyboardAwareScrollView`로 교체해 닉네임·학과 포커스 입력과 하단 약관·완료 버튼을 키보드 위에서 스크롤할 수 있게 했다. 이메일·비밀번호 공식 계정은 기존 세션 provider 판별을 재사용해 프로필 편집의 학과 행과 이름·학과 공개 토글을 숨기고, 일반 학생 계정의 편집 UI는 유지했다.
- **앱 이메일 계정 비밀번호 변경** — 설정에서 Supabase 세션의 `app_metadata.provider`와 email identity를 확인해 이메일·비밀번호 계정에만 비밀번호 변경 진입점을 노출했다. 전용 화면에서 현재 비밀번호를 `signInWithPassword`로 재확인한 뒤 새 비밀번호 일치, 8자 이상, 영문·숫자 조합, 기존 비밀번호와 다름을 검증하고 `updateUser`로 변경한다. 구글 계정은 설정 행을 숨기고 직접 경로 접근도 차단하며, 인증 호출·폼 상태·UI를 feature 훅과 컴포넌트로 분리했다.

## 2026-08-21

### 완료
- **웹 공식 계정 관리자 화면** — 기존 관리자 가드와 레이아웃을 재사용해 `/admin/officials`를 추가하고, 이메일·단체명·닉네임·학생회/동아리 유형으로 공식 계정을 생성하도록 `create-official-account` Edge Function 계약을 연결했다. 생성 직후 임시 비밀번호를 한 번 확인·복사할 수 있으며, `list_official_accounts` 목록에서 현재 유형과 이메일·생성일을 확인하고 `set_official_type`·`revoke_official` RPC로 유형 변경과 인증 해제를 처리한다. Supabase 호출은 feature API, 비동기 상태는 feature 훅, 폼·테이블은 순수 관리자 UI로 분리했다. 백엔드 배포 전에는 호출 검증이 제한되며 배포 후 실제 관리자 세션 검증이 필요하다.
- **앱 최근 업로드 홈피드 10분 유지** — 게시물 작성 성공 ID를 1회 소비 대신 업로드 시각이 있는 모듈 목록으로 보관하고, 10분 시간창 안의 본인 글을 홈 포커스·캐시 복원·랭크 재조회·당겨서 새로고침마다 최신순으로 상단에 다시 병합한다. 현재 목록에 있는 글은 재조회하지 않아 영상 processing→ready 폴링 결과를 유지하고, 없는 글만 기존 `getPost` hydration으로 불러온다. 홈 페이지 캐시에는 본인 글을 제외해 시간창 만료 후 캐시에서 되살아나지 않게 했으며 랭크 RPC의 본인 글 제외 정책과 타 사용자 노출에는 영향이 없다.
- **앱 Supabase 세션 토큰 자동 갱신 수명주기 연결** — 루트에서 한 번 마운트되는 `SessionProvider`가 기존 Supabase 모바일 싱글턴에 React Native `AppState`를 연결해 foreground 진입 시 `startAutoRefresh`, background·inactive 진입 시 `stopAutoRefresh`를 호출하도록 했다. 앱 시작 상태도 즉시 반영하고 Provider 언마운트 시 리스너 제거와 갱신 루프 중지를 수행해 장시간 실행 후 만료 토큰으로 Edge Function이 401을 반환하는 경로를 방지한다.
- **앱 업로드 직후 본인 홈피드 임시 표시** — 게시물 생성 성공 시 반환된 ID를 feature 계층의 1회성 채널로 전달하고, 홈피드가 마운트·포커스되거나 이미 구독 중일 때 기존 `getPost` hydration으로 본인 글을 확인해 목록 맨 앞에 중복 없이 추가한다. 영상은 processing 상태로 기존 홈 영상 폴링과 완료 토스트를 그대로 사용하며 이미지·글도 즉시 표시된다. 당겨서 새로고침하면 랭크 RPC 결과로 목록이 교체되어 본인 임시 글은 자연스럽게 제거되고, 새로고침 도중 늦게 끝난 임시 조회가 다시 prepend되지 않도록 첫 페이지 요청 세대로 방어했다.
- **앱 인코딩 중·실패 영상 타인 노출 차단** — 공용 피드 hydration에서 미디어가 ready가 아닌 타인 게시물을 제외해 홈피드·영상피드·릴스·상세에 일괄 적용하고, 스토리 목록도 processing/failed 상태는 작성자 본인에게만 남도록 필터링했다. 이미지는 항상 ready인 기존 계약과 본인의 업로드 진행·실패 확인 동작은 유지한다.
- **앱 하단 프로필 탭 아바타 표시** — 세션 컨텍스트가 기존 현재 사용자 프로필 조회 결과의 아바타 URL과 닉네임을 보관·노출하도록 확장하고, 하단 프로필 탭의 범용 아이콘을 공용 원형 Avatar와 활성 accent 링으로 교체했다. 프로필 저장 후 기존 세션 프로필 새로고침을 호출해 아바타·닉네임 변경이 탭바에 즉시 반영되며 로그아웃·계정 전환 시 캐시된 표시 정보는 제거된다.

---

## 2026-08-20

### 완료
- **웹 공개 고객지원 페이지 추가** — 로그인 없이 접근 가능한 고객지원 페이지에 unip 문의 이메일, 로그인·계정 삭제·신고/차단·비밀번호 재설정 FAQ와 이용약관·개인정보 처리방침·계정 삭제 링크를 제공하고 미들웨어 공개 허용목록에 등록했다.
- **웹 이용약관 UGC 정책 명시** — 이용약관에 타인 위협·괴롭힘, 음란물·불법 촬영물 등 부적절 콘텐츠 무관용 원칙과 앱 내 신고, 접수 후 24시간 이내 검토, 콘텐츠 삭제·이용자 차단·이용 정지 조치 및 unip.support@gmail.com 문의 경로를 추가했다. Apple App Store Guideline 1.2와 Google UGC 정책 대응용 초안이며 출시 전 법률 검토는 별도로 진행한다.
- **앱 게시물·댓글 금칙어 하드 차단** — 정상 문장과 겹치지 않는 최소 금칙어 목록과 공백·특수문자 우회 방지 정규화 함수를 moderation feature로 분리했다. 게시물 업로드·생성 및 댓글 INSERT 직전에 내용을 검사하고 금칙어가 포함되면 입력을 보존한 채 기존 피드백 토스트로 안내하며 네트워크 요청을 중단한다. 클라이언트 MVP 범위이며 서버 강제와 스토리 캡션·프로필 소개 필터는 후속 범위다.

---

## 2026-08-14

### 완료
- **승격 신청 자격 상향(최근 30일 3→5)** — 신규 프로 계정 신청 자격을 "게시물 10개 + 최근 30일 3개"에서 "게시물 10개 + 최근 30일 5개"로 올렸다. `request_promotion` RPC의 30일 게시물 하한과 거절 사유 문구, 앱 `PromotionCard` 안내 문구를 함께 5개로 맞췄다. 라이브 DB에 `create or replace`로 적용하고 마이그레이션 `20260814090000_promotion_require_5_posts_30d`로 파일화했다(파일 커밋 대기). 총 10개 조건과 기존 pending·심사 중 상태에는 영향이 없다.
- **웹 소비자 피드 영상 렌더 수정** — 낡은 소비자 웹 `PostCard`가 모든 미디어를 `next/image`로 그려, Cloudflare Stream 영상 URL(`videodelivery.net/*/manifest/video.m3u8`)이 이미지 컴포넌트에 들어가 홈피드 전체가 런타임 크래시하던 문제를 고쳤다. 쿼리는 이미 가져오지만 `PostMedia` 매핑에서 버려지던 `provider`/`provider_asset_id`를 타입과 getFeed·getPost 매핑에 복구하고, `PostCard`가 미디어 타입에 따라 Cloudflare는 iframe 플레이어, 레거시 MP4는 `<video>`, 사진은 기존 `<Image>`로 분기하도록 바꿨다(관리자 심사 화면과 동일 방식). 영상 URL을 더는 `next/image`에 넘기지 않아 `next.config.js` 도메인 등록도 불필요하다. 웹 tsc 통과, 브라우저 최종 확인·커밋 대기. 소비자 웹 전반 현대화는 별도 후속으로 남긴다.
- **승격 신청 앱 3단계** — 일반 계정의 인사이트 개요 하단에 `프로 계정` 신청 카드를 추가하고, 본인 `promotion_requests` 최신 상태를 RLS 범위에서 조회해 미신청·심사 중·거절 후 7일 쿨다운·승인 완료 상태를 표시한다. 게시물 수 자격은 클라이언트에서 복제하지 않고 `request_promotion` RPC에 전적으로 맡기며, 서버가 반환한 한글 거절 사유는 재사용 가능한 공용 피드백 토스트로 그대로 노출한다. 기관·승격 계정은 기존 배지 게이트로 카드를 숨기고, 승인·거절 알림에는 명시 문구와 인앱/푸시 `/insights` 이동을 연결했다. 앱 DB 타입에는 배포된 테이블·RPC·알림 union이 이미 반영돼 있어 중복 변경하지 않았으며 앱 tsc를 통과했다. Expo SDK 54 범위의 기존 JS/Supabase API만 사용해 네이티브 리빌드는 필요 없다.
- **승격 심사 게시물 세부 지표·댓글 패널** — `/admin/promotions`의 게시물 그리드 클릭 동작을 단순 미디어 라이트박스에서 미디어·단건 지표·댓글을 함께 보는 상세 모달로 확장했다. 사진, 레거시 MP4, Cloudflare Stream과 다중 미디어 전환을 유지하면서 조회·도달·좋아요·댓글·저장·공유 및 영상 완주율·평균 시청깊이를 표시한다. `get_post_insight_for_admin`과 `get_post_comments_for_admin`은 SECURITY DEFINER 내부에서 활성 관리자를 재검증하고 `PUBLIC`/anon 실행을 차단한다. 원격의 `comments`가 로컬 초기 이력과 달리 `deleted_at` 없이 hard delete되는 실제 스키마임을 검증 중 확인해 보정 마이그레이션을 추가했다. 관리자 정상 반환, 비관리자 `42501`, anon ACL을 롤백 트랜잭션으로 확인했다.
- **승격 신청 웹 관리자 2단계** — 관리자 사이드바에 `/admin/promotions`를 추가하고 대기 신청 목록과 선택형 심사 패널을 연결했다. `features/admin/api.ts`가 `get_promotion_requests_for_admin` 응답을 정규화하고 신청자의 RLS 허용 게시물·전체 미디어를 조립하며, 심사 화면은 게시물·최근 활동·조회·도달·참여·참여율·영상·평균 완주율 성적표와 게시물 그리드를 제공한다. 미디어는 Cloudflare Stream iframe, 레거시 MP4 video, 이미지 라이트박스로 구분하고 승인·거절 후 RPC 목록을 즉시 갱신해 처리 건을 제거한 뒤 토스트를 표시한다. 관리자 미들웨어와 RPC 내부 관리자 검증을 그대로 재사용했으며 웹 ESLint·tsc를 통과했다.
- **승격 신청 DB 1단계** — 개인 크리에이터 신청용 `promotion_requests` 테이블에 본인 SELECT RLS, 유저별 pending 1건 부분 유니크, 상태·신청자·심사자 인덱스를 추가하고 직접 쓰기 권한을 회수했다. `request_promotion`은 활성 일반 계정의 게시물 10개·최근 30일 3개 자격, pending 중복, 거절 후 7일 쿨다운을 검증한다. 관리자 전용 성적표 RPC는 게시물·조회·피드 도달 고유 계정·좋아요/댓글/저장/공유 참여·영상·평균 완주율을 반환하며, 승인/거절 RPC는 pending 행 잠금·심사자 기록·승격 플래그 변경·인앱 알림을 원자적으로 처리한다. 보호 트리거는 `is_promoted`에 한해 실제 활성 관리자 호출자만 허용하고 다른 민감 컬럼 보호를 유지했다. 알림 CHECK와 푸시 트리거를 `promotion_approved`/`promotion_rejected`까지 확장했으며, 롤백 트랜잭션으로 자격 미달·중복·쿨다운·비관리자 호출·직접 승격 거부, 관리자 승인/거절·알림·ACL·빈 search_path를 검증했다.
- **인사이트 지표 용어·네이밍 정리** — metrics API 상단에 조회(열람·재생 총 횟수), 도달(피드 노출 고유 계정), 상호작용(좋아요·댓글·저장·공유), 영상 시청 지표와 화면별 범위를 한 곳에 명시하고 각 집계 함수가 세는 대상을 주석으로 구분했다. 일반 계정도 개요 인사이트를 볼 수 있는 현재 정책과 혼동되던 프로필 버튼 prop `canViewInsights`는 실제 역할에 맞게 `showInsightsButton`으로 변경했다. 계산·노출 조건은 변경하지 않았다.
- **인사이트 정확성 배치 A** — 개요 도달을 릴스·게시물 상세 열람 고유값의 단순 합산에서 홈 피드 실제 노출 기록인 `post_impressions`의 기간 전체 distinct viewer로 교체하고, KST 일별 고유 도달 추이도 함께 제공하는 `get_post_impression_reach` RPC를 추가했다. 게시물 상세 `get_post_insight` 역시 조회수는 기존 원시 이벤트를 유지하되 도달만 해당 글의 피드 노출 고유 계정으로 통일했다. `useInsights`와 `useContentPerformance`에는 요청 세대 무효화를 적용해 기간 전환·탭 종료 뒤 늦은 응답이 최신 상태를 덮지 못하게 했으며, 지표 집계 RPC 오류는 0/빈 배열로 숨기지 않고 화면 오류 상태로 전달한다. 미사용 앱 함수 `canViewInsights`와 계정 전체 영상 요약 래퍼·타입도 제거했다.
- **RPC 보안 감사 배치 2(중간·하드닝)** — `search_users`는 양방향 차단 사용자를 SQL에서 제외하고, `get_user_real_name`은 차단 관계면 공개 설정·크루 여부보다 먼저 `null`을 반환하며, `get_connection_status`는 차단 관계의 연결 상태와 크루 수를 `none`/0으로 마스킹한다. `recount_post_likes`·`recount_post_comments`·`recount_comment_likes`·`recount_story_views`에는 소유자·상호작용 당사자 검증을 추가했으며, unlike/comment delete 뒤 행이 이미 삭제되는 기존 호출 순서를 위해 게시물 공개범위·같은 학교·accepted 크루·비차단 조건상 실제 상호작용 가능한 사용자도 허용한다. 원격에만 있던 `record_metric`·`get_metric_counts`·`get_metric_daily`·`recount_*` 4개·`get_verified_user_ids`의 최종 정의를 `20260814030746_secure_medium_rpcs_batch_2`로 로컬 백필하고, 지표 집계·배지 RPC는 공개 호출 경로가 없어 `PUBLIC`/`anon` 실행 권한을 회수했다. 홈·릴스·인기 정렬 RPC는 limit을 1~100으로 제한하고 인기 offset을 0~10000, 반감기를 유효 범위로 정규화했으며 수정 함수는 빈 `search_path`와 완전 수식명을 사용한다. 전체 마이그레이션 사전 롤백과 원격 적용 후 별도 롤백 트랜잭션으로 차단 전후 검색·실명·연결 상태, recount 허용/거부, 인자 클램프, 8개 함수 존재, ACL과 `search_path`를 검증했다.
- **고위험 RPC 보안 감사 배치 1** — `record_metric`과 `record_reel_watch`에서 클라이언트가 넘기던 owner 인자를 제거하고, 게시물·프로필·프로필 링크의 실제 소유자를 서버가 target에서 계산하도록 변경해 타인 지표 위조 경로를 차단했다. 링크 클릭은 `profile_links.id`로 소유권을 검증한 뒤 기존 집계와 일일 중복 방지를 유지하도록 canonical URL을 저장한다. `send_friend_request`/`accept_friend_request`는 기존 기관·승격 차단에 더해 양쪽 사용자의 활성·미탈퇴, 같은 학교, 양방향 차단 없음 조건을 SECURITY DEFINER 내부에서 검증한다. `user_connections`에는 무방향 유니크 인덱스를 추가하고 역방향 pending 신청은 새 행 대신 accepted로 자동 전환한다. 원격 적용 후 롤백 트랜잭션으로 정상 지표 기록, 무효 target 미기록, owner 서버 계산, 링크 ID→URL 정규화, 릴스 시청 멱등 기록, 역방향 자동 수락, 일반 신청·수락, 차단 관계 거부, 이전 시그니처 제거와 RPC ACL·인덱스를 검증했으며 앱 tsc를 통과했다.

---

## 2026-08-13

### 완료
- **승격·기관 계정 프로필 인사이트 진입점** — 내 프로필의 프로필 편집 버튼 옆에 인사이트 버튼을 추가했다. 기존 계정 배지 캐시가 로드된 뒤 승격 또는 학생회·동아리 소속으로 확인된 본인에게만 표시하고, 미로드·실패·일반 계정에는 숨기는 fail-closed 조건을 적용했다. 버튼은 `/insights`로 이동하며 일반 계정의 기존 프로필 편집 단일 버튼 레이아웃은 유지한다.
- **앱 게시물 인사이트 상세 + 영상 시청 유지율 곡선** — 기관·승격 계정의 콘텐츠 성과 행을 `/insights/post/[id]` 상세 화면으로 연결해 게시물 썸네일·작성일, 조회·도달, 좋아요·댓글·저장·공유를 단건으로 확인할 수 있게 했다. 영상 게시물은 완주율·평균 시청깊이·평균 반복재생과 0~100%를 5% 간격으로 집계한 시청 유지율 면적 차트를 추가하고, 실제 영상 길이를 기준으로 0초·중간·끝 x축을 표시한다. `get_post_insight`/`get_post_retention` RPC는 SECURITY DEFINER이지만 `auth.uid()`의 삭제되지 않은 본인 글만 반환하고 `public`/`anon` 실행 권한을 회수했다. 유지율은 기존 `reel_watch_events.max_pct` 분포에서 계산해 별도 드롭오프 원시 저장을 추가하지 않았으며, 대표 영상 길이는 세션 duration 중앙값을 사용한다. 원격 롤백 트랜잭션에서 본인 영상의 21개 버킷 반환, 타 계정 0행, authenticated/anon ACL을 검증했고 앱 tsc를 통과했다.
- **릴스 영상 시청 D 지표 수집·집계** — 활성 릴스 재생 구간을 별도 `reel_watch_events` 원시 이벤트로 기록해 완주율·평균 시청깊이·평균 반복재생·평균 이탈지점을 계산할 기반을 연결했다. 클라이언트는 `expo-video`의 0.25초 `timeUpdate`를 headless 추적 컴포넌트에 격리해 카드 전체 리렌더를 피하고, 비활성 전환·언마운트·앱 백그라운드에서 세션을 확정한다. 첫 재생 최대 진행률, 85%→15% 루프, 95% 완주를 추적하며 실제 재생 누적 1초 미만과 본인 영상 시청은 제외한다. DB는 RLS 활성·정책 없음과 테이블 권한 회수로 원시 행 직접 접근을 막고, `record_reel_watch`가 실제 영상 게시물 owner를 재검증하며 `event_id`로 멱등 기록한다. `get_video_watch_summary`는 삭제되지 않은 본인 영상의 KST 기간 세션만 집계한다. 원격 롤백 검증에서 40% 이탈 1건+98%/1회 루프 완주 1건이 `sessions=2`, `completion_rate=50`, `avg_depth=69`, `avg_loops=0.5`, `avg_exit_pct=40`으로 계산됐고, 중복 재전송 1건 유지·본인 시청 0건·RPC/table ACL을 확인했다. 앱 tsc 통과. 대시보드 UI와 드롭오프 곡선·`watched_ms` 저장은 후속이다.
- **앱 인사이트 기간 선택·용어 정리** — 개요 상단의 일간/주간/월간 세그먼트를 공용 `ActionSheet` 기반 기간 드롭다운으로 교체해 확장 가능한 선택 구조로 정리하고 날짜 범위 표시는 유지했다. 좋아요·댓글·저장·공유 합계의 화면 라벨은 개요·누적 성과·게시물별 성과에서 모두 "참여"로 통일했으며 계산식과 집계 데이터는 변경하지 않았다.
- **앱 인사이트 대시보드 v1 재편** — 설정의 인사이트를 일반 계정용 개요와 기관·승격 계정용 개요/콘텐츠 탭으로 재구성했다. 기간별 조회·반응·도달·프로필 방문 선택 타일, 선택 지표 단일 추이 차트, 콘텐츠 유형별 조회 막대, 전체 누적 성과와 인기순/최신순 게시물별 성과를 연결했다. `get_engagement_daily`는 삭제되지 않은 내 게시물의 좋아요·댓글·저장·DM/스토리 공유를 KST 일자별로 합산하고, `get_views_by_type`은 릴스·게시물·스토리 조회를 유형별로 반환한다. 두 RPC는 SECURITY DEFINER/본인 범위/authenticated 전용으로 원격 적용·권한 및 결과를 검증했으며, 노출 수집과 영상 시청 지표는 이번 범위에서 제외했다.
- **앱 홈 코치마크 좌표·중복 오버레이 수정** — 프로필 탭을 포함한 5단계 안내로 확장하고, 단계 진행 중 Android 네이티브 `Modal`이 잔류해 이전 안내가 겹치는 문제를 막기 위해 코치마크를 Tabs 루트에 한 번만 마운트되는 absolute 오버레이로 전환했다. 타깃과 오버레이 호스트를 각각 `measureInWindow`로 측정한 뒤 호스트 기준 상대 좌표로 변환해 iOS·Android 상태바/Safe Area 원점 차이로 하이라이트가 위로 밀리던 문제를 제거했다. 개발 빌드에서는 홈 `unip` 로고를 길게 눌러 현재 사용자 완료 플래그를 삭제하고 즉시 1단계부터 재측정할 수 있게 했으며, 릴리즈에서는 해당 상호작용과 이벤트 구독이 비활성화된다. 기존 사용자별 1회 노출·건너뛰기·Android 뒤로가기 동작은 유지했고 앱 tsc를 통과했다. 순수 JS 변경이라 네이티브 리빌드는 불필요하다.

## 2026-08-12

### 완료
- **승격 계정 인사이트 A "콘텐츠 성과" 백엔드** — 크리에이터(승격) 계정에 붙일 인사이트 중 A(콘텐츠 성과)의 DB·API만 먼저 준비했다. `get_content_performance()` RPC(마이그레이션 `20260812140000`)가 본인 게시물별 좋아요·댓글·저장·공유를 반환한다. 좋아요/댓글은 posts 카운터 컬럼, 저장은 `bookmarks` count, 공유는 DM 리셰어(`messages.shared_post_id`)와 스토리 리셰어(`stories.shared_post_id`)를 합산하며(둘 다 `deleted_at is null`) 썸네일·영상 여부도 함께 준다. `SECURITY DEFINER` + `where user_id = auth.uid() and deleted_at is null`로 본인 글만 노출하고 `authenticated`만 실행(`public`/`anon` revoke), `created_at desc` 정렬이다. metric_events가 아니라 기존 참여 테이블 집계라 별도 수집 없이 과거 데이터가 바로 나온다. 원격 적용 후 uiv_uiv 데이터로 좋아요·댓글·저장·공유 값을 검증했고, `features/metrics/api.ts`에 `getContentPerformance()`/`ContentPerformance` 타입을 추가해 앱 tsc를 통과했다. ⚠️ UI는 아직 없고 게이트(`canViewInsights`)도 전체 `true`라 후속에서 승격 계정 전용 노출·화면을 붙인다. DB/JS 변경이라 네이티브 리빌드는 불필요하다. 커밋 `bbcc38c`.
- **앱 홈 첫 진입 코치마크** — 온보딩을 마친 사용자가 홈에 처음 진입하면 스토리바 → 검색 → 작성(+) → 탐색 탭을 순서대로 안내하는 4단계 코치마크를 추가했다. 공용 Context 레지스트리에 흩어진 대상 ref를 등록하고 `measureInWindow`로 좌표를 한 번 측정하며, 네이티브 마스크 없이 4조각 fixed scrim과 흰 테두리로 대상만 밝게 보이게 한다. 말풍선은 대상 위치에 따라 위·아래를 선택하고 화면 안으로 보정하며 다음/시작하기/건너뛰기를 지원한다. 완료 여부는 `userId`별 AsyncStorage에 저장해 한 번만 노출한다. 일반 학생에게 표시할 스토리가 없어도 코치마크 대상이 유지되도록 홈 헤더 아래에 내용 없는 40px 스토리 영역을 복구했다. 화면 조립, feature 훅·저장소, 공용 레지스트리·오버레이 UI를 분리했고 앱 tsc를 통과했으며 순수 JS 변경이라 네이티브 리빌드는 불필요하다.
- **홈피드 전교생 안 본 글을 핫스코어순으로 전환** — `get_feed_post_ids`에 `p_half_life_days`(기본 5일)를 추가하고 band 1을 최신순에서 `(1 + 좋아요 + 댓글×2) × 0.5^(경과일/반감기)` 순으로 변경했다. 기본점수 1을 포함해 참여 0 게시물도 감쇠 rank를 갖게 하므로 rank-only 커서의 0점 동률 누락을 막고 참여 0끼리는 최신순으로 정렬된다. band 0 크루 최신순, band 2 본 글 seed 셔플, band 판정·차단·RLS·`(band, rank)` 커서·limit은 유지했으며 앱 호출부는 DB 기본값을 사용한다. 기존 4인자 함수는 제거해 PostgREST 오버로드 충돌을 방지했고 원격 적용 및 앱 tsc를 검증했다. 현재 반응 카운트는 같은 학교 참여 기준이며 다학교 확장 시 학교 내부 카운트 분리를 백로그로 남겼다.
- **스토리 작성 권한을 기관·승격 계정으로 제한** — 원격 `stories_insert_own` INSERT RLS를 `user_id = auth.uid()`이면서 `official_accounts` 등록 또는 `users.is_promoted = true`인 경우만 허용하도록 교체했다. 앱은 기존 계정 배지 캐시를 사용하는 `useStoryCreationAccess`로 판정을 한 곳에 모으고, 일반 학생에게 스토리바 추가 버튼과 게시물 공유 시트의 `내 스토리에 추가`를 숨기며 `/story/create` 직접 진입도 fail-closed로 홈에 돌려보낸다. 기존 일반 학생 스토리는 삭제하지 않고 24시간 만료를 유지한다. 원격에서 일반 계정 INSERT 거부, 기관·승격 계정 각각 허용을 롤백 트랜잭션으로 검증했고 앱 tsc를 통과했다. 일반 학생 대상 안내 문구는 후속 백로그로 남겼으며 DB/JS 변경이라 네이티브 리빌드는 불필요하다.
- **앱 게시물 리셰어 스토리 카드 미디어 완성** — 원본 게시물 조회에 `aspect_ratio`를 포함하고 공용 `StorySharedPostMedia`로 사진·영상을 같은 박스 규칙으로 렌더한다. 세로 4:5와 정사각은 원본 비율을 유지하고, 가로 16:9는 정사각 검정 레터박스 안에 contain으로 표시한다. 흰 카드 바깥 라운드는 유지하면서 사진·영상·검정 레터박스 둘레에 상하좌우 동일한 8px 흰 프레임만 남기고 미디어는 각진 사각형으로 정리했으며, 카드는 앱 라이트/다크 테마와 무관하게 fixed `white`/`black` 토큰만 사용한다. 영상은 작성 미리보기와 활성 스토리에서만 소스를 연결해 무음 자동재생·반복하며, 공유 영상 스토리는 최대 15초 세그먼트로 진행한 뒤 다음 스토리로 이동한다. 비활성 보관함 미리보기는 썸네일만 표시해 동시 디코딩과 전송량을 막았다. 앱 tsc 통과, 기존 DB 스키마만 사용하므로 추가 마이그레이션·네이티브 리빌드는 없다.

## 2026-08-11

### 완료
- **앱 게시물 내 스토리 리셰어** — `stories.shared_post_id`를 `posts`의 `ON DELETE SET NULL` 외래키로 추가하고 `image_url`을 nullable로 전환하되 둘 중 하나는 필수인 CHECK를 적용했다. DB 트리거가 본인의 삭제되지 않은 같은 학교 게시물만 리셰어하도록 직접 INSERT 우회까지 차단하며, 원본 게시물은 작성자·첫 미디어·캡션을 배치 조회해 삭제/RLS로 읽을 수 없는 리셰어를 목록과 보관함에서 제외한다. 홈·릴스의 게시물 공유 시트에는 본인 글일 때만 `내 스토리에 추가`를 표시하고, 기존 스토리 작성 팔레트에서 공용 링크 카드 미리보기로 게시한다. 뷰어는 카드 영역 탭만 게시물 상세로 이동하고 바깥 좌우 탭·스토리 좋아요/조회 동작은 유지한다. 원격 마이그레이션과 본인/타인 게시물 INSERT 검증, 앱·웹 tsc를 통과했으며 JS/DB 변경이라 네이티브 리빌드는 불필요하다.
- **추천 크루 "같은 과" 라벨 제거** — 학과 공개가 opt-in인 정책과 충돌하지 않도록 추천 카드에서 같은 학과 여부를 표시하지 않게 했다. 공통 크루가 있을 때만 `공통 크루 N명`을 표시하며, `same_dept`는 RPC tier 2 추천 순서 신호로만 유지해 DB·타입·추천 순서는 변경하지 않았다.
- **추천 크루 카드 축소 + 기관/승격 계정 크루 차단** — 추천 카드 폭 148은 유지하면서 높이 220→188, 아바타 72→64, 패딩·간격과 신청 버튼 높이/글자 크기를 줄여 검색 화면에서 2~2.5장 노출을 유지하고 오탭 위험을 낮췄다. `get_friend_recommendations`는 기관뿐 아니라 `is_promoted=true`도 제외하고, `send_friend_request`/`accept_friend_request`는 호출자와 상대 중 하나라도 기관·승격 계정이면 서버에서 거부하도록 보강했다. 앱 프로필은 기존 계정 배지 캐시를 재사용하되 목록 로드 전에는 fail-closed로 처리하고 기관/승격 프로필에서 신청·수락·삭제 등 크루 액션만 숨긴다(메시지·즐겨찾기는 유지). 원격 마이그레이션 적용 후 같은 학교 특수 계정 후보 3명 중 추천 반환 0명, 양방향 신청/수락 거부, authenticated/anon ACL을 검증했다. 기존 accepted 연결 1건은 자동 삭제하지 않고 후속 정리 항목으로 남겼으며, 팔로우는 준비된 `follows` 테이블을 사용하는 별도 백로그로 유지한다.
- **추천 크루 기관 계정 제외** — 사람 간 관계인 크루 추천에서 학생회·동아리 등 `official_accounts` 등록 계정을 제외하도록 `get_friend_recommendations` 후보 필터를 보강했다. 원격 적용 후 실제 인증 사용자 문맥에서 반환 결과와 기관 계정의 교집합 0건, tier 순서·동일 seed 재현성·authenticated/anon ACL 유지를 확인했다. 별도 점검에서 상대 기관 프로필에도 현재 “친구 신청” UI가 뜨고 `send_friend_request`가 서버에서 기관 대상을 막지 않는 것을 확인해, UI 숨김과 서버 우회 차단을 함께 처리하는 후속 백로그로 등록했다.
- **추천 크루 랜덤 fallback** — `get_friend_recommendations`를 공통 크루(tier 1) → 같은 학과(tier 2) → 그 외 같은 학교 seed 셔플(tier 3) 순서로 확장해 신호 후보가 부족해도 최대 20명을 채우도록 했다. 앱은 검색 화면 진입 시 생성한 seed를 훅 수명 동안 고정해 재포커스·리렌더 순서를 유지하고, 랜덤 후보 카드에서는 추천 이유 줄만 비우되 카드 높이는 유지한다. 기존 본인·accepted/pending·양방향 차단·학교·활성 상태 제외와 최소 반환 필드/ACL은 유지했다. 원격 마이그레이션 적용 후 tier 순서, 같은 seed 재현성, 다른 seed fallback 셔플, 학교·연결·차단 제외, authenticated/anon 권한과 기존 오버로드 제거를 검증했고 앱 tsc를 통과했다.

## 2026-08-07

### 완료
- **앱 검색 추천 크루 캐러셀** — 검색어가 비어 있을 때 최근 검색 위에 같은 학교의 추천 크루를 2~2.5장 보이는 가로 카드로 표시하고, 카드에서 프로필 이동·크루 신청·세션 숨기기를 지원한다. `get_friend_recommendations(p_limit=20)` RPC는 공통 크루 수×3+같은 학과 1점으로 정렬하고 본인·accepted/pending 양방향 연결·양방향 차단·다른 학교·비활성/탈퇴 유저를 제외하며, 학과명/실명 없이 `mutual_count`/`same_dept`만 반환한다. SECURITY DEFINER 내부 인증/학교 범위를 고정하고 `PUBLIC`/`anon` 실행 권한을 회수했으며 원격 적용 후 실제 사용자 문맥에서 점수·학교·연결/차단 제외와 ACL을 검증했다. 앱은 `profileRecommendations` API, `useFriendRecommendations` 상태/낙관적 롤백 훅, `RecommendedCrewCarousel`/`RecommendedCrewCard` 순수 UI로 분리했고 앱 tsc 통과.
- **앱 게시물 작성 커스텀 영상 보관함 선택 및 플랫폼 안정화** — 사진 선택 화면에서 사진/영상 보관함을 전환하고, 영상 앨범·3열 그리드·커서 페이지네이션·단일 선택·무음 반복 미리보기·60초/250MB 사전 제한을 기존 작성 폼과 연결했다. Android는 권한 응답이 `granted`여도 `accessPrivileges=limited`이면 허용 영상이 0개가 될 수 있어 제한 접근 상태와 시스템 영상 추가 선택 흐름을 별도로 처리했다. iOS는 Photos 보관함 외부 `file://` URI를 `expo-video`/`expo-video-thumbnails`에 직접 전달해 미리보기 실패와 크래시가 발생하던 경로를 제거하고, 그리드 썸네일은 `expo-image`의 PhotoKit `ph://` 로더를 사용하며 선택 영상만 앱 캐시로 복사해 미리보기·썸네일 생성·업로드가 읽을 수 있는 파일로 통일했다. Android 썸네일은 셀이 잠시 비가시 상태가 되어도 생성 결과를 유지하도록 캐시 생명주기를 보정했다. Android·iOS 실기기에서 영상 목록/썸네일/미리보기 표시를 확인했고 앱 tsc 통과. 커밋 `423f67e`.

## 2026-08-05

### 완료
- **좋아요 알림 인스타식 집계 + 대댓글 표시** — 게시물/댓글/스토리 좋아요 알림을 대상별로 묶어 "A님, B님 외 N명이 …을 좋아합니다" + 최근 행위자 아바타 겹치기로 표시하도록 바꿨다. DB 트리거(`notify_on_like`/`notify_on_comment_like`)를 "첫 좋아요만 생성" → "이미 있으면 `created_at` 갱신+`is_read=false`로 맨 위로 올리기"로 변경(migration `20260805120000_notify_like_aggregate.sql`)하고, 앱은 좋아요 테이블을 대상별로 실시간 집계(최근 3명·총 인원)해 표시한다. `comment_reply`(대댓글) 행위자를 되짚어 "새 알림이 있습니다"로만 뜨던 버그를 고치고 `user_like` 문구도 추가했으며, 생성이 낡아 빠져 있던 `comment_reply`/`user_like`를 notifications 타입에 보정했다. 앱 tsc 통과, 실기기 확인은 리빌드 후.
- **앱 스플래시(라이트/다크) + 표시 이름 unip** — 시작 화면 스플래시를 라이트(흰 배경)·다크(검정 배경) 각각 unip 워드마크 PNG로 넣고 `expo-splash-screen`을 추가했으며, 앱 표시 이름을 `mobile`→`unip`로 바꿨다(slug은 EAS 연결 유지 위해 `mobile` 유지). 네이티브 변경이라 리빌드 필요(사진 선택 화면과 한 빌드에 묶음).
- **앱 새 게시물 사진 선택 화면 1차** — 하단 작성 탭 진입 시 기존 작성 폼보다 먼저 최신 사진 미리보기와 3열 보관함 그리드를 표시하고, 선택 후 다음 단계에서 기존 캡션·공개범위 폼으로 이어지도록 구성했다. `expo-media-library` SDK 54 권장 버전과 사진 전용 권한 설정을 추가하고, 권한 요청·커서 페이지네이션·최대 10장 선택 순서·첫 사진 기준 비율·iCloud 로컬 URI 해석을 feature 훅으로 분리했다. 미리보기는 기존 게시물 비율 세트를 순환하며 중앙 `cover`만 적용하고 크롭 제스처는 후속 작업으로 남겼다. 앱 tsc와 Expo config 해석은 통과했으며 실제 dev build 반영에는 네이티브 리빌드가 필요하다.
- **앱 새 게시물 사진 선택 Android 권한·패널 UX 보정** — Android에서 `getAssetsAsync(resolveWithFullInfo)`가 EXIF 위치 접근을 시도해 `ACCESS_MEDIA_LOCATION` 없이 실패하던 경로를 제거하고, Android는 MediaLibrary가 제공하는 로컬 asset URI를 그대로 사용하며 iOS만 `getAssetInfoAsync`로 `ph://`/iCloud URI를 해석하도록 분리했다. 사진 미리보기는 아래 고정 레이어, 갤러리는 기존 `@gorhom/bottom-sheet`의 `BottomSheetFlatList`를 사용하는 위 레이어로 재구성해 패널을 올리면 그리드가 화면을 채우고 다시 내리면 미리보기가 나타나게 했다. 일반 선택은 선택 사진을 갱신한 뒤 패널만 접고 내부 그리드 offset은 보존하며, 다중 선택은 패널 위치를 자동 변경하지 않는다. 후속 구조 정리에서 435줄 단일 `PostMediaGrid`를 패널 조립(`PostMediaPickerBody`)·패널 제어 훅·갤러리 목록·사진 셀·툴바·상태 UI로 분리하고 중복 권한/오류 JSX를 상태 모델 하나로 통합했다. Android 실기기에서 사진 로드와 분리 패널 동작을 확인했고 앱 tsc 통과. JS 변경이라 추가 리빌드는 불필요하다.
- **앱 새 게시물 사진 앨범 선택 추가** — 사진 선택 툴바의 `최근 항목`을 앨범 선택 버튼으로 바꾸고, iOS 스마트 앨범과 Android 미디어 폴더를 커버 사진·이름·사진 수 카드로 표시한다. 처음에는 가로 앨범 목록을 보여주고 `모두 보기`에서 2열 전체 앨범 그리드로 전환한다. 앨범별 커버/사진 수 조회는 동시 실행을 4개로 제한하고 사진 없는 앨범과 개별 조회 실패 앨범만 제외해 네이티브 브리지 부하와 전체 실패를 방지했다. `expo-media-library` 직접 접근은 신규 `postMediaLibrary.ts` 어댑터로, 권한·앨범·앨범별 페이지와 요청 경쟁 상태는 `usePostMediaLibrarySource`로, 선택·미리보기·비율 상태는 기존 picker 훅으로 분리했다. 앨범 전환 시 그리드와 커서를 초기화하되 선택 사진·미리보기는 유지하고, 요청 세대 검증으로 빠르게 앨범을 바꿔도 이전 응답이 현재 목록을 덮어쓰지 않게 했다. 작성 폼의 사진 추가 `+`도 새 선택 화면으로 통일하고 기존 시스템 사진 선택 함수는 제거했다. 폼에서 삭제한 사진은 picker 선택 상태에서도 같은 인덱스로 제거하며, `+`로 재진입한 선택 화면은 스냅샷을 사용해 X/기기 뒤로가기 시 변경을 취소하고 `다음`에서만 폼에 확정한다. 앨범별 그리드는 새 key로 마운트해 스크롤을 맨 위에서 시작하며 앱 tsc 통과. 기존 dev build의 MediaLibrary API만 사용하므로 추가 리빌드는 불필요하다.

## 2026-08-04

### 완료
- **앱 타이포 토큰화 1차** — `apps/mobile/src`의 하드코딩 `fontSize` 219건과 숫자형 `fontWeight` 216건을 전수 집계해 기존 값 그대로 의미 토큰으로 치환했다. `theme.ts`의 기존 크기/굵기 토큰은 유지하고 실사용 전체를 덮도록 크기 14종(9~28)·굵기 6종(400~900) 스케일을 완성했으며, 88개 사용 파일에 기존 theme import를 재사용했다. 색상·간격·레이아웃·컴포넌트 로직 변경 없이 원시 크기 0건, `nicknameTextStyle`의 기존 굵기 선언만 의도적으로 유지했고 앱 tsc 통과.
- **앱 다크 배경·카드 계층 재조정** — 다크 팔레트의 앱 배경(`accentSoft`)을 `#000000`, 피드 카드(`feedCard`)와 내비 표면(`navBackground`)을 `#0F1011`, 반투명 카드(`card`)를 `rgba(15,16,17,0.94)`로 교체해 검정 바탕 위 카드 계층이 드러나도록 스왑했다. 라이트 팔레트는 유지했다. 흰 프로필 카드에서 묻히던 프로필 편집 버튼·소셜 링크 칩과 같은 조건의 상대 프로필 보조/비활성 액션 버튼은 `overlayInk` 채움으로 전환했으며 앱 tsc 통과.

## 2026-08-03

### 완료
- **앱 게시물 공유 시트 외부 공유 푸터 고정** — 공개 게시물의 `ExternalShareSection`을 드래그되는 시트 바깥 `Modal` 루트의 화면 하단 절대 위치 푸터로 옮겨 55%/92% detent 전환 중에도 움직이지 않게 했다. 푸터의 실제 높이를 `onLayout`으로 측정해 공유 대상 목록의 하단 콘텐츠 패딩으로 반영하고 목록 `ScrollView`가 남은 시트 영역을 채우도록 해 마지막 대상도 푸터 위로 스크롤된다. 크루 공개 게시물은 기존처럼 푸터 없이 목록이 바닥까지 표시되며 앱 tsc 통과.
- **앱 인증 배지 표시 확산** — 공용 `UserInline`의 `verified` prop을 댓글 작성자·크루 목록·채팅방 헤더·게시물 공유 대상에 연결하고, 직접 닉네임을 렌더하는 프로필 상단 헤더·릴스 작성자·채팅 목록·유저 검색 결과에도 `VerifiedBadge`를 추가했다. 공용 `ScreenHeader`에는 중앙 정렬을 유지하는 `titleAccessory` 슬롯을 마련해 프로필 중간 정보 영역의 중복 배지는 제거했다. 모든 판별은 기존 데이터의 유저 ID와 전역 `useVerifiedUsers().isVerified`를 사용해 추가 쿼리 없이 처리했으며 앱 tsc 통과.
- **앱 인증(공식/승격) 배지 1차** — `get_verified_user_ids` RPC 결과를 5분 TTL과 진행 중 요청 dedupe로 캐시하고, 로그인 세션 하위 `VerifiedUsersProvider`에서 ID 목록을 `Set`으로 관리하도록 연결했다. 고정 파란색 원·흰 체크의 공용 `VerifiedBadge`를 추가하고 `UserInline`의 닉네임 바로 뒤에 표시할 수 있게 확장해 홈 피드 작성자 헤더에 우선 적용했다. RPC 모바일 타입을 동기화했으며 앱 tsc 통과.
- **앱 다크 팔레트 튜닝 및 크롬 정리** — 다크 글씨를 흰색 alpha에서 불투명 메타 그레이(text `#E4E6EB` / muted `#B0B3B8` / textFaint `#8A8D91`)로 교체해 또렷하게 하고, 배경/카드를 딥다크(배경 `#0F1011`, `feedCard` `#000000`)로, 표면 토큰(`navBackground`/`card`/`surfaceGlass`) 다크값을 배경에 붙여 카드 붕뜸을 완화했다. 프로필 카드를 피드 카드와 통일(풀와이드·테두리 제거), 상태바를 다크에서 `light-content`로 대응(`SystemBarsController`), 헤더 아이콘(설정/알림/메시지)의 원형 배경을 제거했다. 전부 theme.ts 값 조정 또는 컴포넌트 스타일 정리(하드코딩 없음).
- **앱 unip 워드마크 로고 적용** — 신규 공용 `Logo` SVG 컴포넌트를 홈 헤더(28), 로그인/온보딩(40), 탭 placeholder와 루트 환경 오류 화면(30)에 적용해 기존 `KREW` 텍스트 로고를 교체했다. 라이트/다크 색상은 `Logo` 내부 테마 판별을 따르며 온보딩 CTA 문구도 `unip 시작하기`로 변경했다. 앱 tsc 통과.
- **앱 다크모드 G4 설정·활동·인사이트·인증 전환** — 설정/차단 목록, 내 활동과 게시물·스토리·즐겨찾기 그리드, 인사이트 카드·그래프·기간 선택, 로그인/온보딩, 탭 placeholder와 공용 `KrewSurface`를 `useTheme`/`useThemedStyles` 기반으로 전환했다. 스크린 배경과 헤더 opt-in, 닉네임 색, 채운 버튼 `onAccent`, 인증 입력 표면과 인사이트 그래프 색을 테마에 연결했으며 Google 브랜드 버튼과 활동 스토리 프리뷰·뷰어의 fixed 미디어 UI는 유지했다. 앱 tsc 통과.
- **앱 다크모드 G3 작성·게시물 상세 전환** — 게시물 작성 화면과 헤더·미디어/본문/설정 카드·이미지 업로더·비율/공개범위 선택기·영상 미리보기, 게시물 상세 화면을 `useTheme`/`useThemedStyles` 기반으로 전환했다. 작성 입력과 카드 표면은 동적 테마 토큰을 사용하고 게시/활성 선택 상태와 상세 피드백 배너는 `accent`/`onAccent` 대비를 적용했으며, 미디어 위 삭제 버튼·배지는 fixed 토큰을 유지했다. 직접 하위 컴포넌트인 `VisibilityPicker`를 추가 전환했고 앱 tsc 통과.
- **앱 다크모드 G2 검색·탐색·알림 전환** — 검색 화면/결과/최근 검색, 탐색 화면/그리드 스켈레톤, 알림 화면/알림 행을 `useTheme`/`useThemedStyles` 기반으로 전환하고 스크린 배경을 동적 `accentSoft`로 명시했다. 공용 검색 입력·검색 유저 행·상태 화면·아바타·스켈레톤은 기존 테마 대응을 재사용했으며 추가 하위 컴포넌트 전환 없이 앱 tsc 통과.
- **앱 장식용 아웃라인 테두리 정리** — 채팅 말풍선·메시지 목록 검색창/대화 카드·프로필 버튼/링크 칩·공용 카드/다이얼로그·검색 카드·게시물 작성 카드·설정/인사이트/인증 카드의 장식용 `borderWidth`/`borderColor`를 제거했다. 공용 검색 입력은 메시지 화면에서만 outline을 끄고, 그 외 입력 필드와 상·하단 구분선, 스토리 링·카메라 프레임, 체크박스·스와치·업로더 썸네일 테두리는 유지했다.
- **앱 다크모드 Phase 3 채팅·메시지 전환** — 메시지 목록과 채팅방, 헤더·대화 행·요청 배너·말풍선·입력창을 `useTheme`/`useThemedStyles` 기반으로 전환했다. 내 말풍선과 채운 버튼은 `accent`/`onAccent`, 상대 말풍선과 입력 표면은 동적 다크 표면 토큰으로 대비를 분리했으며, 메시지 검색 결과로 함께 렌더되는 `SearchUserRow`도 추가 전환했다. 미디어 썸네일 오버레이의 fixed 토큰은 유지했고 앱 tsc 통과.
- **앱 프로필 스켈레톤 현행 UI 정렬** — 로딩 스켈레톤 헤더를 실제 프로필 헤더의 좌우 아이콘 슬롯·가운데 제목 구조로 맞추고, 이전 카드 여백·테두리·유리 배경을 제거해 현재 풀와이드 프로필 카드와 동일한 폭 및 배경으로 정렬했다.
- **앱 다크모드 Phase 2 프로필 탭 전환** — 프로필·프로필 편집·크루 관리 화면과 프로필 UI 컴포넌트를 `useTheme`/`useThemedStyles`로 전환했다. `ScreenContainer` 기본 배경은 미전환 화면 보호를 위해 정적 라이트로 복구하고 프로필 화면만 동적 배경을 명시했으며, 공용 헤더·썸네일 그리드는 프로필 전용 opt-in 방식으로 다크 대응했다. 하단바는 `navBar` 토큰으로 앱 배경과 이어지게 조정했고 앱 tsc 통과.

## 2026-08-01

### 완료
- **앱 다크모드 Phase 1 홈 탭 전환** — 공통 프리미티브와 홈 화면·피드 카드·스토리바를 `useTheme`/`useThemedStyles` 기반으로 전환하고, 홈에서 열리는 댓글·공유 시트 하위 UI까지 동적 색 토큰을 적용했다. 솔리드 카드·시트 표면은 `navBackground`, accent 채운 버튼 전경은 `onAccent`를 사용하며 닉네임의 라이트 고정 색도 테마 text로 덮어썼다. 릴스·스토리 뷰어·다른 탭은 건드리지 않았고 앱 tsc 통과.

## 2026-07-31

### 완료
- **앱 홈피드 순서 함수 연동** — 홈피드 첫 페이지/무한스크롤을 created_at cursor 방식에서 DB RPC `get_feed_post_ids(seed, limit, after_band, after_rank)` 기반 순서 조회로 전환. RPC가 준 post id 순서를 유지한 채 기존 posts 임베딩 select와 `hydrateFeedPosts`를 재사용하고, 세션 seed를 캐시에 저장해 재진입/스크롤 중 순서가 흔들리지 않게 했다. 새로고침 때만 seed를 갱신해 본 글 랜덤 꼬리 순서가 바뀐다. `post_impressions` upsert API를 추가하고 Home FlatList viewability(80% 이상·2초 이상)를 안정 참조 pairs로 연결해 본 글 기록을 배치 저장한다. band 2 경계에는 “모두 열람했습니다” 마커를 삽입. 앱 tsc 통과.
- **앱 릴스 순서 함수 연동** — 릴스 첫 페이지/무한스크롤을 created_at cursor 방식에서 DB RPC `get_reel_post_ids(seed, seen_ids, limit, after_band, after_rank)` 기반 순서 조회로 전환. RPC가 준 post id 순서를 유지한 채 기존 영상 posts 임베딩 select와 `hydrateFeedPosts`를 재사용한다. 훅 진입마다 세션 seed를 고정하고, 활성 릴스가 1초 이상 머문 시점에 기존 `reel_view` 지표 기록과 별도로 세션 seen set에 추가해 안 본 영상이 먼저 나오게 했다. 끝 페이지에 도달하면 같은 seed로 커서를 리셋해 계속 이어붙이며, 중복 렌더를 위해 FlatList key를 post id가 아닌 인스턴스 key로 분리. 특정 영상 진입은 해당 영상을 첫 아이템으로 고정하고 ranked 결과를 이어붙인다. 앱 tsc 통과.
- **⚠️ 피드/릴스 로드 실패(PGRST201) 수정 (Claude Code)** — 위 연동 직후 앱에서 "피드를 불러오지 못했습니다". 원인 = 07-30에 만든 `post_impressions`가 posts·users 양쪽에 FK를 걸어 posts↔users 관계가 **2개**가 됨(작성자 FK + post_impressions 우회 M2M) → 기존 `user:users(...)` 임베딩이 관계 모호로 터짐. **RPC는 정상, post_impressions 테이블이 기존 피드/릴스 임베딩을 깨뜨린 것.** 작성자 FK를 명시(`user:users!posts_user_id_fkey(...)`)해 해결(`internalTypes.ts` 임베딩 상수 2개, 다른 기능은 posts·users를 분리 조회라 무영향). 커밋 `b2554ed`.
  - 디버깅: 폰엔 일반 문구만 뜨고 로그 없어, test 계정 로그인 토큰으로 REST를 직접 호출해 PGRST201 재현(권한/스키마 캐시 아님을 배제 후 특정).
  - **교훈**: A·B 양쪽에 FK를 건 junction 테이블을 추가하면 A↔B 임베딩이 M2M으로 잡혀 기존 임베딩이 깨질 수 있음 → 임베딩에 FK 명시.
- **실기기 검증** — 피드 정상 로드, 크루 글 상단(band 0), `post_impressions` 기록 확인(80%·2초), "모두 열람" 마커 표시 확인.
- **논의(후속)**: 홈 탭 재탭 시 맨 위로(+최상단이면 새로고침) = JS-only 가능(재빌드 X). FlatList가 HomeFeedList에 있어 화면→리스트 ref 배선 필요 → 코덱스 지시문 전달.
- **앱 홈 탭 재탭 UX 적용** — 커스텀 `BottomTabBar`에서 활성 홈 탭 재탭을 감지해 HomeScreen으로 전달하고, `HomeFeedList`가 `forwardRef`/`useImperativeHandle`로 `scrollToTop`·`isAtTop`을 노출하도록 연결. 홈에서 스크롤이 내려가 있으면 부드럽게 맨 위로 이동하고, 이미 최상단이면 기존 홈 새로고침 로직을 실행한다. 앱 tsc 통과.
- **앱 색상 의미 토큰화 1단계** — `docs/design/COLOR_TOKENS.md`를 정본으로 `theme.ts`에 flip/fixed 의미 토큰 38개를 추가하고, `apps/mobile/src`의 매핑 대상 raw hex/rgba를 `colors.*` 참조로 치환. Google 브랜드색·스토리 콘텐츠 팔레트·팔레트 비교식은 제외 목록대로 유지했고, 문서 미매핑 값 2종은 임의 변경하지 않았다. 앱 tsc 통과.
- **앱 다크모드 Phase 0 배선** — `theme.ts`를 `lightColors`/`darkColors`로 분리하고 `colors=lightColors` 하위호환을 유지. 시스템 `useColorScheme()`을 구독하는 `ThemeProvider`, `useTheme`, `useThemedStyles`를 추가해 루트에 연결했으며 `onAccent`/`switchThumb` 특수 토큰과 문서 기준 다크 팔레트를 준비했다. `app.json`은 `userInterfaceStyle=automatic`, 루트 StatusBar는 `auto`로 전환. 기존 화면 StyleSheet는 아직 라이트 고정이며 앱 tsc 통과.

## 2026-07-30

### 완료
- **앱 프로필 실명/학과 공개 여부 토글 Phase 1** — `users.real_name_public`/`department_public` 컬럼을 추가하고 원격 Supabase에 마이그레이션 적용. `get_user_real_name`은 본인/크루 또는 같은 학교 대상의 실명 공개 ON일 때만 실명을 반환하도록 수정했고, `search_users`·`get_blocked_users`·`get_friends`·`get_pending_requests`·`get_sent_requests`는 학과를 본인 또는 `department_public=true`일 때만 반환하도록 서버 마스킹. 앱 직접 조회 경로(피드/릴스/상세, 프로필, 내 활동/즐겨찾기)는 `department_public`을 함께 조회해 UI 타입 조립 시 비공개 학과를 `null` 처리. 프로필 편집 화면에 실명 공개/학과 공개 스위치를 추가하고 저장 로직에 boolean 업데이트를 연결. 앱 tsc 통과. Phase 2(raw REST `users.department` 직접 조회 차단)는 출시 전 별도 작업으로 남김.
- **앱 iOS 구글 로그인 연결** — 그동안 Android에서만 되던 구글 로그인을 iOS에 붙임. iOS dev build에서 구글 로그인 누르면 `RNGoogleSignin: failed to determine clientID - GoogleService-Info.plist was not found and iosClientId was not provided` 크래시가 나던 것을 해결.
  - **구글 콘솔**: 웹/안드 OAuth 클라이언트가 있는 동일 프로젝트(프로젝트 번호 `899969293498`, 콘솔 표시명은 "Default Gemini Project"지만 클라이언트 ID로 확인)에 **iOS OAuth 클라이언트 신규 생성**(Bundle ID `com.univer.app`). Firebase 푸시용 `univer-783b0`(번호 3164150…)와는 다른 프로젝트라 그쪽 GoogleService-Info.plist는 사용 안 함.
  - **코드**: `app.json`의 `@react-native-google-signin/google-signin` 플러그인을 배열 형태로 바꿔 `iosUrlScheme`(reversed client ID, Info.plist URL scheme) 추가. `features/auth/googleSignIn.ts` `configure()`에 `iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` 추가. `.env.local`/`.env.example`에 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` 추가(iOS client ID는 비밀 아님·앱에 박히는 공개 식별자라 하드코딩 표준). EAS dev/preview 환경변수에도 등록. 앱 tsc·app.json JSON 검증 통과. iOS dev build 재빌드.
  - **nonce 이슈 해결**: 재빌드 후 iOS 구글 로그인 시 Supabase `signInWithIdToken`이 `Passed nonce and nonce in id_token should either both exist or not` 에러. 원인 = iOS 구글 SDK 토큰의 nonce 상태가 Supabase 기본 nonce 검증과 안 맞음(Android는 맞아떨어져서 됐던 것). `@react-native-google-signin`의 커스텀 nonce는 유료라 무료 버전에선 못 맞춤 → **Supabase Auth > Providers > Google > "Skip nonce check" ON**으로 해결(Supabase가 이 조합에 공식 안내하는 방법, Android/웹 영향 없음). 네이티브 토큰을 곧바로 HTTPS로 교환하는 흐름이라 실질 위험 낮음. **iOS 실기기 구글 로그인 성공 확인.**
- **앱 프로필 외부 링크 브랜드 아이콘 표시** — 프로필 대표 링크를 "hostname 텍스트 칩"에서 **"브랜드 아이콘 + 깔끔한 이름 칩"**으로 변경. URL 도메인으로 플랫폼 판별(instagram/youtube/generic), 인스타·유튜브는 공식 로고, 그 외(틱톡 포함)는 범용(lucide Globe). 텍스트는 저장된 label 대신 **표시 시점에 URL로 재계산**해 아는 플랫폼은 이름(Instagram/YouTube), 모르는 링크는 hostname(www 제거)으로 표시(기존 링크도 바로 정리됨).
  - 신규 `components/common/SocialIcon.tsx`, `lib/utils/profileLinks.ts`에 `getProfileLinkPlatform`/`getProfileLinkDisplayLabel` 추가, `components/profile/ProfileInfoPanel.tsx` 칩 렌더 교체. 저장 데이터/편집 로직·DB 변경 없음, 새 패키지 없음(react-native-svg·lucide 재사용), JS-only(재빌드 불필요).
  - 에셋: Meta 공식 그라데이션 글리프·YouTube 공식 아이콘을 **256px/투명 PNG**로 정리해 `apps/mobile/assets/social/`에 추가(`instagram_glyph.png`·`yt_icon_red.png`). ⚠️ 인스타 공식 "SVG"는 실제론 10MB짜리 raster-in-svg(gradient가 raster로 박힘)라 벡터 이식 불가 → 동봉 PNG를 축소해 사용.
  - 표시 스타일은 A(아이콘만)/B(아이콘+텍스트) 미리보기 비교 후 **B 유지 + 텍스트를 플랫폼 이름으로 정리**로 결정. 구현은 Codex(커밋 `4c1c498`·`16b3874`·`81b82ea`), iOS 실기기 표시 확인. 틱톡 아이콘·이름/학과 공개 토글은 후속.

## 2026-07-29

### 완료
- **앱 채팅 키보드/스크롤 구조 재정렬** — `react-native-keyboard-controller` 1.22 가이드 기준으로 채팅방을 `SafeAreaView(bottom)` → `KeyboardGestureArea` → inverted `FlatList(renderScrollComponent=KeyboardChatScrollView)` + `KeyboardStickyView` 구조에 맞춤. 전송 직후 수동 `scrollToOffset(0)` 제거, 입력창 bottom padding 토글 제거, `KeyboardStickyView`/`KeyboardChatScrollView` offset을 safe-area 기준으로 통일, 입력창 증가분만 `extraContentPadding`에 전달하도록 정리. 앱 tsc 통과, iOS 실기기에서 키보드 열림/닫힘과 전송 후 최신 메시지 위치 재확인 필요.
- **앱 채팅방 이탈 시 키보드 잔류 수정** — 키보드가 열린 상태로 채팅방에서 뒤로가기/프로필·게시물 이동/차단 후 목록 이동/에러 복귀를 할 때 이전 `TextInput` focus가 남아 다음 화면 위에 키보드가 유지되던 경로를 정리. `KeyboardController.dismiss()`를 화면 이탈 액션과 focus cleanup에 연결해 iOS route transition 전에 키보드를 명시적으로 닫도록 보강. 앱 tsc 통과, iOS 실기기 리로드 후 뒤로가기·스와이프 백 재확인 필요.
- **노션 API 명세 코드 대조 최신화** — Codex가 뽑은 웹/앱 `features/*/api.ts` 함수 인벤토리를 실제 코드로 검증 후 노션 "API 명세"에 반영. 기존 표에서 틀린 웹 함수명 5개(`uploadPostMedia`→`uploadPostImages`, `getProfileLink`→`getProfileLinks`, `getUnreadMessageCount`→`getChatUnreadCount`, `restoreAccount`·`upsertProfileLink` 제거)를 제자리 수정하고, 문서 끝에 "2026-07-29 최신화" 섹션(❌ 정정 5건 / ✏️ 시그니처 변경 4건 / 🆕 웹 12·앱 40여 개 신규 함수·훅, 신규 모듈 Metrics·Public Posts)을 추가. 웹 ❌ 5건·🆕 8건은 grep, 앱 `createPost`(필수)·`createStory`(backgroundColor)는 파일 직접 확인. 전체 재작성 아닌 변경분만 반영(기존 프로즈 섹션 보존).
- **노션 API 명세 표 본문 최신화** — append 섹션만으로는 상단 표부터 보는 사람이 최신 상태를 못 파악한다는 지적에 따라, 웹·앱 각 표 본문에 신규 함수 행을 형식 유지하며 직접 추가(웹 Auth 6개·Comments·Stories·신규 Public Posts 표 / 앱 Feed 5개·Stories 영상 2개·Chat 공유 2개·Shared 캐시 3개·신규 Metrics 표·화면 로직 훅 10여 개). createPost·createStory 시그니처 셀도 제자리 수정. 상단 "마지막 업데이트" 2026-07-29로 갱신.
- **노션 코드 구조 & 리팩토링 문서 최신화** — 실제 `apps/mobile/src` 디렉토리를 확인해 2026-07-08 이후 추가분을 "2026-07-29 구조 최신화" 섹션으로 append. 신규 `features/metrics/`(지표·인사이트)·`features/session/page-caches.ts`·`screens/insights/`+`components/insights/`·`screens/feed/ReelsScreen.tsx`(릴스 화면 분리)·피드 훅 추가 분할(useHomeFeedActions/Pagination/Feedback/Sync/Meta/VideoStatusPolling·usePostDetail·useReels) 기록.

## 2026-07-27

### 완료
- **앱 채팅 키보드 3a 적용** — `react-native-keyboard-controller`를 설치하고 루트에 `KeyboardProvider`를 추가한 뒤, 채팅방만 RN 기본 `KeyboardAvoidingView`/수동 키보드 상태 계산에서 `KeyboardStickyView` 기반 입력창 고정 방식으로 교체. 키보드 열림/닫힘 시 입력창이 붕 뜨는 Android edge-to-edge 타이밍 충돌을 채팅방에서 먼저 검증할 수 있게 했고, 메시지 입력창 여백도 소폭 축소. 댓글/작성/프로필 편집 등 다른 키보드 화면은 3b 범위라 건드리지 않음. 앱 tsc 통과, 실제 반영은 EAS dev build 재설치 후 확인 필요.
- **앱 일반 화면 하단 네비바 배경 방향 재정리** — 탭 화면은 `BottomTabBar`의 흰색 네비바를 유지하고, 탭 없는 일반 화면은 화면 배경색이 하단 네비바 영역까지 이어지도록 `ScreenContainer` 구조를 수정. 기존 흰색 루트 + bottom inset margin 구조를 제거해 일반 push 화면 하단에 흰 띠가 뜨지 않게 했고, 릴스·스토리 immersive 화면과 키보드 로직은 건드리지 않음. 앱 tsc 통과.
- **앱 일반 화면 하단 네비바 흰색 공용 컨테이너 적용** — edge-to-edge ON + contrast scrim 비활성화 이후에도 화면별 `SafeAreaView` 배경이 제각각이라 하단 네비바 영역이 연보라/흰색으로 섞이던 문제를 정리. 공용 `ScreenContainer`를 추가해 바깥 루트는 `colors.navBackground` 흰색, 내부 콘텐츠는 기존 연보라 배경으로 분리하고, 일반 push 화면(작성/설정/알림/차단/내 활동/인사이트/프로필 편집/상세/채팅/검색/크루관리/프로필)에 적용. 릴스·스토리 immersive 화면과 키보드 로직은 건드리지 않음. 앱 tsc 통과, 실제 네비바 색은 EAS dev build 재설치 후 확인 필요.
- **앱 Android 네비바 contrast scrim 비활성화** — Android 15 edge-to-edge에서 3버튼 네비바 위로 시스템이 반투명 회색 contrast scrim을 얹어 일반 화면 하단이 회색으로 보이던 원인을 native config로 정리. `androidNavigationBar.enforceContrast=false`와 흰 네비바 배경/어두운 버튼을 추가하고, 실패했던 JS 하단 오버레이(`SystemBarsController` zIndex 레이어, 인사이트 임시 하단 View)는 제거. 릴스·스토리의 아이콘 tint 프리셋은 유지. 앱 tsc 통과, 실제 반영은 EAS dev build 재설치 후 확인 필요.
- **앱 Android 엣지투엣지 2b 시스템바 배경/inset 정리** — edge-to-edge ON 상태에서 일반 화면의 투명 네비바 뒤로 반투명 회색이 비치던 문제를 줄이기 위해 네비바 배경색 토큰(`colors.navBackground`)을 추가하고, 전역 `SystemBarsController`가 일반 route는 흰색·릴스/스토리 immersive route는 검정색 하단 시스템바 배경을 깔도록 정리. 설정/내 활동/인사이트/차단한 계정 스크롤 하단 여백에 safe-area bottom을 더해 마지막 항목이 네비바에 가려지는 경로를 보정. 채팅 키보드/KeyboardAvoidingView는 3단계 범위라 건드리지 않음. 앱 tsc 통과, 실제 시스템바 반영은 EAS dev build 후 확인 필요.
- **앱 Android 엣지투엣지 2b 하단 네비바 공용 배경 보정** — 전역 `SystemBarsController`의 하단 safe-area 배경 레이어가 native stack 화면 뒤에 묻히지 않도록 `zIndex`/`elevation`을 부여해 일반 화면은 흰색(`colors.navBackground`), 릴스/스토리는 검정색이 공용 레이어에서 적용되게 보강. 화면별 키보드 처리는 건드리지 않음.
- **앱 Android 엣지투엣지 하단 네비바 흰색 방향 검증(인사이트)** — native stack 위 오버레이 방식이 실기기에서 무효였던 문제를 확인하기 위해 인사이트 화면만 바깥 루트 배경을 `colors.navBackground`로 두고, 하단 safe-area 높이만큼 흰색 영역을 화면 내부에서 직접 그리도록 보정. 다른 화면은 다음 검증 결과에 따라 확대 예정.

## 2026-07-25

### 완료
- **앱 햅틱 피드백 1차 도입** — `expo-haptics` 설치 후 공용 햅틱 헬퍼를 추가하고, 피드/릴스 더블탭 좋아요가 실제로 켜질 때와 홈/탐색/프로필/크루관리 당겨서 새로고침 시작 시 약한 impact 피드백을 호출하도록 연결. 미지원/실패 환경에서는 조용히 무시하며, 실제 진동 반영은 다음 EAS dev build 후 확인 필요. 앱 tsc 통과.
- **앱 Android 엣지투엣지 ON 2a 전환** — SDK 54 기본 edge-to-edge 흐름으로 돌아가기 위해 `app.json`의 opt-out 플래그, Android theme opt-out config plugin, navigation-bar 배경/relative 설정을 제거하고 `systemBars` 런타임 처리를 상태바/네비바 아이콘 tint 중심으로 축소. 릴스·스토리 뷰어는 immersive route로 light 아이콘 프리셋을 유지. 앱 tsc 통과, 실제 시스템바 반영과 깨지는 화면 목록화는 EAS dev build 후 확인 필요.

## 2026-07-21

### 완료
- **앱 홈 피드 리렌더 최적화 1차** — 홈 피드 `FlatList`의 `renderItem`/`keyExtractor`/새로고침·더보기 핸들러와 피드 액션 콜백을 `useCallback` 기반으로 안정화하고, `FeedPostCard`를 카드 단위 `React.memo`로 감싸 좋아요·저장 같은 단일 카드 액션 시 보이는 카드 전체가 불필요하게 다시 그려지는 경로를 줄임. `initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews`를 보수적으로 추가하고, 가변 높이 카드라 `getItemLayout`은 적용하지 않음. 앱 tsc 통과.
- **앱 좋아요 낙관적 업데이트 적용** — 홈 피드, 릴스, 게시물 상세의 좋아요를 서버 응답 대기 후 반영하던 방식에서 북마크와 같은 낙관적 업데이트 패턴으로 전환. 하트/좋아요 수를 누르는 즉시 먼저 반영하고, 서버 성공 시 정확한 값으로 보정하며 실패 시 이전 상태로 롤백하도록 처리. 중복 클릭 방지 guard는 유지. 앱 tsc 통과.
- **앱 화면 전환 애니메이션 명시** — 루트 Stack 기본 전환을 `slide_from_right`로 지정하고, 릴스/스토리/글작성/스토리작성은 `slide_from_bottom`, 로그인/온보딩은 `none`으로 지정해 화면별 전환을 일관화. 화면 로직/레이아웃 변경 없음. 앱 tsc 통과.
- **앱 화면 전환 체감 속도 조정** — Android에서 전환이 느리게 느껴져 루트 Stack 기본 전환을 더 가벼운 `simple_push`로 변경하고, 릴스는 즉시 진입하도록 `none`으로 조정. 화면 로직/레이아웃 변경 없음. 앱 tsc 통과.
- **앱 스토리/릴스 전환 옵션 재조정** — 스토리 뷰어는 느린 하단 슬라이드 대신 `fade`로 바꾸고, 릴스는 즉시 전환 대신 기본 흐름과 맞는 `simple_push`로 조정. 화면 로직/레이아웃 변경 없음. 앱 tsc 통과.
- **앱 Android 엣지투엣지 opt-out 보강** — SDK 54/Android 15+ 엣지투엣지 강제 대응으로 Android theme에 `windowOptOutEdgeToEdgeEnforcement=true`를 주입하는 config plugin을 추가하고, 스토리 뷰어·릴스만 검정 시스템바 프리셋을 쓰도록 전역 `SystemBarsController`에서 몰입형 route 예외를 관리하게 정리. `expo config --type introspect --json`으로 `AppTheme`/`Theme.App.SplashScreen` 반영 확인, 앱 tsc 통과. 실제 반영은 EAS dev build 후 실기기 확인 필요.

## 2026-07-20

### 완료
- **앱 콜드스타트 온보딩 게이트 단축** — 세션 부트스트랩에서 `getCurrentUserProfile()`를 한 번만 호출해 탈퇴 여부와 온보딩 필요 여부를 함께 판정하도록 정리하고, 인증 프로필 조회의 `auth.getUser()` 네트워크 검증을 로컬 세션 기반 `auth.getSession()`으로 교체. 온보딩 완료 여부는 user id별 AsyncStorage 플래그로 저장해 완료 계정은 앱 재실행 시 온보딩 로딩 게이트를 즉시 통과시키고, 서버 확인은 백그라운드로 계속 수행해 온보딩 재필요/탈퇴 상태를 보정. 앱 tsc 통과.
- **앱 홈 피드 재진입 즉시표시 캐시 ⑥-1 적용** — 모바일 홈 피드에 90초 TTL 메모리 페이지 캐시를 추가해 홈 → 탐색 → 홈, 홈 → 게시물 상세 → 뒤로 복귀 시 캐시가 신선하면 로딩 화면과 focus 재조회를 건너뛰고 이전 피드를 즉시 표시하도록 변경. 캐시 값에는 현재 세션 user id를 함께 저장해 계정 전환 시 캐시 미스를 강제하고, 로그아웃/인증 유저 변경 시 페이지 캐시와 유저 컨텍스트 캐시를 함께 정리. 당겨서 새로고침은 캐시를 무시하고 네트워크로 새로 받아 캐시까지 갱신. 앱 tsc 통과.
- **앱 탐색/프로필 재진입 즉시표시 캐시 ⑥-2 적용** — 홈 피드 ⑥-1 패턴을 탐색·프로필로 확대. 탐색은 90초 TTL 메모리 캐시로 posts/offset/user id를 보관해 재진입 시 스켈레톤 없이 즉시 표시하고, 프로필은 닉네임별 60초 TTL 캐시 + 뷰어 user id guard로 본인/상대 프로필을 즉시 표시하되 방문 지표는 캐시 히트 시에도 유지. 프로필 편집, 크루 액션, 즐겨찾기, 차단/해제, 게시물 작성/삭제 성공 시 관련 프로필 캐시를 무효화하고 `clearAllPageCaches`에 탐색·프로필 캐시를 합류. 앱 tsc 통과.
- **앱 체감 로딩 개선 1차** — 홈/탐색/프로필 첫 진입 로딩을 전체 스피너 문구 대신 콘텐츠 형태 스켈레톤으로 교체하고, 무한스크롤 하단 로딩은 텍스트 없이 작은 스피너만 보이도록 간소화. 피드/탐색 페이지 로드 직후 `expo-image` prefetch로 다음 이미지·썸네일을 미리 받아 스크롤 체감을 개선하고, 그리드/리스트 이미지에 `recyclingKey`를 확대 적용해 재활용 이미지 잔상을 줄임. 앱 tsc 통과.
- **앱 스켈레톤 치수를 실제 화면에 맞춤** — 스켈레톤이 실제보다 커서(헤더 버튼 52 vs 44, 카드 모서리 24 vs 18, 카드 헤더 여백 24/18 vs 16/11, 사진이 정사각 고정) 스켈레톤 → 실제 콘텐츠 전환 시 화면이 튀던 문제를 수정. 홈/탐색/프로필 스켈레톤을 대응 컴포넌트의 실제 padding·margin·radius·크기에 맞추고, 피드 사진 영역은 가장 흔한 세로(4:5) 기준으로 변경. 앱 tsc 통과. (커밋 `7b91954`)
- **앱 재진입 캐시 유지 시간 5분으로 통일** — 홈 90초·탐색 90초·프로필 60초로 제각각이던 TTL을 모두 300초로 통일. 잠깐 다른 앱을 보고 돌아와도 재진입이 즉시 뜨도록 조정했고, 완전 종료 후 재실행은 기존대로 항상 새로 로드(메모리 캐시라 앱 종료 시 소멸). 프로필은 편집·크루 액션·차단 시 즉시 무효화되므로 5분이어도 안전. (커밋 `eb63e9b`)
- **DATABASE.md 실물 검증 반영** — 원격 DB를 직접 조회해 문서와 대조. `follows` 테이블이 DB에 존재하는데 문서에 누락돼 있어 추가(다학교 확장 대비 생성, 현재 코드 미사용)하고, 커뮤니티 테이블(`community_posts`/`community_comments`)은 설계만 있고 **DB 미생성**임을 명시. 총계를 실제 24개(23 도메인 + `signup_allowlist`, 전부 RLS)로 정정. (커밋 `04d2607`)

## 2026-07-18

### 완료
- **앱 현재 유저 조회 로컬 세션 전환 ① 적용** — `getCurrentUserId`/`getCurrentUserContext`가 매 호출마다 부르던 `auth.getUser()`(서버 토큰 검증 = 네트워크 1왕복)를 `auth.getSession()`(로컬)으로 교체. 데이터 접근은 RLS가 서버에서 강제하므로 보안 영향 없이 피드/릴스/탐색/프로필 호출마다 왕복 1회씩 감소. 앱 tsc 통과. (커밋 `24d8d7a`)
- **앱 세션 컨텍스트 조회 캐시 ② 적용** — 모바일 `getCurrentUserContext`의 `university_id` 조회를 현재 세션 user id 기준 모듈 캐시로 줄이고, `getBlockRelatedUserIds`에 30초 TTL + in-flight dedupe 캐시를 추가. 차단/차단해제 성공 및 로그아웃 시 캐시를 무효화해 계정 전환 시 이전 계정의 학교/차단 데이터가 남지 않도록 처리.
- **앱 게시물 조회 왕복 최적화 ③ 적용** — 모바일 피드/릴스/게시물 상세의 posts 조회에 작성자(`users`)와 미디어(`post_media`) PostgREST 임베딩을 추가해 기존 posts → users → post_media 순차 조회를 단일 posts 쿼리로 축소. `hydrateFeedPosts`는 추가 Supabase 호출 없이 임베딩 결과를 `FeedPost` UI 타입으로 매핑만 하도록 정리했고, 미디어 `order_index` 정렬과 릴스 영상 필터(`post_media!inner` + `type='video'`)는 유지. 앱 tsc 통과.

## 2026-07-16

### 완료
- **앱 홈 피드 영상 시작/정지 깜빡임 완화** — 피드 영상 카드가 active로 전환될 때 `VideoView` 첫 프레임이 실제 렌더되기 전 검은 native surface가 노출되던 문제를 줄이기 위해, `FeedVideoPlayer`에 `onFirstFrameRender` 기반 썸네일 커버를 추가. 한 번 활성화된 영상은 비활성화 시 `VideoView`를 바로 내리지 않고 pause만 해 마지막 프레임을 유지하며, 일부 기기에서 첫 프레임 이벤트가 누락돼 썸네일이 계속 덮이는 경우를 막는 fallback을 추가. 앱 tsc 통과.

## 2026-07-14

### 완료
- **앱 프로필 편집 Samsung Pass 오탐 완화** — 삼성폰에서 프로필 편집의 닉네임/한 줄 소개 입력을 로그인 폼으로 오인해 Samsung Pass 바와 저장 팝업이 뜨던 문제를 완화. 메인 편집 화면의 닉네임/소개를 직접 `TextInput`이 아닌 표시 영역으로 바꾸고, 각각 별도 모달에서만 편집하도록 분리. 특히 소개 입력에는 Android 삼성 키보드 오탐을 줄이기 위해 `keyboardType="visible-password"`를 적용. 앱 tsc 통과, 실기기에서 Samsung Pass 저장 팝업 제거 확인.

## 2026-07-09

### 완료
- **릴스 재생 마무리 + 영상 화질 확인 + 지표 시스템 설계** — 스토리 영상 이어서 릴스까지 정리.
  - **릴스 되감기 이어재생 수정** — 릴스도 스토리처럼 되감으면 나갔던 지점부터 재생되던 것을, **"비활성 될 때" 0초로 미리 되돌려** 두는 방식으로 수정(재활성 시 되감으면 옛 프레임이 찰나 보이는 플래시까지 제거). `minBufferForPlayback 1→0.5`로 되감기 후 멈칫 완화. (커밋 `cad96a6`·`1e38660`·`e77c061`)
  - **릴스 8MB 버퍼 캡 제거** — 구 무압축 mp4 OOM 방지용이었는데 이제 Cloudflare HLS(조각 스트리밍)라 통째로 RAM에 안 올라가 불필요. 실기기 로그(`player.videoTrack`)로 **1080x1920(1080p) 재생 확인**(8Mbps 고비트레이트도 버퍼부족 없이), 여러 개 스크롤 크래시 없음. (커밋 `fd78411`)
  - **영상 화질 조사** — 720p 제한 같은 건 코드에 없음(영상 picker `quality:1`·해상도 무제한, 원본 그대로 Cloudflare 업로드). Cloudflare가 240p~1080p 적응형 생성 → 인터넷 따라 자동 화질(HLS ABR). 흐린 건 특정 영상의 낮은 비트레이트(원본/Cloudflare 인코딩)지 우리 제한 아님. **영상 편집 기능은 MVP 제외**(외부 편집→업로드가 표준, ffmpeg-kit 지원종료).
  - **지표 측정 현황 조사** — `posts`에 views/likes/comments_count 컬럼 있으나 **조회수는 측정 코드 없음**(recount_post_views 없음). `story_views` 테이블로 스토리 조회는 측정됨. 스토리에 게시물 공유(shared_post) 필드 없음(=인스타식 스토리 공유 미구현).
  - **📊 인사이트(지표) 시스템 설계 확정** — 노션 전용 페이지 신설. 전략(무조건 노출→지표로 "영향력 있어"→캠퍼스 크리에이터 전환), 지표세트(도달·조회수·프로필방문·링크클릭·CTR·저장·공유·참여율), 본인만·일/주/월 시간축, 저장방식 A(총재생·릴스조회수)/B(1인1일1회→고유·도달/방문/클릭), 노출은 폐기(도달로 대체), DB트리거 아닌 클라 감지+RPC. 기존 백로그 "링크 클릭" 항목 흡수. **다음 큰 작업 후보.**
- **스토리/릴스 영상 재생 대공사 (스킵·멈칫·이어재생·캐시)** — 아침 Codex의 스토리 세션/탭존 수정이 안 잡혀 revert된 뒤, Claude Code가 실기기 로그로 원인 확정하며 순차 수정.
  - **즉시 스킵 버그** — 영상 진입 시 expo-video가 소스 교체(null→uri) 때 쏘는 **가짜 playToEnd**를 종료로 오인 → `goNext`가 불려 영상 스킵. 재생위치가 실제 끝 근처일 때만 넘기도록 가드. (로그로 확정) (커밋 `91582b7`)
  - **영상 preload(±1 창)** — 현재 ±1의 준비된 영상을 미리 버퍼링(`key`로 인스턴스 유지) → 앞으로 넘길 때 멈칫 완화. 동시 플레이어 최대 3개(메모리 안전). (커밋 `09f6b2c`)
  - **재진입 시 처음부터 재생(`isCurrent`)** — preload 재사용 플레이어가 재생위치를 기억해 "이어재생"되던 회귀를, 현재가 될 때 0초 리셋으로 수정(수동 일시정지와 구분). (커밋 `09f6b2c`)
  - **버퍼링 중 썸네일** — 뒤로 재시청 재버퍼 동안 멈춘 프레임 대신 poster(`statusChange` `loading` 감지). (커밋 `557e73d`)
  - **HLS 버퍼 캡 제거** — 원격 HLS는 8MB 캡(원래 로컬 mp4 OOM용) 제거, 로컬 원본만 유지.
  - **영상 디스크 캐시(`useCaching`)** — 스토리·릴스·피드 적용. 한 번 받은 영상 디스크 저장 → 재시청 재다운 방지(안드 HLS 지원, iOS HLS 미지원). 디스크라 OOM 무관. 스토리 재시청 즉시화 확인. 기본 1GB LRU. (커밋 `affc6f4`)
  - 테스트 계정 `test1@kookmin.ac.kr`(Test1234!) Supabase 직접 시드(가짜 국민대·온보딩 완료, auth.users NULL 토큰 채움). 테스트 후 삭제 예정.
  - **남은 것**: 릴스도 되감기 시 이어재생(활성 재개 0초 리셋 없음, 캐시 무관 — 기존 로직) → 스토리와 같은 방식으로 수정 예정. 첫 영상 멈칫(열기 전 preload 불가)은 남음.
- **앱 스토리 뷰어 전역 세션 캐시 제거** — 스토리 진입 정확도를 해칠 수 있던 `storyViewerSession` 단기 전역 캐시를 제거하고, 뷰어가 라우트의 `userId`와 `getStories()` 결과만으로 시작 그룹을 결정하도록 단순화. 시작 유저를 못 찾으면 다른 유저 0번 그룹으로 fallback하지 않고 닫히게 유지해 “내 스토리/특정 유저 스토리 진입 시 다른 사용자 스토리 표시” 가능 경로를 차단. 앱 tsc 통과.
- **안드로이드 테스터용 preview APK 첫 빌드 성공** — `eas.json` preview에 APK 명시(`buildType:apk`) + `eas env:push preview`로 EAS에 환경변수(Supabase URL/anon key·구글 client id·SITE_URL) 업로드. **첫 빌드 실패 원인 = Sentry 소스맵 업로드**: release 빌드에서 `@sentry/react-native`의 `sentry.gradle`이 `sentry-cli`로 소스맵을 올리는데 org/토큰 미설정이라 "organization ID required"로 gradle이 죽음(dev=debug 빌드는 이 단계 없어 안 터졌던 것). `SENTRY_DISABLE_AUTO_UPLOAD=true`(sentry.gradle이 실제 검사하는 플래그 확인)로 업로드만 끄고 재빌드 → 26분 성공, 테스터용 APK 13일 다운 가능. 런타임 크래시 수집은 유지. **후속: 정식 출시 전 Sentry 토큰 넣어 소스맵 살리기, preview 실기기 실행 검증, dev/preview 동시설치는 앱 variant(`.dev`) 분리.**
- **스토리 3버그 실기기 진단(Codex 수정과 병렬)** — ① 카메라 진입 시 피드 영상 잔상(영상만): expo-video native surface 늦은 release + 카메라 준비 전 검은 커버 부재. ② 내 스토리→다음 눌러도 피드 복귀: 뷰어가 홈 스토리바 목록 대신 진입마다 `getStories()` 재조회 → 다음 그룹 없으면 `goNext`가 끝으로 판단. ③ 진입 첫 순간만 버벅: 진입 시퀀스+native player 준비 지연(재생 중 정상 = 버퍼 문제 아님). → 진단을 Codex에 넘겨 아래 수정으로 이어짐.
- **앱 스토리 뷰어 시작 유저/이전탭 상태 꼬임 수정** — 홈 스토리바 세션 전달 후 `StoryViewerScreen`/`StoryPlayer`가 이전 재생 상태를 재사용해 내 스토리 진입 시 다른 유저가 보이거나, 여러 스토리에서 왼쪽 탭이 이전 스토리 이동 대신 진행바만 초기화되는 문제를 방지. 뷰어 데이터 변경 시 `StoryPlayer`를 새 key로 remount하고, `useStoryPlayer`도 새 `initialGroups/startIndex`에 맞춰 내부 index/progress/시트 상태를 초기화하도록 보강. 앱 tsc 통과.
- **앱 스토리 전환/카메라 잔상 원인 대응** — 홈 스토리바의 `storyGroups`를 뷰어 진입 전에 단기 세션으로 넘겨 `StoryViewerScreen`의 진입 즉시 재조회/로딩을 줄이고, 바에서 보던 유저 순서 그대로 이어보도록 조정. 스토리 작성 카메라는 `onCameraReady` 전까지 검은 불투명 커버를 덮어 피드 영상 native surface 잔상이 비치지 않게 했고, 피드/스토리 영상 `VideoView`는 Android 전환 겹침에 강한 `textureView`로 변경. 스토리 영상은 첫 프레임 렌더 전 썸네일을 poster로 보여 진입 튐을 완화. 이전 검은 닫기 대기 화면은 제거. 앱 tsc 통과.

## 2026-07-08

### 완료
- **앱 스토리 닫기 잔상 완화** — 스토리 종료/닫기 시 `router.back()`을 즉시 호출하지 않고, `StoryPlayer` 내부 미디어를 먼저 검정 화면으로 비운 뒤 짧게 대기하고 라우트를 닫도록 변경. `StoryVideoView` 언마운트 시 player pause/source null 정리도 추가해 기본 Stack 전환은 유지하면서 `expo-video` native surface 잔상을 줄임. 앱 tsc 통과.
- **앱 온보딩 동의 문구 법적 정정** — 온보딩 동의 체크박스 문구를 "개인정보**처리방침**에 동의" → "개인정보 **수집·이용**에 동의"로 수정. 근거: 개인정보보호법상 처리방침은 공시 문서라 동의 갈음 불가, 동의는 "수집·이용 동의" 형태여야 함(웹 검색으로 catchsecu/카카오 데브톡/법 제15조 확인). 소셜 로그인 "인증 후 온보딩 동의" 순서 자체는 2단계 동의 구조(1: 구글 OAuth 제공 동의 → 2: 서비스 수집·이용 동의, 서비스 이용 전 완료)로 합법 확인. 앱 tsc 통과. (커밋 `0f57f4c`)
- **웹 회원가입 필수 동의 체크박스 추가** — 웹 `SignupForm`에 이용약관·개인정보 수집·이용 각각 **필수 체크박스 2개**(A안) 추가. 둘 다 체크해야 이메일 가입/구글 가입 버튼 활성(구글 가입도 계정 생성이라 동일 게이트), 링크는 `/terms`·`/privacy` 새 탭. 앱 온보딩(체크박스 1개 묶음)과 방식은 다르나 둘 다 필수 동의라 유효. 웹 tsc 통과. (커밋 `aa48d39`)
- **앱 스토리 공용 영상 뷰 release 경합 방어** — `StoryVideoView`에 `isActive` 안전장치를 추가해 화면에 실제로 보여질 때만 `VideoView`를 네이티브 뷰에 연결하도록 변경. 빠른 화면 전환/제출 중 `expo-video` player가 먼저 release되는 경우를 대비해 progress/read·play/pause·listener cleanup에 예외 방어 추가. 스토리 작성/게시물 작성 영상 미리보기는 제출 중 공용 영상 뷰를 비활성화해 코덱 점유를 줄임. 앱 tsc 통과.
- **앱 내 활동 스토리 미리보기 시트 구조 분리 리팩토링** — 동작 변경 없이 `ActivityStoryPreviewSheet`에 인라인으로 있던 스토리 미디어 프리뷰, 메타 정보 row, 조회자 목록/조회자 row, 날짜 포맷 유틸을 `components/activity` 하위 순수 UI 조각으로 분리. 기존 조회자 패널 애니메이션/열림 상태는 시트에 유지. 앱 tsc 통과.
- **앱 게시물 작성 화면 구조 분리 리팩토링** — 동작 변경 없이 `WriteScreen`에 인라인으로 있던 작성 헤더, 사진/영상 미디어 선택, 영상 미리보기, 본문 입력, 비율/공개범위 설정 UI를 `components/write/Write*` 순수 UI 컴포넌트로 분리. `useWriteForm` 업로드/사진·영상 선택/제출 로직은 그대로 유지. 앱 tsc 통과.
- **iOS 빌드 대비 app.json 설정 준비** — Apple 개발자 계정 결제 후 iOS dev build를 바로 시작할 수 있도록 `expo.ios.bundleIdentifier`를 `com.univer.app`으로 추가. iOS 권한 설명은 중복 `infoPlist` 대신 설치된 config plugin 기준으로 설정: `expo-camera`에 마이크 권한 문구 추가, `expo-image-picker` 플러그인에 사진 접근 권한 문구 추가. iOS Google OAuth/푸시(APNs)는 아직 외부 설정이 없어 건드리지 않음. app.json JSON 검증 + 앱 tsc 통과. 빌드는 실행하지 않음.
- **앱 Sentry(에러 모니터링) + expo-updates(OTA) 도입** — 다음 EAS 빌드에 네이티브 변경을 한 번에 묶으려고 함께 설치(`npx expo install`). `@sentry/react-native`는 앱용 별도 Sentry 프로젝트(`krew-7d/react-native`)로 연결 — 초기화는 `src/lib/sentry.ts` 전용 파일(개발 Metro에선 `enabled: !__DEV__`로 끄고 실제 빌드에서만 수집, `sendDefaultPii: false`로 PII 최소화), `app/_layout`은 `Sentry.wrap()` 한 줄만(god 파일 X). `expo-updates`로 OTA 구성(app.json `updates.url`+`runtimeVersion: appVersion`, eas.json 빌드 프로필별 `channel`) → 이후 **JS 변경은 재빌드 없이 무선 반영**. Sentry Expo 플러그인은 `expo install`이 app.json에 자동 추가. 앱 tsc 통과. **실제 반영은 다음 EAS 빌드부터**(네이티브라). 후속: 소스맵용 Sentry auth 토큰(EAS 시크릿), 첫 배포 후 `eas update`, 개인정보처리방침에 Sentry 추가.
- **앱 프로필 메인 화면 구조 분리 리팩토링** — 동작 변경 없이 `ProfileScreen`에 인라인으로 있던 탭/푸시 헤더, 상대 프로필 더보기 메뉴, 프로필 패널+크루 액션+게시물 그리드 본문을 `ProfileHeaderBar`, `ProfileMoreMenu`, `ProfileContent`, `ProfilePostGridSection` 순수 UI 컴포넌트로 분리. `useProfile` 데이터/액션 로직과 라우팅 콜백은 화면에 유지. `ProfileScreen.tsx`는 167줄로 축소. 앱 tsc 통과.
- **Sentry 에러 모니터링 도입 (웹)** — `@sentry/nextjs` 마법사로 웹에 Sentry 연동. 에러/크래시 + Tracing(성능)만 켜고, Session Replay·Logs는 프라이버시(세션 녹화·로그 PII)·번들·할당량 이유로 제외, 광고차단 우회(tunnelRoute)도 서버비용 이유로 끔. `next.config.ts` `withSentryConfig` 래핑(기존 Supabase 이미지 remotePattern 유지 확인), `sentry.server/edge.config`·`instrumentation`·`instrumentation-client`·`global-error` 생성. auth 토큰은 `.env.sentry-build-plugin`(gitignore)로 커밋 제외 확인. **후속**: Vercel에 `SENTRY_AUTH_TOKEN` 환경변수(프로덕션 소스맵), 개인정보처리방침 처리위탁에 Sentry 추가, HTTP body/PII 수집 차단, `tracesSampleRate` 조정(유저 증가 시), 예제 페이지(`/sentry-example-page`) 검증 후 삭제. 앱(모바일)은 재빌드 필요해 별도.
- **앱 프로필 편집 화면 구조 분리 리팩토링** — 동작 변경 없이 `ProfileEditScreen`에 인라인으로 있던 아바타 변경, 닉네임 입력/검증 메시지, 학과 읽기전용 필드, 한 줄 소개, 대표 링크 에디터, 저장 버튼을 `components/profile/ProfileEdit*` 순수 UI 컴포넌트로 분리. `useProfileEdit` 폼 로직/저장/업로드/중복확인 흐름은 그대로 유지. `ProfileEditScreen.tsx`는 상태 연결과 화면 레이아웃만 담당하도록 축소(171줄). 앱 tsc 통과.
- **앱 프로필 API 역할별 분리 리팩토링** — 동작 변경 없이 `features/profile/api.ts`를 public re-export 진입점으로 축소하고, 프로필/게시물/통계 조회(`profileQueries`), 크루 상태·신청·수락·거절·삭제 RPC(`profileConnections`), 크루 목록(`profileConnectionLists`), 즐겨찾기(`profileFavorites`), 내부 row 타입/RPC 응답 검증/링크 조회(`profileInternal`)로 분리. 기존 호출부 import 경로는 유지하고 새 API 조각은 모두 200줄 이하로 유지. 앱 tsc 통과.
- **법적 문서 URL `LEGAL_URLS` 상수 통합(작은 정리)** — 온보딩/설정에 중복돼 있던 `/terms`·`/privacy`·`/guidelines` 경로를 `lib/site.ts`의 `LEGAL_URLS` 상수로 모아 재사용. 동작 변경 없음, 앱 tsc 통과. (커밋 `49ae2e3`)
- **앱 가입 동의 체크박스 + 설정 약관 링크** — 온보딩 화면에 "이용약관·개인정보처리방침 동의(필수)" 체크박스 추가(링크 탭 시 웹 문서 열림, 미체크면 "시작하기" 버튼 비활성) → 법적 문서 효력을 위한 **가입 시 동의 확보**. 설정에 "약관 및 정책" 섹션(이용약관/개인정보처리방침/커뮤니티 가이드라인 — `SITE_URL` 기준 웹 페이지 열기) 추가. 앱 tsc 통과. **후속: 웹 회원가입 동의 체크박스**(웹 email+password 가입 경로).
- **앱 내 활동 API 역할별 분리 리팩토링** — 동작 변경 없이 `features/activity/api.ts`를 public re-export 진입점으로 축소하고, 스토리 보관함/조회자(`activityStories`), 저장·좋아요·댓글 단 게시물(`activityPosts`), 게시물 공통 조립/차단 필터(`activityPostHydration`), 즐겨찾기 계정(`activityFavorites`), 타입(`activityTypes`)으로 분리. 기존 호출부 import 경로는 유지하고 모든 새 API 조각은 200줄 이하로 유지. 앱 tsc 통과.
- **법적 문서 보강 + 커뮤니티 가이드라인 신설** — 개인정보처리방침(`/privacy`)에 국외이전(Cloudflare·Vercel·Google) 명시 + 수집항목에 영상 명시. 커뮤니티 가이드라인 페이지(`/guidelines`) 신설(금지행위/신고·차단/신고 처리·제재 기준/문의) — 신고 대응 운영의 기준 문서(약관의 일부). 이용약관(`/terms`) 제5조에 가이드라인 위반 조치 근거 추가 + 3개 문서 상호 링크. 미들웨어 비로그인 예외에 `/guidelines` 추가. 운영자명/문의이메일/보호책임자/시행일 등 개인정보 4곳은 placeholder 유지(확정 후 기입). 남은 것: **가입 동의 체크박스**(문서 효력 완성), 앱 설정에서 3문서 링크. 웹 tsc 통과.
- **보안 후속: 탈퇴 계정 영구삭제 보존기간 하한 강제** — `purge-deleted-accounts` Edge Function에서 `retentionDays`가 정수 30일 미만이면 400으로 거부하도록 입력 검증 추가. DB 함수 `public.purge_deleted_accounts(int, boolean)`에도 동일하게 30일 미만 예외를 추가하는 마이그레이션을 원격 적용하고 migration history를 `applied`로 정리. 원격 DB 검증: 29일 dry-run은 예외로 차단, 30일 dry-run은 정상 응답. Edge Function도 재배포 완료. Deno CLI가 로컬에 없어 Edge Function 타입체크는 미실행.

## 2026-07-07

### 완료
- **앱 스토리바 썸네일 하단 그라데이션(웹 기준 맞춤)** — 앱 `StoryBar` 썸네일 하단의 단색 띠(`rgba(13,13,18,0.42)` 네모난 하드엣지)를 웹과 동일한 하단 그라데이션(`LinearGradient` 투명→`rgba(0,0,0,0.55)`, 높이 56px = 웹 `h-14 from-black/55 to-transparent`)으로 교체. 사진은 위쪽까지 선명하게 살고 닉네임 가독성은 유지. 동작 변경 없음(비주얼만), 앱 tsc 통과.
- **보안 감사(fable) + 콜백 도메인게이트 우회 수정** — fable 서브에이전트로 읽기전용 보안 감사(Edge Functions·콜백·미들웨어·RPC/필터·딥링크·시크릿/로그·`any`). 코드베이스 전반 깨끗 확인(오픈리다이렉트 없음, 인젝션 없음, 외부링크 https만, 웹 `any` 0). `get_user_real_name` RPC 정의 직접 확인 → 본인/`accepted` 크루만 실명 반환(IDOR 아님, 안전). **[중간] 발견 수정**: 콜백(`auth/callback/route.ts`)의 recovery 예외(`next=/auth/reset-password`면 도메인검사 skip)가 클라가 준 `next`로 도메인 게이트를 우회할 수 있는 defense-in-depth 공백 → 예외 제거하고 도메인 게이트 항상 적용. `resetPasswordForEmail`도 국민대 도메인 강제 복구(오늘 완화분 되돌림). 관리자 비번 변경은 로그인 상태 `/auth/reset-password` 직접 접근으로 처리(예외 불필요). 남은 저위험 발견(stream-status 소유권/purge retentionDays 하한/webhook enforce fail-closed/reports 검증)은 후속 배치. 웹 tsc 통과.
- **앱 검색 화면 구조 분리 리팩토링** — 동작 변경 없이 `SearchScreen`에 인라인이던 검색 결과 카드와 최근 검색 카드를 순수 UI 컴포넌트로 분리(`components/search/SearchResultsList`, `components/search/RecentSearchList`). `SearchScreen`은 훅(`useUserSearch`) 연결 + 프로필 라우팅만 담당. 기존에 이미 분리돼 있던 `SearchInput`/`SearchUserRow`/`useUserSearch`/`history.ts`는 그대로 재사용, Supabase 쿼리는 `features/search/api.ts` 유지, 최근 검색 AsyncStorage(`history.ts`) 유지. `any`/새 라이브러리 없음. 앱 tsc 통과.
- **앱 알림 API 역할별 분리 리팩토링** — 동작 변경 없이 `features/notifications/api.ts`를 public re-export 진입점으로 축소하고, 알림 목록 조회(`notificationQueries`), 읽음 처리(`notificationMutations`), 타입별 메타 보강(`notificationMeta*`), 관련 데이터 로드(`notificationRelatedData`), 화면 모델 변환(`notificationHydration`), 내부 타입/유틸(`notificationDbTypes`/`notificationUtils`)로 분리. 푸시 등록(`push.ts`)·탭 라우팅(`navigation.ts`)은 기존 분리 구조 유지. 모든 새 API 조각은 200줄 이하로 유지. 앱 tsc 통과.
- **Supabase egress 쿼터 초과(402) 복구 + 비용 정리** — 조직 Cached egress 39.35GB/무료 5.5GB 초과로 로그인 포함 전 요청이 402 Payment Required로 차단됨. 원인은 07-03 레거시 영상 loop 재생 사고(38GB, 이미 막힘)가 이번 청구주기에 소비된 것. 안 쓰는 죽은 프로젝트 `krew-dev` 삭제로 Pro 인보이스 $34.62→$25 정리 후 업그레이드 → 402 해제·로그인/피드/이미지/푸시 복구 확인. 재발 방지: 다음 결제일 전 Free 다운그레이드 / Spend cap ON / egress·402 시 영상누수+죽은프로젝트 컴퓨트부터 의심. (노션 이슈트래커 기록)
- **보안 점검 — 유출비번 차단 ON + RLS 전수 점검** — Supabase advisor 확인(치명 ERROR 없음, admin RPC 4종은 내부 `role='admin'` 검사 확인됨=오탐). Auth에 "유출 비밀번호 차단(HaveIBeenPwned)" ON. 22개 테이블 RLS 전수 점검: 전부 RLS ON이고 민감 테이블(DM/대화/알림/차단/북마크/친한친구/스토리조회자/신고/즐겨찾기) SELECT 정책이 모두 `auth.uid()` 본인·참여자 한정으로 정상. 서비스키(`service.ts`)는 `server-only`+env라 번들/레포 노출 없음 확인. 남은 실질 노출은 크루공개/비공개 사진의 public 버킷(공개 전 signed URL로 잡을 #2 과제).
- **관리자 계정 강화 + 비번 재설정 링크 튕김 수정** — 콜백(`auth/callback/route.ts`)이 국민대 이메일 아니면 무조건 로그아웃시켜 gmail 관리자 계정의 비번 재설정 링크가 로그인으로 튕기던 문제 수정: recovery 흐름(`next=/auth/reset-password`)일 때 도메인 재검사 skip(재설정 링크는 가입된 계정에만 발송되어 안전), 일반 로그인/가입은 학교 도메인 유지. 클라 `resetPasswordForEmail`의 국민대 강제도 형식 검사로 완화. 관리자 비번 변경 완료(진행 중 "Require current password when updating" 설정이 재설정 페이지와 충돌해 OFF로 정리 — 재설정 페이지에 현재비번 칸이 없어 구조상 비호환). Redirect URL 목록에 콜백 주소 존재 확인. 관리자 후속: 관리자 gmail 구글 2단계인증 권장(로그인은 email+password 유지). (커밋 `3a30bb8`, Vercel 배포 READY)
- **앱 스토리 API 역할별 분리 리팩토링** — 동작 변경 없이 `features/stories/api.ts`를 public re-export 진입점으로 축소하고, 업로드(`storyUpload`), 생성/삭제(`storyMutations`), 목록 조회(`storyQueries`), 조회자 조회(`storyViewerQueries`), 조회/좋아요 상호작용(`storyInteractions`), DB row → `Story` 변환(`storyHydration`), 내부 타입/유틸(`storyTypes`/`storyPostgrest`)로 분리. 모든 새 API 조각은 200줄 이하로 유지하고 기존 호출부 import 경로는 유지. 앱 tsc 통과.
- **앱 채팅 API 역할별 분리 리팩토링** — 동작 변경 없이 `features/chat/api.ts`를 public re-export 진입점으로 축소하고, 대화 접근권한(`chatAccess`), 대화 목록(`chatConversationList`), 대화 생성/요청수락(`chatConversationMutations`), 메시지 조회/전송/읽음(`chatMessages`), 게시물 공유 메시지(`chatSharedPosts`), 안읽음 수(`chatUnread`), 타입(`types`)으로 분리. 모든 새 API 조각은 200줄 이하로 유지하고 기존 호출부 import 경로는 유지. 앱 tsc 통과.
- **앱 홈 피드 훅 책임 분리 리팩토링** — 동작 변경 없이 `useHomeFeed` 내부의 페이지 로딩/새로고침/무한스크롤(`useHomeFeedPagination`), 좋아요·저장·차단·신고·삭제·댓글수 액션(`useHomeFeedActions`), 화면 복귀 시 좋아요·저장·카운트·차단/삭제 상태 동기화(`useHomeFeedSync`)를 분리. 기존 공개 인터페이스는 유지해 `HomeScreen` 호출부 변경 없이 적용. `useHomeFeed.ts` 331줄 → 76줄. 앱 tsc 통과.
- **가입 학교 도메인 서버 강제 + 관리자 allowlist** — 회원가입이 앱 폼/`hd` 힌트로만 학교 이메일을 제한하고 서버(`handle_new_user` 트리거)는 도메인 검사 없이 아무 이메일이나 첫 활성 학교로 등록하던 구멍을 막음. `handle_new_user`를 가입 이메일 도메인 ↔ `universities.domain` 대조로 교체(매칭 없으면 `signup_allowlist`만 예외 허용, 아니면 `RAISE EXCEPTION`). `signup_allowlist` 테이블 신설(RLS ON·정책 없음 = 클라 접근 불가) + 관리자 `simsim020304@gmail.com` 시드. 실사용자는 `@kookmin.ac.kr`만 가입, 외부 이메일은 폼/API 우회해도 서버 차단, 관리자 gmail만 통과. 기존 계정/로그인 영향 없음(트리거는 신규 가입만). 5개 케이스 로직 검증 완료. `docs/DATABASE.md` 반영.
- **앱 영상 플레이어 release 경합 완화** — 피드/릴스에서 `expo-video` `VideoView`가 이미 release된 player를 다시 받으며 `Cannot use shared object that was already released` 콘솔 에러가 뜨던 문제 완화. 피드 영상은 활성 카드일 때만 `VideoView`를 렌더하고, 릴스는 활성 근처+ready 영상일 때만 `VideoView`를 렌더하도록 제한해 화면 밖 영상의 player/view 연결 경합을 줄임. 앱 tsc 통과.
- **앱 홈 화면 구조 분리 리팩토링** — 동작 변경 없이 `HomeScreen`의 피드 리스트 렌더(`HomeFeedList`), 댓글/공유 시트 묶음(`HomeSheets`), 인라인 에러/피드백(`HomeFeedbackBanner`), 초기 로딩/에러 상태(`HomeScreenStates`), 홈 네비게이션 콜백(`useHomeNavigation`)을 분리. `useHomeFeed`의 토스트 타이머(`useHomeFeedFeedback`)와 Cloudflare 영상 상태 폴링(`useHomeVideoStatusPolling`)도 별도 훅으로 분리. `HomeScreen.tsx` 371줄 → 197줄. 앱 tsc 통과.
- **앱 댓글 시트 구조 분리 리팩토링** — 동작 변경 없이 `CommentsSheet`의 댓글 목록(`CommentsList`), 원댓글+답글 묶음(`CommentThread`), 입력/답글 배너(`CommentInputBar`), 삭제/신고 메뉴(`CommentActionMenus`), 헤더(`CommentsSheetHeader`), 드래그 제스처(`useCommentsSheetDrag`)를 분리. 신고/삭제는 기존 `useComments` 핸들러와 공용 `ActionSheet`/`ConfirmDialog`를 그대로 재사용. `CommentsSheet.tsx` 499줄 → 190줄. 앱 tsc 통과.
- **앱 피드 API 역할별 분리 리팩토링** — 동작 변경 없이 `features/feed/api.ts`를 public re-export 진입점으로 축소하고, 조회(`feedQueries`), 작성/삭제(`postMutations`), 좋아요·저장·카운트(`postInteractions`), 업로드(`postUpload`), Cloudflare 상태 조회(`videoStatus`), DB row → `FeedPost` 조립(`feedHydration`), 내부 타입(`internalTypes`)으로 분리. 기존 호출부 import 경로는 유지. 주요 파일에 역할 설명 주석 추가. 앱 tsc 통과.

## 2026-07-06

### 완료
- **앱 채팅방 화면 구조 분리 리팩토링** — 동작 변경 없이 `ChatRoomScreen`의 pending 요청 배너(`ChatRequestBanner`), inverted 메시지 리스트/시간 구분선(`ChatMessageList`), 차단 액션시트/확인 다이얼로그(`ChatRoomMoreMenu`)를 하위 컴포넌트로 분리. 화면은 `useChatRoom` 훅 연결과 라우팅 조합만 담당하도록 축소. 앱 tsc 통과.
- **앱 피드 미디어 캐러셀 구조 분리 리팩토링** — 동작 변경 없이 `FeedMediaCarousel`에서 사진 캐러셀/인덱스 배지/더블탭 이미지 렌더를 `FeedImageCarousel`로 분리하고, 기존 파일은 영상(`FeedVideoPlayer`)과 사진 캐러셀 분기만 담당하도록 축소. 앱 tsc 통과.
- **앱 피드 카드 구조 분리 리팩토링** — 동작 변경 없이 `FeedPostCard`의 작성자 헤더(`FeedPostHeader`), 액션 버튼 row(`FeedPostActions`), 본문(`FeedPostContent`), 더보기/저장/공유/차단/신고/삭제 메뉴(`FeedPostMoreMenu`)를 하위 컴포넌트로 분리. 앱 tsc 통과.
- **앱 릴스 아이템 구조 분리 리팩토링** — 동작 변경 없이 `ReelItem`의 영상 플레이어 생명주기를 `useReelVideoPlayer` 훅으로 분리하고, 우측 액션 버튼(`ReelActions`)·하단 작성자/본문 오버레이(`ReelFooter`)·더보기/신고/차단/삭제 메뉴(`ReelMoreMenu`)를 하위 컴포넌트로 분리. 앱 tsc 통과.
- **계정 탈퇴 영구삭제 + 재로그인 차단 (출시 필수, 코덱스 앱 리팩토링과 병렬)** — `delete_account` RPC(soft delete)는 있었으나 30일 후 실제 삭제/재로그인 차단이 없어 스토어 심사(진짜 삭제 요구) 미충족이던 것 보완. `purge_deleted_accounts(retention_days, dry_run)` SECURITY DEFINER 함수 + `pg_cron`(매일 04:10 UTC)로 30일 지난 탈퇴 계정을 **comments 명시삭제**(users FK가 SET NULL이라 잔존) + **`auth.users` 삭제**(→ `public.users` FK CASCADE로 posts/stories/messages/likes/follows 등 연쇄) 영구 제거. 테스트 계정으로 **E2E 검증**(auth+public 완전 삭제 확인). 재로그인 차단은 웹 미들웨어 + 앱 세션에서 `deleted_at` 체크 → 로그아웃. 마이그레이션 `20260706130000`, 원격 적용·검증. **남은 것: ① Storage 파일 정리(`storage.objects` 직접 DELETE는 protect_delete 트리거가 막고 owner FK도 없어 연쇄 안 됨 → Storage API 필요. 엣지함수 `purge-deleted-accounts` 배포돼 있으나 cron 자동연결엔 vault 인증 필요 — 후속) ② 재로그인 차단 배포/실기기 E2E 확인.**
- **앱 게시물 공유 시트 구조 분리 리팩토링** — 동작 변경 없이 `PostShareSheet`의 2단 detent 드래그/닫기 애니메이션을 `usePostShareSheetDrag` 훅으로 분리하고, 공유 대상 리스트(`ShareTargetList`)와 외부 공유 영역(`ExternalShareSection`)을 하위 UI 컴포넌트로 분리. 앱 tsc 통과.
- **댓글 신고 관리자 연동** — 사용자 댓글 신고(2026-07-03)를 관리자 페이지에서 처리 가능하게. `get_admin_reports` RPC에 `comment` 분기 추가(신고 시 저장된 `target_snapshot->>'content'`를 `target_content`로 반환), `handle_admin_report`에 댓글 삭제 분기(댓글은 `deleted_at` 없어 **하드 DELETE** — 대댓글/좋아요 ON DELETE CASCADE 확인 — + `recount_post_comments`로 게시물 댓글수 재계산). 마이그레이션 `20260706120000_admin_reports_comment_support` 원격 적용. 클라: `AdminReport.targetType`에 `comment` 추가+파싱, 신고 목록에 "댓글" 뱃지(violet), 댓글은 복구 불가라 action_taken 시 복구 버튼 숨김. 웹 tsc 통과. **E2E: 현재 댓글 신고 데이터 0건 → 앱에서 댓글 롱프레스 신고 하나 만들어 확인 필요.**
- **릴스/피드/댓글 공유·UI 폴리시(다수 커밋)** — 릴스 상세 공유 버튼(종이비행기, `PostShareSheet` 재사용) 추가·피드/릴스 공유 아이콘 종이비행기 통일, 릴스 우측 아이콘 크기/굵기/간격 정리(숫자 없는 버튼은 라벨 슬롯 제거해 밀착·`zIndex`로 아이콘을 패널 위로), 댓글 신고/삭제를 버튼→**롱프레스 액션시트**로(인스타식·진동 피드백·프로필 탭 영역 아바타+닉네임으로 제한), 게시물 공유 후 메시지 화면 전환 대신 **토스트**, 릴스 하단 그라데이션을 본문 길이 따라 자라는 단일 연속 그라데이션으로. 전부 tsc 통과·커밋.

## 2026-07-05

### 완료
- **게시물 외부 공유 Phase 2: 공개 미리보기 페이지 + 앱 OS 공유** — 웹 공개 라우트 `/p/[postId]` 추가. 미들웨어에서 `/p/`를 비로그인 예외 처리하고, 서버 전용 service-role 클라이언트로 public+미삭제 게시물만 최소 필드 조회해 카드형 보기 전용 페이지와 OG 메타태그를 생성. 앱은 피드/상세 조회 타입에 `visibility`를 포함하고, 공유 바텀시트에서 `visibility='public'` 게시물에만 `https://univer-six.vercel.app/p/{postId}` 외부 공유 버튼을 표시. `close_friends`는 기존 인앱 DM 공유만 유지. 웹 build + 앱 tsc 통과. **배포 환경에 `SUPABASE_SERVICE_ROLE_KEY`/`NEXT_PUBLIC_SITE_URL`, 앱 env에 `EXPO_PUBLIC_SITE_URL` 필요.**
- **앱 게시물 공유 바텀시트 2단 detent 개선** — gorhom BottomSheetModal은 `present()` 호출 후 `onChange`가 불리지 않는 증상이 있어, 기존 동작하던 JS Modal/PanResponder 시트를 확장. `PostShareSheet`가 인스타식으로 **55% 반열림 → 위로 드래그 시 92% 확장 → 아래로 드래그 시 닫힘** 구조를 갖도록 변경. New Arch(`newArchEnabled=true`)·루트 `GestureHandlerRootView`/`BottomSheetModalProvider`·`react-native-worklets/plugin` 설정은 확인했고, 우선 동작 우선 fallback으로 마무리. 앱 tsc 통과.

## 2026-07-03

### 완료
- **앱 게시물 공유 Phase 1: 인앱 DM 공유** — `messages.shared_post_id` 추가 + `message_type='post'` 허용 마이그레이션을 원격 DB에 적용. 앱 채팅 API에 `sendPostMessage`/공유 게시물 미리보기 hydration 추가(접근 불가/삭제/차단 시 `볼 수 없는 게시물` 폴백). 홈 피드 `FeedPostCard`에 공유 아이콘/액션시트 항목 추가, `PostShareSheet`+`usePostShare`로 기존 대화/크루/유저검색 대상 선택 후 DM 전송→채팅방 이동. `MessageBubble`은 post 메시지를 썸네일+작성자+본문 카드로 렌더하고 탭 시 게시물 상세 이동. 원격 DB 확인 쿼리 + 앱 tsc 통과.
- **홈/피드 디자인 인스타식 조정 (요소 축소·두께↓)** — 앱 요소가 인스타보다 크고 두껍던 것 사용자 피드백 반복 반영. `FeedPostCard`(아바타 42→34, 닉네임 16→14, 좋아요/댓글/저장 아이콘·두께↓, 숫자글씨 16·900→13·700, 패딩·카드간격↓, 본문 없는 글 하단여백 확보), `BottomTabBar`(아이콘 31→25·+버튼 58→46·바 높이 78→54·반투명→불투명), `UserInline` 회색 메타 굵기 700→500·크기 14→12, `StoryBar` 카드 128×176→100×140 등 축소, `HomeHeader` 알림/메시지 아이콘 얇게(2.6→2)·작게+원형버튼 52→44+스토리 위 여백 32→16px. tsc 통과, 실기기 확인. (남음: 본문 유무별 아이콘-본문 간격 조건부)
- **댓글 신고 (사용자 영역)** — 게시물/스토리엔 있던 UGC 신고가 댓글만 빠져있던 것(심사 블로커) 해결. `CommentRow`에 신고 버튼(남의 댓글, 본인건 삭제와 대칭 위치), `useComments.handleReport`(→`createReport(target_type='comment')`)+확인 다이얼로그(`ConfirmDialog` 재사용)+"신고 접수" 피드백. `ReportTargetType`에 comment 추가, `database.types` 보강(DB CHECK엔 이미 comment 허용). DB: `fill_report_snapshot` 트리거에 comment 분기 추가(신고 시 댓글 내용/작성자 스냅샷 저장 — 마이그레이션 `20260703120000`). tsc 통과. **관리자 화면 렌더링/댓글 삭제 처리 + 차단 유저 댓글 숨김은 다음**(신고 데이터는 이미 제대로 쌓임).
- **Round 3 #6: 죽은 의존성/코드 제거** — grep으로 미사용 확정 후 삭제: `react-native-compressor`(폐기 확정, 코드 import 0건 — 설정/주석에만) → `package.json`+`app.json` 플러그인에서 제거+`npm install`, `videoCompress.ts`(`return uri` no-op, 호출 0건)·`storageUpload.ts`(`uploadFileUriToBucket` 미사용) 파일 삭제. 영상 압축은 Cloudflare 서버 트랜스코딩이 대신하므로 클라 압축 불필요. tsc 통과. **네이티브 반영은 다음 EAS 빌드**(현재 dev 빌드는 import 안 하니 무해). (후속: `react-native-nitro-modules`도 src import 0건 — compressor 전용이었을 가능성, 별도 검토)
- **Round 2 #1: createPost 빈 게시물 롤백 (방법 B)** — posts insert 후 post_media insert가 별도라 미디어 실패 시 미디어 없는 빈 게시물이 남던 문제(사진/영상 둘 다). 각 분기의 media 실패 지점에서 **방금 만든 post를 delete(롤백)** 후 throw. tsc 통과. 완전 트랜잭션(방법 A=`create_post_with_media` RPC)은 백로그. + 새 영상 실기기 업로드 확인: `provider=cloudflare_stream`/`ready`로 저장(Supabase 아님), stream-status 자동 재생 정상.
- **Round 2 #2: 영상 ready 복구 (stream-status Edge Function)** — 코덱스 지적: `ready` 갱신 경로가 webhook 하나뿐이라 webhook 놓치면 DB가 영원히 `processing` → 영상 영영 재생 불가. 새 엣지 함수 `stream-status` 작성/배포(verify_jwt, 로그인 유저만): asset id 목록을 받아 **Cloudflare `GET /stream/{uid}`로 실제 상태 직접 조회** → `post_media`/`stories` DB 갱신 → 상태 반환. `getVideoStatuses`(feed/api.ts)를 DB 읽기에서 이 함수 호출로 교체 → **webhook=주경로, 폴링=자가복구**. tsc 통과, MCP로 배포 완료(시크릿 재사용). 실기기 검증(새 영상 processing→ready) 남음.
- **보안/위생 Round 1** — (1) 보안 advisor 확인: 관리자 RPC(`get_admin_*`/`handle_admin_report`)는 전부 내부에서 `role='admin'` 체크 → 구멍 없음, `get_user_real_name`도 본인/크루만 → 안전. 33개 경고 대부분은 린터 노이즈(RPC 다 플래그). (2) `push_on_message`/`push_on_notification`(트리거 함수)의 anon/authenticated EXECUTE 회수 — 트리거라 직접 호출 불필요, 푸시 정상. (3) 코덱스 #3: `streamUpload.ts` 콘솔 로그를 `__DEV__` 가드 헬퍼(`logDev`/`warnDev`)로 전환(프로덕션 노이즈/정보노출 방지) + progress `Math.min(100, …)` clamp. tsc 통과. (남은 Round1: 님이 대시보드에서 Leaked Password Protection 켜기)
- **Vercel 웹 배포 실패 수정** — 최근 3개 배포 연속 ERROR. 원인 2개(앱만 만졌는데 DB 스키마 변경 여파로 웹이 깨짐): ① `src/features/feed/api.ts`가 영상 컬럼(`provider`/`provider_asset_id`/`processing_status`)을 select 안 해 `PostMediaRow` 타입 불일치 → select에 추가 ② `tsconfig.json`이 `supabase/functions`(Deno 엣지함수)를 웹 빌드 타입체크에 포함 → exclude 추가. 로컬 `npm run build` 성공 확인.
- **🔴 Supabase egress 폭발 사고 대응** — Free 무료 한도 초과 메일/경고(cached egress 38.9GB / 5GB = 780%, MAU 2명인데 비정상). 조사 결과 **Cloudflare Stream 전환 전 옛날 영상(Supabase Storage `post-videos`/`story-videos`)이 반복 다운로드**되던 게 원인 — 영상은 스트리밍 서비스가 아닌 파일저장소에서 `loop=true`로 통째 반복 다운로드(+8MB 버퍼 제한). 대응: 활성 옛날 영상 게시물 3개+스토리 2개 soft delete, `post-videos`/`story-videos` 버킷 private 전환, Storage 옛 `.mp4` 파일 대시보드에서 실삭제. **새 영상은 이미 Cloudflare 직행이라 재발 구조적 불가.** 남은 것: 사용량 알림/모니터링(2주간 미감지=관측도구 0), 이미지 버킷 private+signed URL(출시 전).

## 2026-07-02

### 완료
- **릴스 신고/차단/삭제 메뉴 추가** — 릴스(`ReelItem`)에 `...` 더보기 버튼이 없어 남의 영상을 신고·차단할 방법이 없던 문제(UGC 신고 미제공 → 스토어 심사 리스크). 홈 피드(`FeedPostCard`)와 **동일한 재사용 패턴**으로 붙임
  - UI: `ReelItem` 우측 상단 `...` → `ActionSheet`(공용) → 남의 영상이면 **차단/신고**, 내 영상이면 **삭제**. 확인은 기존 `ConfirmDialog` 재사용. 음소거 오버레이보다 뒤에 그려 탭이 먼저 닿게 함
  - 로직: `useReels`에 `reportPost`(→`createReport` target_type=post) / `blockAuthor`(→`blockUser` RPC, 차단 유저 영상 목록에서 즉시 제거) / `removePost`(→`deletePost` soft delete, 실패 시 롤백) 추가. 차단/삭제로 목록이 줄면 `activeIndex`가 범위를 벗어나지 않게 effect로 보정
  - 결과 피드백: 릴스 화면 하단에 토스트("신고가 접수됐어요"/"차단했어요"/"삭제했어요")
  - `createReport`/`blockUser`/`deletePost`/`ActionSheet`/`ConfirmDialog` 전부 기존 것 재사용(신규 API·마이그레이션 없음). tsc 통과. 실기기 확인 남음
  - 후속(릴스 남은 갭): 처리중→완료 폴링(릴스/스토리 미적용), 빈 화면·startPostId 못 찾을 때 엉뚱한 영상 재생, 전역 음소거, 더블탭 좋아요
- **릴스 우측 액션 버튼 균등 정렬 + 반투명 원 제거** — 좋아요/댓글엔 숫자, 저장/음소거엔 없어서 버튼 높이가 제각각이라 아이콘 간격이 들쭉날쭉하던 문제(인스타는 균등). 모든 버튼을 `아이콘 박스(고정 34) + 라벨 슬롯(고정 15)` 구조로 통일해 아이콘 세로 간격을 일정하게 맞춤(빈 슬롯으로 높이 보정). 아이콘 크기 정리(32/30/29/27), 숫자에 옅은 그림자. 뒤로가기·`...` 버튼의 반투명 원 배경 제거(탭 영역 44×44 유지). 밝은 배경에서 흰 아이콘 가독성 저하 시 그림자/하단 배치로 대응 여지. tsc 통과
- **릴스 탭=일시정지 + 전역 음소거** — (1) 영상 탭 시 음소거 토글이던 걸 **일시정지/재생**으로 변경(멈추면 가운데 ▶ 표시, pointerEvents none로 탭 통과). 스와이프로 비활성되면 일시정지 자동 해제. (2) 음소거를 `ReelItem` 로컬 상태에서 **`ReelsScreen` 소유(전역)** 로 올려 한 번 켜면 다음 영상에서도 유지(예전엔 영상마다 리셋). 우측 스피커 버튼이 전역 상태 토글. 실기기 확인 완료. tsc 통과.
- **더블탭 좋아요 (피드 사진/영상 + 릴스)** — 공용 `components/common/DoubleTapLike.tsx` 신설(gesture-handler·reanimated 없이 RN 내장 `Animated` 하트 팝 + 탭 간격 측정). 단일/더블 구분: 단일 탭은 0.22초 기다렸다 확정(그래서 릴스 일시정지가 인스타처럼 살짝 늦음), 더블탭은 **인스타식 좋아요만**(이미 좋아요면 하트 애니메이션만, 취소 안 됨). 릴스=단일 일시정지/더블 좋아요, 피드 사진=더블 좋아요(여러 장 스와이프 유지), 피드 영상=단일 릴스이동/더블 좋아요. 실기기 확인 완료. tsc 통과
- **홈 피드 좋아요/저장 화면 간 동기화** — 릴스에서 좋아요했는데 홈으로 나오면 안 누른 것처럼 보이던 문제(릴스 `useReels`와 홈 `useHomeFeed`가 각자 상태 소유 → 홈 캐시 stale). `getPostCounts(ids)` 추가 + `useHomeFeed.refreshInteractions()`(로드된 게시물의 좋아요/저장 여부+좋아요/댓글 수 재조회, 스크롤 유지) + `HomeScreen` `useFocusEffect`로 **홈 복귀 시마다 갱신**(첫 진입은 스킵). 릴스/상세/프로필 왕복 모두 반영. tsc 통과. (범위 밖: 릴스에서 차단/삭제한 글은 홈 복귀 시 목록에 잠깐 남음 — 당겨 새로고침 필요, 별도 처리 예정)
- **내 활동 스토리 보관함 영상 재생 안 되던 버그 수정** — `getMyStories`가 `type`/`thumbnail_url`/`processing_status`를 안 가져와 보관함이 영상인지 몰랐고, 그리드·미리보기가 무조건 `image_url`(영상은 영상 URL)을 `<Image>`로 띄워 빈 화면이던 문제. `ActivityStory` 타입/쿼리에 영상 필드 추가 → 그리드는 영상 썸네일(`thumbnail_url`)+▶ 배지, 미리보기 시트는 준비된 영상이면 `StoryVideoView`로 실제 재생(기존 뷰어 컴포넌트 재사용)·처리중/실패면 썸네일+상태. 라이브 뷰어(`StoryPlayer`)는 원래 정상이라 보관함만 문제였음. 실기기 확인 완료. tsc 통과
- **내 활동 차단 유저 게시물 숨김** — 차단해도 내 활동(저장/좋아요/댓글) 목록엔 그 사람 게시물이 그대로 보이던 문제. 공용 `getActivityPostsByIds`에 차단 필터(`getBlockRelatedUserIds`) 추가 → 세 탭 모두 차단 유저 글 숨김. **좋아요/저장/댓글 기록은 삭제하지 않고 화면에서만 숨김**(언블락 시 다시 보임, 피드와 동일 방식). 실기기 확인 완료. tsc 통과. (확인됨: **댓글 목록(`getComments`)은 차단 필터 없음**, **댓글 신고 기능 자체가 없음**(`ReportTargetType`에 comment 없음) → 둘 다 백로그, 댓글 신고는 출시 전 권장)
- **차단/삭제 화면 간 전파 개선 (홈 목록 제거 + 릴스 네비게이션)** — (1) 홈: `refreshInteractions`(포커스 복귀 갱신)에 차단 유저 글·삭제된 글 제거 추가 — `getPostCounts`는 `deleted_at` 제외(반환 안 된 id=삭제)+에러 시 throw(빈 결과로 목록 지워지는 사고 방지), 차단 목록(`getBlockRelatedUserIds`)으로 필터. 릴스/상세에서 차단·삭제하고 홈 복귀 시 그 글 즉시 사라짐(당겨 새로고침 불필요). (2) 릴스: 차단/삭제로 영상이 목록에서 빠지면 남은 영상이 있으면 그 자리(다음 영상)로 `scrollToIndex`, 마지막이면 릴스 닫기(`router.back()`) — 예전엔 목록 비면 까만 화면에 고정되던 버그(초기 로딩/에러 빈 상태는 `hadPostsRef`로 구분). 실기기 확인 완료. tsc 통과. (백로그: 차단으로 로드된 목록이 비어도 다음 페이지 자동 로드해 릴스 유지 = "방법 2", 30초 차단 캐시 무효화 필요 — 콘텐츠 쌓인 뒤)
- **릴스 "엉뚱한 영상" 버그 수정 (시각 앵커 로딩)** — 릴스가 최신 20개만 불러온 뒤 누른 영상을 그 안에서 `findIndex`로 찾던 구조라, 오래된 영상(첫 페이지 밖)을 누르면 못 찾고 `Math.max(0,-1)=0`으로 **맨 위 최신 영상이 재생**되던 문제. 근본 해결: `getVideoFeed`에 `anchorCreatedAt` 옵션 추가(그 시각 `lte`부터 로딩) + `useReels`가 누른 영상(`getPost`)의 작성 시각을 먼저 조회해 앵커로 사용 → 누른 영상이 항상 목록 맨 위에서 시작, 아래로 더 오래된 영상 이어짐(인스타 방식). 삭제/차단된 영상이면 앵커 없이 최신 피드로 폴백, `Math.max(0,-1)` 땜빵 제거. (빈 화면 안내는 정상 흐름에선 릴스에 0개로 못 들어와서 미추가) 실기기 확인 완료. tsc 통과. (나중에 시간순→랜덤/추천으로 갈면 앵커 대신 추천 순서 로딩으로 교체)

## 2026-07-01

### 완료
- **[보안] 노출된 google-services.json Firebase Android API 키 잠금** — `git push`로 `apps/mobile/google-services.json`(6/26 커밋, 그동안 미push)이 GitHub에 처음 공개되며 secret 스캐닝 경고 발생
  - 성격: Firebase Android(FCM) 클라이언트 키 — APK에 박혀 배포되는 반(半)공개 키라 실제 위험은 낮음(서버 키·보안 규칙이 별도 방어). 이 파일엔 oauth_client 없음(구글 로그인과 무관)
  - 조치: Google Cloud(`univer-783b0`) 콘솔에서 해당 Android 키에 **애플리케이션 제한(Android 앱: `com.univer.app` + keystore SHA-1)** 적용 → 키가 노출돼도 우리 앱 밖에선 사용 불가. API 제한은 FCM 유지 위해 그대로 둠
  - 교훈/후속: push 전 추적 파일에 시크릿 없는지 확인 필요. GitHub 경고는 히스토리에 파일이 남아있어 유지됨(완전 제거하려면 history 스크럽+force push, 위험 낮아 보류). `.gitignore` 추가 여부는 미정
- **본문 더보기 (ExpandableText 공용 컴포넌트)** — 긴 본문이 잘리는데 펼치기가 없던 문제. 숨김 측정 텍스트로 실제 줄 수를 재서(안드/iOS 안정) 접힘 + "더보기"로 펼침. `components/common/ExpandableText.tsx` 신설
  - **피드**(FeedPostCard, 3줄): 실기기 확인 + 커밋 완료
  - **더보기 탭 토글**: `ExpandableText`에 탭으로 펼침/접힘 추가(인스타식, 접기 버튼 없이 본문 탭). 피드/릴스 공통
  - 게시물 상세도 같은 FeedPostCard라 더보기 적용됨 — 상세 전체표시 여부 결정 남음
- **릴스 하단 레이아웃 통일 + 가독성 + 스크롤** — 인스타 대조 후 정리
  - 프로필/캡션 위치를 세이프에어리어 기준 고정 + 본문 자리(`captionSlot` minHeight)를 항상 확보 → 본문 유무·길이 상관없이 프로필 위치 통일(캡션 1줄로 접음)
  - 하단 어두운 그라데이션 + 텍스트 그림자 → 밝은 영상 위에서도 프로필/본문 가독
  - 스크롤 `pagingEnabled`→`disableIntervalMomentum`(+기존 `snapToInterval`/`decelerationRate:fast`) → 한 번 스와이프에 한 칸만
  - ⚠️ 특정 릴스 1개만 페이지 전체가 아래로 밀리는 현상 잔존(버튼·프로필 같이 밀림, 위 검은 여백 증가). 코드·데이터 동일한데 그 항목만 발생, 원인 미상 → dev/출시 빌드 재현 시 재조사(스냅 높이 측정 방식은 시도했다 롤백)
- **영상 업로드 길이/용량 제한** — 게시 영상 60초/250MB 초과 시 `pickVideo`에서 업로드 전 차단(안내는 영상 선택 카드 바로 밑에 표시해 스크롤 없이 보이게). 서버 `stream-upload-url` `maxDurationSeconds` 600→65로 이중 안전망(재배포 완료). 스토리 영상 제한은 후속
- **영상 업로드 상태 UX (자동 갱신 + 완료 토스트 + 라벨)** — "언제 되는지 몰라 답답" 문제 해결
  - 홈 피드에 인코딩 중(processing)인 Cloudflare 영상이 있으면 `getVideoStatuses`(post_media 상태 조회)로 4초 폴링(최대 ~3분) → ready 되는 순간 자동으로 재생 상태로 갱신(수동 리로드 불필요) + "게시물 업로드가 완료됐어요" 토스트
  - 폴링은 processing asset id 집합이 바뀔 때만 재구독(좋아요 등 다른 상태 변경엔 안 돌게)
  - 사진/글 게시는 즉시 완료 → WriteScreen에서 홈으로 `posted=1` 넘겨 도착 즉시 같은 토스트(영상은 폴링이 담당). 사진↔영상 문구 통일
  - 라벨 "영상 처리 중/실패" → "영상 업로드 중/실패"(피드·릴스·스토리), 게시 버튼 영상 제출 중 "업로드 중"
  - tsc 통과. 실기기 확인(사진 즉시 토스트, 영상 자동 갱신+토스트)
- **Cloudflare Stream webhook 등록 + 파이프라인 자동화 검증 완료** ✅
  - 증상: 영상 업로드는 성공(앱 로그 200)하는데 게시물이 계속 `영상 처리 중`. 재생 안 됨
  - 진단: edge-function 로그에 `stream-upload-url` 호출만 있고 `stream-webhook` 호출 0건 → **Cloudflare에 webhook 구독 미등록**이라 인코딩 완료를 DB에 못 알림 → 영원히 `processing`. 코드(edge function/마이그레이션/앱)는 정상
  - 조치: Cloudflare API `PUT /accounts/{acct}/stream/webhook`로 `notificationUrl`=`stream-webhook` 등록(`success:true`). 멈춰있던 기존 테스트 asset은 SQL로 `processing→ready` 복구
  - 검증(실기기): 새 영상 업로드 → 인코딩 ~46초 → **webhook 자동 호출(로그 200) → DB `processing→ready` 자동 전환** → 앱 리로드 시 HLS 재생 확인. 인코딩 결과 5단계 적응형(240p~1080p, 60fps 유지)
  - 노출 토큰 정리 완료: curl 등록 때 대화에 노출된 Stream 토큰을 새로 발급→Supabase secret `CLOUDFLARE_STREAM_TOKEN` 교체→옛 토큰 폐기. 교체 후 새 영상 업로드 정상 확인
  - 남은 후속(백로그): ① webhook 서명(`Webhook-Signature`) 미검증 → 위조 POST 가능(위험 낮음, 나중에 검증 추가) ② webhook 놓칠 때 대비 polling 안전망(`stream-status` 서버 함수) ③ 앱에서 `processing→ready` 자동 갱신(현재 수동 리로드 필요, 다음 작업 예정)
- **Cloudflare Stream direct upload 모바일 전송 방식 교체**
  - 25MB 테스트 영상도 게시 화면에서 10분 이상 멈추는 문제 확인. 파일 크기/압축 문제가 아니라 Cloudflare direct upload POST가 완료되지 않는 문제로 판단
  - `expo-file-system` `uploadAsync(MULTIPART)` 단일 await 경로를 `XMLHttpRequest + FormData(file)` 업로드로 교체. 로컬 파일 크기/업로드 URL 요청/진행률/완료 status 로그와 5분 타임아웃 추가
  - DB/Edge Function/네이티브/스키마 변경 없음. tsc 통과. 다음 실기기 테스트에서 Cloudflare Videos 목록 생성 여부와 앱 로그 확인 필요
- **Cloudflare Stream 영상 업로드/트랜스코딩 1차 전환**
  - Supabase Edge Function `stream-upload-url`/`stream-webhook` 추가 및 배포. 앱은 로그인 세션으로 `stream-upload-url`을 호출해 Cloudflare direct upload URL을 받고, 영상 파일을 Cloudflare Stream으로 직접 업로드
  - DB에 `post_media`/`stories` 공용 Cloudflare 메타 컬럼(`provider`, `provider_asset_id`, `processing_status`) 추가. 기존 Supabase Storage 영상/이미지는 `provider=null`, `processing_status=ready`로 하위호환
  - 게시물/스토리 영상 업로드 진입점을 Supabase Storage 원본 업로드에서 Cloudflare Stream 업로드로 교체. `url`/`image_url`에는 HLS URL, `provider_asset_id`에는 Cloudflare uid 저장
  - 피드/상세/릴스/스토리뷰어/스토리바가 `processing` 상태를 썸네일+처리 중 UI로 표시하고, `ready`일 때만 HLS를 재생하도록 조정
  - 원격 DB SQL 직접 적용(`db query --linked --file`, 로컬 migration history 불일치로 `db push` 불가), Edge Function 배포 완료. 앱 tsc 통과
- **클라이언트 영상 압축 폐기 결정** — `react-native-compressor`가 이 스택에서 사용 불가로 확정
  - 증상: `Video.compress` 호출 시 매번 `Invalid to call at Released state; only valid in executing state` (네이티브 MediaCodec 단계, `VideoCompressorClass.kt:92`)
  - 가설 검증: "작성 화면 미리보기(expo-video)가 코덱을 점유해 충돌" → 제출 직전 미리보기를 언마운트 후 압축 실행하도록 시도 → **여전히 동일 에러**. 코덱 점유 문제 아님
  - 결론: `react-native-compressor@2.x` + RN 0.81 + New Architecture + 삼성 MediaCodec 조합 자체의 문제. 클라 압축은 막다른 길로 확정
  - 조치: 검증용 미리보기 언마운트 로직 원복(`rendering.ts` 삭제), `compressVideoForUpload`를 원본 통과(no-op)로 정리해 매 업로드마다 뜨던 실패 로그/스택 제거. **영상 기능 자체는 정상 동작**(업로드·재생·OOM 방어 유지), 파일만 무압축(무거움)
  - 후속(백로그): 실제 압축은 출시 준비 때 **서버 트랜스코딩(Cloudflare Stream)**으로. `compressVideoForUpload`를 단일 진입점으로 남겨둠
  - tsc 통과. 네이티브/DB/이미지 업로드 경로 변경 없음

## 2026-06-30

### 완료
- **앱 영상 업로드 전 압축 추가**
  - `react-native-compressor` 설치 및 app.json config plugin 추가. 공용 `compressVideoForUpload` 헬퍼를 만들어 `Video.compress(uri, { compressionMethod:"auto" })`로 업로드 전 압축
  - 스토리/피드 영상 업로드 진입점(`uploadStoryVideo`, `uploadPostVideo`)에서 압축된 file URI를 `uploadFileUriToBucket` native streaming 업로드로 넘기도록 연결. 압축 실패 시 원본 URI로 폴백해 업로드는 계속 진행
  - 이미지 업로드/UI/DB/스키마 변경 없음. tsc 통과. **네이티브 모듈 추가라 다음 EAS 리빌드 후 실제 동작**
- **릴스 영상 튕김(OOM) 완화 + 메모리 최적화** — 릴스 2~3개 보면 앱 크래시. 로그가 `OutOfMemoryError`(영상 받다가 RAM 초과). 원인=무압축 원본 영상이 통째로 메모리에 올라감
  - 레퍼런스 서칭(Mux/TheWidlarzGroup TikTok 피드): 창 밖 영상 source=null로 메모리 해제 + FlashList/가상화 + preload 창 제한
  - 적용(빌드X): ① ReelItem 플레이어 초기 source=null, 활성 ±1만 `replaceAsync`로 소스 물림(`isNearActive`), 멀면 null로 해제 ② FlatList `windowSize=3`/`removeClippedSubviews`/`snapToInterval` ③ **`bufferOptions.maxBufferBytes=8MB`**(안드, 영상을 통째로 버퍼 안 하게) — 이게 OOM 직접 완화
  - 디버깅에서 잡은 버그: `replace`(동기·메인스레드 블락→`replaceAsync`), effect 의존성이 매 렌더 새 `video` 객체라 폭주→`videoUrl`(문자열)+`useMemo`
  - 결과: **크래시 안 남**. 단 무압축이라 버퍼링/로딩은 남음 → 근본해결=압축(빌드). tsc 통과
- **상태바 검정** — 릴스/스토리작성 풀스크린 상단바를 검정(`StatusBar style=light` + backgroundColor)
- **탐색 그리드 영상 탭 → 릴스 진입** (`is_video` 분기 + ▶ 아이콘)

## 2026-06-29

### 완료
- **릴스 (영상 전용 세로 풀스크린)** — `getVideoFeed`(post_media inner join 영상만) + `useReels`(로드/좋아요/저장/활성인덱스). `ReelItem`(세로 풀스크린 + 우측 좋아요/댓글/저장/음소거 + 작성자/캡션) + `ReelsScreen`(세로 페이징, 보이는 1개만 재생) + `/reels` 라우트 + 댓글시트. 피드 영상 영역 탭 → 릴스 진입. 영상 늘면 위아래로 이어지는 구조 미리 반영
  - **버그 수정**: 네이티브 VideoView가 터치를 먹어 탭 무시 → 영상 위 투명 오버레이 Pressable로 영역 탭(릴스 이동)/음소거 분리. 빌드 불필요, tsc 통과, 실기기 확인
  - 발견(백로그): 릴스 풀스크린 상단바 검정 처리
- **피드 영상 자동재생 + 상세/그리드 영상** — FeedVideoPlayer 활성 카드만 음소거 자동재생(HomeScreen viewability), 상세 영상 재생(isActive 누락 수정), 프로필/탐색 그리드 영상 썸네일(thumbnail_url)
- **피드 영상 3단계 — 피드 렌더** — `components/feed/FeedVideoPlayer` 신규(expo-video: 썸네일 포스터 + 탭 재생/일시정지 + 음소거 토글). `FeedMediaCarousel`이 영상이면 이걸로 렌더(기존 `type==="image"`만 그리던 것 보완), 사진은 캐러셀 그대로. 빌드 불필요(expo-video 기존). tsc 통과, 실기기 확인. → 4단계(자동재생 보이는 1개만)에서 ▶버튼 제거 + 기본 음소거로 교체 예정
- **앱 게시물 작성 영상 1개 선택 추가**
  - 게시물 작성 폼에 사진 여러 장 OR 영상 1개 배타 선택 상태를 추가. 영상 선택 시 사진 목록을 비우고, 사진 선택 시 영상 상태를 해제
  - 영상 제출은 첫 프레임 썸네일 추출→이미지 업로드(실패 시 null)→영상 업로드→`createPost(video)` 분기로 연결. 작성 화면은 `StoryVideoView` 미리보기와 영상 제거 버튼을 표시. 피드 렌더/DB/네이티브 변경 없음, tsc 통과
- **앱 스토리 작성 미리보기 뷰어 위치 통일**
  - 작성 미리보기 미디어 배치를 StoryPlayer와 동일하게 `useStableInsets` + `marginTop: insets.top + 6` 기준으로 상단 정렬. 검정 루트 배경과 light 상태바를 적용하고, 기존 배경색/공개범위/공유 로직은 변경 없음. tsc 통과
- **앱 스토리 영상 1단계 API plumbing**
  - `story-videos` Storage 버킷 상수 추가. `stories/api.ts`에 영상 파일 raw 업로드(`uploadStoryVideo`)와 영상 스토리 insert(`createVideoStory`) 추가
  - 영상은 `image_url=videoUrl`, `type='video'`, `thumbnail_url`/`duration` nullable로 저장. 기존 사진 업로드/생성 경로와 UI/스키마는 변경 없음. tsc 통과
- **앱 스토리 영상 2단계 — 빌드 묶음 코드(갤러리 영상 선택+재생), EAS 빌드 대기**
  - `expo-video`(재생)/`expo-video-thumbnails`(썸네일) 설치 + app.json `expo-video` 플러그인
  - `Story` 타입에 `mediaType`/`duration_seconds` 추가, `getStories`가 `type,duration` 셀렉트·매핑(image_url=미디어 URL)
  - `components/stories/StoryVideoView` 신규 — 공용 9:16 영상 재생기(`timeUpdate`로 진행/`playToEnd`로 종료/일시정지/loop)
  - 작성: StoryCamera 갤러리 `["images","videos"]` 허용 + onSelected가 `{uri,kind,durationSeconds}` 전달, `useStoryCreate`가 `captured` 객체로 보관 + submit 영상 분기(썸네일 추출→이미지 업로드 + `uploadStoryVideo` + `createVideoStory`), StoryCreateScreen 미리보기 영상 분기(loop)
  - 뷰어: `useStoryPlayer`가 영상이면 5초 타이머 skip하고 영상이 `setVideoProgress`/`goNext`를 구동, StoryPlayer 영상 분기(`key=story.id`로 스토리별 새 플레이어)
  - tsc 통과. **EAS 빌드 후 실기기 테스트 필요** (재생 타이밍/업로드 확인)
  - follow-up: 내 활동 보관함 그리드/미리보기 영상 썸네일(`getMyStories`에 type/thumbnail_url), 카메라 녹화, notifee(별도 빌드)
- **앱 영상 업로드 OOM 수정**
  - 43MB 영상에서 `File.arrayBuffer()`가 Android OOM으로 실패하는 문제 확인. 영상 업로드를 Supabase JS ArrayBuffer 방식에서 `expo-file-system/legacy.uploadAsync` native binary upload 공용 유틸로 교체
  - 스토리 영상은 새 `uploadFileUriToBucket` 경로 사용. 디버그 로그 제거, tsc 통과
- **앱 스토리 배경색 선택**
  - 작성 화면에 단색 배경 팔레트 추가. 선택 색을 `stories.background_color`에 저장하고 뷰어에서 반영
  - 사진/영상 프레임을 블러·cover 대신 단색 배경 + `contain` 레터박스로 통일. 영상 진행바/재생 흐름은 유지, tsc 통과
- **앱 스토리 작성 미리보기 풀스크린 UI**
  - 미리보기 모드를 카드형 헤더/패널에서 인스타식 풀스크린 오버레이로 변경. 뒤로 버튼은 카메라 복귀, 우측 팔레트 버튼은 배경색 시트 호출, 하단에 공개범위+공유 버튼 배치
  - 배경색 팔레트를 무채색 5개로 정리. 업로드/submit/사진·영상 분기 로직 변경 없음, tsc 통과
- **앱 스토리 작성 폴리시 (빌드 불필요, 영상 전 정리)**
  - **셔터 무음** — `takePictureAsync({ shutterSound:false })` + CameraView `animateShutter={false}`(흰 플래시 제거). 인스타처럼 소리/번쩍임 없이 촬영
  - **미리보기 = 실제 스토리** — 공용 `components/stories/StoryMediaFrame`(9:16 + 블러 배경 + 레터박스: 세로 cover/그 외 contain) 만들어 작성 미리보기에 적용. 미리보기와 뷰어 모양 일치(인스타식 깔끔). 뷰어(StoryPlayer)도 같은 프레임으로 통일은 다음에
  - **미리보기 뒤로가기 = 카메라 복귀** — 미리보기 상태에서 하드웨어 뒤로가기 시 홈으로 안 나가고 카메라로(`BackHandler`로 가로채 `retake`). 카메라 모드 뒤로가기는 그대로 홈. (안드 기준, iOS 스와이프-백은 별도)
  - 실기기 확인, tsc 통과
- **앱 채팅 알림 다듬기**
  - **보고 있는 방은 배너 억제** — 활성 대화방 id를 모듈(`features/chat/activeConversation.ts`)에 저장(채팅방 포커스 시 설정/블러 해제), 포그라운드 알림 핸들러가 `targetType=chat`이고 지금 보는 방이면 배너/목록 안 띄움. JS만. (`38d7a5e`)
  - **메시지마다 개별 푸시** — 서버 트리거 `push_on_message`에서 "첫 안읽음만" 생략 + `collapseId`(대화방 단위 교체) 제거 → 메시지마다 알림(마이그레이션 `20260629120000`). 아이폰은 앱 단위 자동 묶임, 안드는 따로 쌓임
  - **결정**: 진짜 그룹 알림(한 대화=펼치면 여러 메시지)은 notifee 필요인데, 데이터푸시로 가면 iOS가 안 뜸 → 플랫폼별(안드 데이터푸시/iOS 일반푸시) 분기까지 해야 함. "빠른 빌드" 아님 → **영상 EAS 빌드에 notifee 같이 넣기로 park**. 그 전까지 메시지마다(A) 유지
- **앱 차단 시 스토리 숨김 (버그 수정)** — `stories/api.ts` `getStories`에 차단 필터가 없어 차단해도 그 사람 스토리가 스토리바에 떴음. 피드/탐색과 동일하게 `getBlockRelatedUserIds` + `.not(user_id in ...)`로 차단 관계(양방향) 유저 제외. 실기기 확인(차단 시 사라짐/해제 시 복귀), tsc 통과

---

## 2026-06-28

### 완료
- **앱 데이터 계층 주석 추가** — `features/*/api.ts` 전 파일 헤더 + 함수별 역할 한 줄 주석(feed/comments/stories/profile/explore/blocks/reports/search/chat/activity/notifications/auth/shared 등). 변수별 주석은 생략(이름이 설명). 파일·함수 상세는 노션 코드구조/API명세 유지. `docs:` 커밋 4개로 분할. (주석 깊이=헤더+함수마다 한 줄로 사용자와 합의)
- **앱 HomeScreen 잔여 로직 훅 분리 (전수조사 8개 완료)**
  - 피드는 이미 `useHomeFeed`였고, 화면에 남아있던 스토리바·안읽은 알림/메시지 뱃지 로딩(`getStories`/`getUnreadCount`/`getChatUnreadCount`) + 포커스 갱신을 `features/feed/useHomeMeta.ts`로 분리. HomeScreen은 이제 api 직접 호출 없음(두 훅 연결+네비게이션+렌더만). `HomeScreen.tsx` 309줄 → 278줄(+훅 47). 동작 변경 없음, 실기기 확인, tsc 통과
  - 이로써 전수조사로 찾은 8개(StoryPlayer/PostDetail/Connections/Explore/Search/Messages/Blocked/Notifications/HomeScreen 잔여) 모두 로직 분리 완료
- **앱 NotificationsScreen 로직 훅 분리**
  - 알림 목록 로드/모두읽음/개별 읽음 처리 로직을 `features/notifications/useNotifications.ts`로 분리. 알림 탭 시 라우팅(`routeToNotificationTarget`)은 화면. `NotificationsScreen.tsx` 179줄 → 140줄(+훅 68). 동작 변경 없음, 실기기 확인, tsc 통과
- **앱 BlockedAccountsScreen 로직 훅 분리**
  - 차단 목록 로드 + 차단 해제(낙관적/롤백) 로직을 `features/blocks/useBlockedAccounts.ts`로 분리. 해제 확인 다이얼로그 대상(UI)·렌더는 화면. `BlockedAccountsScreen.tsx` 234줄 → 200줄(+훅 64). 동작 변경 없음, tsc 통과
  - (발견) 차단해도 스토리는 안 가려짐 — `stories/api.ts`에 차단 필터 없음 → 백로그
- **앱 푸시 토큰 "한 기기 = 한 계정" 수정 (자기 메시지 알림 버그)**
  - 증상: 같은 폰으로 두 계정 번갈아 로그인 후, 내가 보낸 메시지 알림이 이 폰에 뜸. 원인은 푸시 트리거(정상, 수신자에게만 발송)가 아니라 **`fcm_token`이 로그아웃/계정전환 시 안 떼져서** 두 계정 모두 이 폰을 수신처로 갖고 있던 것
  - `claim_push_token(p_token)` RPC 추가(SECURITY DEFINER) — 등록 시 그 토큰을 다른 계정에서 NULL로 떼고 현재 유저에 등록. `registerForPushNotifications`가 직접 UPDATE 대신 이 RPC 호출
  - `signOutMobile()` 추가 — 로그아웃 시 본인 `fcm_token` NULL 후 signOut. 로그아웃 2곳(Settings/Home)을 이걸로 통일(탈퇴는 RPC가 이미 NULL 처리해 그대로)
  - DB 마이그레이션 적용 + `database.types.ts`/`docs/DATABASE.md` 반영. 적용하려면 **앱 완전 재시작**(등록 재실행) 필요. 멀티기기 동시 수신은 별도 토큰 테이블 필요 → 백로그. tsc 통과
- **앱 컴포넌트/화면 로직 전수조사** — `screens/`만 봤던 누락 보완. `components/`인데 api 직접 호출(UI규칙 위반) + 훅 미경유 화면을 import 단위로 전수 확인. 발견: StoryPlayer(컴포넌트), PostDetail/Connections/Explore/Search/Messages/Blocked/Notifications(화면), HomeScreen 일부 잔여. 순차 분리 진행
- **앱 StoryPlayer 로직 훅 분리** (UI규칙 위반 해소)
  - `components/stories/StoryPlayer.tsx`에 박혀있던 재생 타이머/이전·다음 이동/조회기록·좋아요/삭제·신고/일시정지 조율 로직을 `features/stories/useStoryPlayer.ts`로 분리. 컴포넌트는 이제 api import 없이 렌더+다이얼로그 연결만
  - `StoryPlayer.tsx` 495줄 → 291줄(+훅 291). 동작/재생/타이머 변경 없음, 실기기 확인, tsc 통과
- **앱 PostDetailScreen 로직 훅 분리**
  - 게시물 상세의 로드/좋아요/저장(토스트)/차단/신고/삭제/댓글수 갱신/피드백 로직을 `features/feed/usePostDetail.ts`로 분리. 차단·삭제는 성공여부 반환→화면이 `router.back`
  - 화면은 currentUserId·댓글시트 UI상태·네비게이션·렌더만. `PostDetailScreen.tsx` 295줄 → 164줄(+훅 195). 동작 변경 없음, 실기기 확인, tsc 통과
- **앱 MessagesScreen 로직 훅 분리 + 채팅방 헤더 프로필 링크 추가**
  - 대화 목록 화면의 현재 유저/포커스 리로드/"대화 시작" 유저 검색(디바운스)/대화방 생성 로직을 `features/chat/useMessagesList.ts`로 분리(`useConversations` wrap). 대화방 생성은 conversationId 반환→화면이 이동. `MessagesScreen.tsx` 268줄 → 235줄(+훅 74)
  - **채팅방 헤더 기능 추가**: 기존엔 닉네임 텍스트만(`ScreenHeader`) 있어 프사·프로필 진입이 없었음. 전용 `components/chat/ChatRoomHeader.tsx`로 교체 — 뒤로 \| 상대 아바타+이름(기존 `UserInline` 재사용, 탭→`/profile/[nickname]`) \| ⋯ 메뉴. 데이터는 기존 `conversation.other_user`에서 그대로(훅 변경 없음)
  - 실기기 확인, tsc 통과
- **앱 SearchScreen 로직 훅 분리**
  - 유저 검색 상태/300ms 디바운스 검색/포커스 시 최근검색 갱신·블러 시 입력 정리/최근검색 추가·삭제·전체삭제 로직을 `features/search/useUserSearch.ts`로 분리. 프로필 이동은 화면(`recordSearch` 후 `router.push`)
  - `SearchScreen.tsx` 272줄 → 226줄(+훅 83). 동작 변경 없음, 실기기 확인, tsc 통과
- **앱 ExploreScreen 데이터 로직 훅 분리**
  - 탐색 그리드의 로드/무한스크롤/새로고침 로직을 `features/explore/useExploreFeed.ts`로 분리. masonry 2열 배치·타일 렌더는 화면에 유지(레이아웃은 UI). 로컬 `PAGE_SIZE=24`는 공용 `PAGE_SIZE.explore`로 통일(값 동일)
  - `ExploreScreen.tsx` 312줄 → 257줄(+훅 85). 동작 변경 없음, tsc 통과
- **앱 ConnectionsScreen 로직 훅 분리 + 친구 삭제 버그 수정/확인·토스트**
  - 크루 관리 탭별 로딩 + 수락/거절/취소/삭제(낙관적) 로직을 `features/profile/useConnections.ts`로 분리. `ConnectionsScreen.tsx` 274줄 → 206줄(+훅 199)
  - **버그 수정**: 낙관적 업데이트 객체에 `friends` 키가 `[tab]`과 중복돼 친구 탭 삭제 시 자기 자신을 원본으로 덮어쓰던 문제(친구 삭제가 화면에 반영 안 됨). 객체를 단계적으로 만들고 `invalidateFriends && tab !== "friends"`일 때만 친구 캐시 무효화하도록 수정. (리팩토링 전부터 있던 버그)
  - **친구 삭제 확인 다이얼로그** + **삭제 성공 토스트("크루에서 삭제했어요")** 추가. 수락/거절/취소는 기존대로 즉시. 실기기 확인, tsc 통과

## 2026-06-27

### 완료
- **앱 WriteScreen 폼 로직 훅 분리** (앱 화면 god 파일 정리 완료)
  - 게시물 작성 화면의 이미지 선택/비율 자동 감지/내용·공개범위 상태/업로드·제출 로직을 `features/feed/useWriteForm.ts`로 분리(`MAX_IMAGES` export, `submit()` 성공 여부 반환)
  - 화면 파일은 작성취소 다이얼로그 UI 상태 + 렌더 + 라우팅만. `WriteScreen.tsx` 360줄 → 262줄. 동작/업로드 변경 없음, tsc 통과
  - 이로써 앱 화면 god 파일(StoryViewer/Home/Profile/ProfileEdit/Onboarding/MyActivity/StoryCreate/ChatRoom/Write) 전부 로직 훅·컴포넌트로 분리 완료
- **앱 ChatRoomScreen 로직 훅 분리**
  - 채팅방의 유저ID 로드/포커스·읽음 처리/키보드 가시성/요청 수락/차단/메시지 전송/대화·메시지 wrap 로직을 `features/chat/useChatRoom.ts`로 분리(`ChatMessage` 타입 포함). 차단은 성공 여부 반환 → 화면이 `router.replace`
  - 화면 파일은 메뉴/차단확인 UI 상태 + 렌더 + 네비게이션만. `ChatRoomScreen.tsx` 421줄 → 317줄(렌더 JSX+스타일 중심). 동작/실시간/읽음 처리 변경 없음, tsc 통과
- **앱 StoryCreateScreen 카메라 컴포넌트/훅 분리**
  - 한 파일에 섞여있던 카메라·권한·미리보기 3개 모드를 분리: 카메라/갤러리 입력은 `components/stories/StoryCamera.tsx`(촬영·전환·플래시·권한, 결과 uri를 `onSelected`로 전달), 업로드 상태/공개범위/제출은 `features/stories/useStoryCreate.ts`(`submit()` 성공 여부 반환)
  - 화면 파일은 훅 연결 + 미리보기 렌더 + 카메라 연결 + 라우팅만. `StoryCreateScreen.tsx` 457줄 → 177줄. 동작/화면/업로드 변경 없음, tsc 통과
  - 구조상 영상 추가 시 진입점 정리됨(StoryCamera 녹화 모드 / useStoryCreate 영상 업로드 / StoryPlayer 재생). 영상 자체는 스키마+expo-video+버킷 묶음으로 백로그
- **앱 스토리 보관함 조회자 목록 슬라이드 패널**
  - 미리보기 시트에서 사진 아래 항상 깔려 잘리던 "조회한 사람" 목록을, `조회 N` 버튼 탭 시 아래에서 올라오는 슬라이드 패널로 변경(인스타 스토리 인사이트 방식). 헤더 ∨/뒷배경 탭으로 닫힘
  - 기존 `ActivityStoryPreviewSheet` 재사용 — 조회자 행/포맷 함수/뱃지/메타 줄 그대로, 데이터/쿼리 변경 없음. 열림 상태 + Animated 슬라이드만 추가. tsc 통과
- **앱 MyActivityScreen 로직 훅 분리**
  - 내 활동 화면의 탭 상태/탭별 lazy load/백그라운드 prefetch/스토리 미리보기·본 사람 로딩/로딩·에러 파생값을 `features/activity/useMyActivity.ts`로 분리
  - 화면 파일은 훅 연결 + 게시물/프로필 네비게이션 + 탭바·그리드·시트 렌더 중심으로 정리. 동작/화면/네트워크 호출 변경 없음
  - `MyActivityScreen.tsx` 418줄 → 220줄(+훅 250). 웹/서버/DB 스키마 변경 없음. `cd apps/mobile && npx tsc --noEmit` 통과
- **앱 OnboardingScreen 폼 로직 훅 분리**
  - 온보딩 화면의 프로필 로드/닉네임 정규화·중복확인/제출/로딩·에러·readOnly 상태/canSubmit 파생값을 `features/auth/useOnboarding.ts`로 분리
  - 화면 파일은 훅 연결, `redirectTo`/제출 성공 시 라우팅, 기존 JSX/스타일 렌더 중심으로 정리. 동작/화면/네트워크 호출 변경 없음
  - 웹/서버/DB 스키마 변경 없음. `cd apps/mobile && npx tsc --noEmit` 통과
- **앱 god 파일 분리 (리팩토링)** — StoryViewer(712→로더79+StoryPlayer495+ViewersSheet/ProgressBar/Header), ProfileScreen(540→323+useProfile259), ProfileEditScreen(569→389+useProfileEdit258). 동작 동일, 각 단계 tsc+실기기 검증. StoryPlayer는 groups/onClose props로 받아 보관함/하이라이트 재사용 가능 구조
- **앱 HomeScreen 피드 로직 훅 분리**
  - `HomeScreen`에 섞여 있던 피드 상태/페이지 로드/새로고침/더보기/좋아요/저장/차단/신고/삭제/댓글 수 갱신 로직을 `features/feed/useHomeFeed.ts`로 분리
  - 화면 파일은 스토리·뱃지 메타, 댓글시트 상태, 네비게이션 핸들러, 렌더 연결 중심으로 정리. 동작/네트워크 호출 변경 없음
  - `HomeScreen.tsx` 562줄 → 309줄. 웹/서버/DB 스키마 변경 없음. `cd apps/mobile && npx tsc --noEmit` 통과
- **앱 색상 토큰화 Phase 1 (안전)** — theme.ts에 `black`/`imagePlaceholder` 토큰 추가, 기존 토큰과 똑같은 값 + `#000000`/`#E8E3F3` 하드코딩 17곳(11파일)을 `colors.*`로 교체. **값 동일 = 화면 변화 0**. push.ts colors import 누락 보완. tsc 통과. (알파값 soup/일회성은 Phase 2)
- **앱 페이지네이션 매직넘버 상수화** — `lib/constants/pagination.ts` `PAGE_SIZE`(feed 20/explore 24/messages 50/notifications 50)로 모으고 feed/explore/notifications/chat 호출부 교체. 동작 변경 없음, tsc 통과
- **앱 Storage 버킷/폴더명 상수화**
  - 앱 업로드 버킷/폴더 문자열을 `src/lib/constants/storage.ts`의 `STORAGE_BUCKETS`/`STORAGE_FOLDERS`로 분리
  - 아바타/게시물 이미지/스토리 이미지 업로드 호출부를 상수 참조로 교체. 버킷명 값과 업로드 동작 변경 없음
  - 웹/서버/DB 스키마 변경 없음. `cd apps/mobile && npx tsc --noEmit` 통과
- **앱 게시물 본인 글 삭제 메뉴 연결**
  - 앱 `feed/api.ts`에 `deletePost(postId)` 추가 — 현재 유저 본인 글만 `posts.deleted_at` soft delete 처리, 실제 삭제/스키마 변경 없음
  - `FeedPostCard` 본인 글 `...` 메뉴에 `삭제` 액션과 확인 다이얼로그 추가. 본인 글은 저장·삭제, 타인 글은 기존 저장·차단·신고 흐름 유지
  - 홈 피드는 삭제 성공 시 해당 글을 낙관적 제거하고 실패 시 롤백, 게시물 상세는 삭제 성공 피드백 후 뒤로 이동
  - 웹/서버/DB 스키마 변경 없음. `cd apps/mobile && npx tsc --noEmit` 통과

## 2026-06-26

### 완료
- **앱 채팅방 `...` 메뉴 연결**
  - 웹 채팅방과 동일하게 앱 채팅방 헤더 우측 `...` 메뉴를 추가하고 `ActionSheet` → 차단 확인 `ConfirmDialog` → `blockUser` RPC → 메시지 목록 이동 흐름 연결
  - 새 API/DB 변경 없이 기존 앱 `blockUser`/`ActionSheet`/`ConfirmDialog` 재사용. `cd apps/mobile && npx tsc --noEmit` 통과
- **앱 게시물 메뉴 액션 연결**
  - 앱 피드/게시물 상세 카드의 저장 아이콘과 `...` 메뉴를 실제 기능에 연결 — 북마크 상태 조회/토글, 차단 RPC, 신고 API 연결
  - 저장은 낙관적 토글+실패 롤백, 차단은 피드에서 해당 작성자 게시물을 즉시 제거, 신고/차단/저장 결과는 인라인 피드백으로 표시
  - 기존 `ActionSheet`/`ConfirmDialog` 재사용, 웹/서버/DB 스키마 변경 없음. `cd apps/mobile && npx tsc --noEmit` 통과
- **푸시 Phase 2 — 서버 전송(댓글/대댓글/DM) + 실기기 검증**
  - 방식: `notifications`/`messages` insert 트리거에서 **`pg_net`으로 Expo Push API 직접 POST**(Edge Function 없이 마이그레이션만, Expo Push는 인증키 불필요). 받는 사람 `fcm_token` 없으면 no-op
  - **댓글 푸시**(`push_on_comment_notification`): notifications insert(type=post_comment) → 게시물 작성자에게 푸시, data `{targetType:post,targetId}` → 탭 시 게시물
  - **DM 푸시**(`push_on_message`): messages insert → 대화 상대에게 "OO님이 메시지를 보냈어요", data `{targetType:chat,conversationId}` → 탭 시 채팅방. 클라 `navigation.ts`에 chat 타깃 라우팅 추가(Codex, 재빌드 X)
  - **대댓글 푸시**(`add_comment_reply_notification_and_push`): `notify_on_comment`이 답글(parent_id 있음)이면 **부모 댓글 작성자에게 `comment_reply` 알림** 생성하도록 변경(기존엔 답글 알림 자체가 없었음) + 푸시 트리거에 comment_reply 추가
  - **버그 발견·수정**: `notifications_type_check` 제약에 `comment_reply`가 없어 답글 INSERT가 롤백되던 문제 → 제약에 comment_reply 추가(이 버그 안 잡았으면 실제 답글 기능 깨짐)
  - 실기기 검증: 댓글/DM/대댓글 푸시 수신 + 탭 이동 모두 ✅ (pg_net 응답 200/ok). 테스트 데이터 정리 완료
  - **DM 스팸 방지**: 메시지마다 알림이 따로 쌓이는 문제 — Expo Push는 안드로이드 트레이 합치기(collapseId/tag) 보장 안 됨(알려진 한계). 대안으로 **"첫 안읽음만 푸시"**(이미 안 읽은 메시지 있으면 추가 푸시 생략) 트리거에 추가 → 실기기 확인(1번째 푸시/2번째 스킵). 트레이 그룹핑 자체는 백로그(FCM 직접/notifee 필요)
  - 남음: 인앱 알림 목록에서 comment_reply 문구/actor 처리(현재 generic), 좋아요/친구 푸시는 미적용(의도)
- **앱 푸시 알림 클라이언트 구현**
  - `expo-notifications`/`expo-device` 설치, `app.json`에 `expo-notifications` 플러그인과 Android `googleServicesFile` 연결 추가
  - 로그인 + 온보딩 완료 상태에서만 Android 알림 채널 생성 → 권한 요청 → Expo push token 획득 → `users.fcm_token` 저장하는 등록 훅 추가
  - 포그라운드 알림 표시 핸들러와 알림 탭 response listener 추가. 푸시 payload(`targetType`/`targetId`)를 기존 인앱 알림 target 라우팅과 동일한 공용 함수로 처리
  - 서버 전송(Edge Function)은 Phase 2로 남김. `cd apps/mobile && npx tsc --noEmit` 통과
  - 네이티브 모듈 추가 작업이라 실제 토큰 발급/수신/탭 이동 확인은 dev build 재빌드 후 진행 필요
- **앱 Google 로그인 + 온보딩 라우팅 가드**
  - `@react-native-google-signin/google-signin` 네이티브 패키지 추가 및 Expo config plugin 등록. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 환경변수 예시 추가
  - 앱 로그인 화면에 Google 4색 로고 버튼 추가 — 기존 이메일/비밀번호 로그인과 공존, 취소 응답은 조용히 무시
  - 앱 온보딩 API/화면 추가 — 구글 가입 후 서버 트리거가 채운 실명/학과를 읽고, 닉네임 중복확인 후 `is_onboarded=true` 저장
  - 세션 컨텍스트에 온보딩 상태를 추가하고 `login`/`(tabs)`/`onboarding` 라우팅 가드 연결. `cd apps/mobile && npx tsc --noEmit` 통과
  - 네이티브 모듈 추가 작업이라 실제 Google 로그인 동작 확인은 dev build 재빌드 후 진행 필요
- **앱 인증 토큰 SecureStore 전환**
  - 앱 Supabase 인증 세션 저장소를 AsyncStorage 평문 저장에서 `expo-secure-store` 기반 OS 암호화 저장소로 전환
  - SecureStore 값 크기 제한을 피하기 위해 2KB 청크 저장 어댑터(`secureStorageAdapter`) 추가, 기존 AsyncStorage 세션은 SecureStore가 비어 있을 때 1회 복사 후 삭제
  - 웹 코드와 검색 기록 AsyncStorage는 변경하지 않음. `cd apps/mobile && npx tsc --noEmit` 통과
  - 네이티브 모듈 추가 작업이라 실제 동작 확인은 dev build 재빌드 후 진행 필요
- **dev build 전환 + 앱 시스템바 안정화** (commit `b30f16e`)
  - EAS dev build 구성(`eas.json` development/preview/production 프로필) + `app.json`에 `package`(com.univer.app)/안드 권한/`extra.eas.projectId` 정리. 클라우드 빌드 → 실기기 APK 설치 → 터널 dev 서버 연결 완료
  - **edge-to-edge 비활성화**(`android.edgeToEdgeEnabled: false`) + `expo-navigation-bar` 플러그인·`androidNavigationBar`로 하단 네비바 흰 배경/어두운 버튼 고정
  - `lib/systemBars.ts` `SystemBarsController` 추가 — 경로별 프리셋(기본=흰 상태바/네비, 스토리=검정) 적용 + `AppState` 'active' 복귀 시 80/240ms 재시도로 재적용해 복귀 시 시스템바 깜빡임 보정. 루트 `_layout`의 expo-status-bar `<StatusBar>` 제거 → 컨트롤러로 대체. `StoryViewerScreen`의 개별 상태바 처리 제거(중앙화)
  - `lib/useStableInsets.ts` 추가 — 엣지투엣지 복귀 시 inset이 0으로 빠지는 것 방지(마지막 0 아닌 값 유지), 채팅 입력창에 적용
  - ⚠️ 실기기 검증 중 확인된 점: 사용자가 원한 건 3버튼 네비 투명화가 아니라 흰 배경 고정 쪽이었고, 영상 기능 설계로 우선순위 전환됨
- **앱 보안 검토 + 이미지 버킷 용량/형식 제한** (`20260626100000_set_image_bucket_limits.sql`)
  - 앱 보안 검토: service_role 키 없음·.env gitignore·RLS·랜덤 파일명·recount RPC 위조불가 등 양호 확인. 발견: ① 인증 토큰이 암호화 안 된 AsyncStorage 저장(SecureStore 권장, 앱 코드) ② 모든 버킷 public이라 공개 URL이 RLS 우회 → 크루공개/비공개도 URL 새면 노출 ③ 이미지 버킷에 용량/형식 제한 없음 ④ 프로필 외부 링크 무검증 오픈
  - 라이브 Storage 정책 조회: 업로드/읽기 모두 `authenticated`만(익명 업로드 불가), post-videos 버킷·정책은 이미 구성됨(100MB/형식 제한/owner 삭제). story-videos 버킷은 없음
  - 현업 조사: 공개 콘텐츠=public 버킷, 민감 콘텐츠=private+signed URL로 민감도 분리. 인스타도 public URL 노출 사고 이력 → 크루공개/DM은 향후 private+signed 권장
  - **적용**: avatars(5MB)·post-images/story-images(10MB)에 용량 제한 + `image/jpeg·png·webp` 형식 제한 추가. 라이브 적용·확인 완료. `docs/DATABASE.md`에 Storage 버킷 섹션 추가
  - 후속 과제(미적용): #1 토큰 SecureStore(앱 코드), #2 민감 버킷 private+signed URL(정책 결정 필요), #4 외부 링크 https 검증
- **스토리 영상 지원 DB 준비** (`20260626090000_add_story_video_support.sql`)
  - `stories` 테이블에 `type`('image'|'video', default 'image')·`thumbnail_url`·`duration` 컬럼 추가 — `post_media`와 동일한 방식. `image_url`은 영상일 때 영상 파일 URL로 재사용
  - `stories_type_check` CHECK 제약 추가, 라이브 DB 적용 완료(컬럼 추가라 기존 데이터 영향 없음)
  - 웹/앱 `database.types.ts` stories Row/Insert/Update 동기화, `docs/DATABASE.md` 반영
  - 참고: 게시물(`post_media`)은 이미 type/thumbnail_url/duration 보유 → 영상 DB 준비 완료 상태였음. 스토리만 이번에 맞춤. **클라이언트(녹화·재생·압축·썸네일) 작업은 별도 단계**

---

## 2026-06-24

### 완료
- **Expo 앱 프로필 편집/차단한 계정 화면 구현**
  - 웹 프로필 편집/차단 목록 로직을 앱으로 포팅 — `getBlockedUsers`/`unblockUser`, `updateProfile`/`checkNicknameDuplicate`/`uploadAvatar` 추가. 기존 테이블/RPC/Storage만 사용, 스키마 변경 없음
  - `/blocked`, `/profile/edit` push 라우트 추가, 설정 화면의 "프로필 편집"/"차단한 계정" Row 활성화
  - 프로필 편집 화면에서 현재 프로필 프리필, 프로필 사진 선택/업로드, 닉네임 유효성+중복 확인, 한 줄 소개, 대표 링크 다중 저장 연결
  - 차단한 계정 화면에서 목록/빈상태/에러 처리와 차단 해제 낙관적 제거+실패 롤백 처리
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 앱 내 활동 화면 구현 + 탐색 탭 라벨 정정**
  - 웹 `/settings/activity` API/5탭 lazy load 로직을 앱 `features/activity/api.ts`와 `MyActivityScreen`으로 포팅 — 기존 `stories`/`bookmarks`/`post_likes`/`comments`/`user_favorites` 테이블만 사용, 스키마 변경 없음
  - 스토리/저장됨/좋아요/댓글/즐겨찾기 5탭 구성, 스토리 로드 후 저장·좋아요·댓글 백그라운드 prefetch, 탭별 로딩/빈/에러 처리
  - RN 순수 UI `ActivityStoryGrid`/`ActivityPostGrid`/`ActivityFavoriteUserRow`/`ActivityStoryPreviewSheet` 추가 — 스토리 미리보기+조회자 목록, 게시물 상세/프로필 이동 연결
  - `/activity` push 라우트 추가, 본인 프로필에 "내 활동" 진입 버튼 연결, 하단 4번째 탭 라벨 `"활동"` → `"탐색"` 정정
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 앱 1:1 DM(채팅) 구현**
  - 웹 채팅 API/Realtime 훅을 앱 `features/chat/`로 포팅 — `conversations`/`messages` 기존 테이블과 `mark_messages_read`/`accept_chat_request` RPC만 사용, 스키마 변경 없음
  - `MessagesScreen`/`ChatRoomScreen` 및 `/messages`, `/messages/[conversationId]` 라우트 추가 — 대화 목록(active/pending), 채팅방, 이전 메시지 로드, 읽음 처리, pending 수락, 낙관적 전송, Realtime 수신
  - RN 순수 UI `ConversationRow`/`MessageBubble`/`MessageInput` 분리, 공용 `Avatar`/`ScreenHeader`/`StateView` 재사용
  - 홈 헤더 메시지 아이콘 → `/messages` 이동 및 안읽음 뱃지 연결, 상대 프로필 메시지 버튼 → 대화 생성/진입 연결
  - **웹 정합 디자인/UX 수정** — 채팅방 5분 간격 시간 구분선 + 버블 탭 시에만 시간/읽음 표시(항상표시 제거), 목록을 "닉네임으로 대화 시작" 검색 + 알약 탭(메시지/요청)으로 재구성
  - **채팅방 inverted FlatList 재작성** — 최신 메시지를 하단 고정해 새 메시지/키보드에서 자동으로 하단 유지(수동 스크롤 제거). 입력창 하단 `safe-area inset`(SDK 54 Android 엣지투엣지 대응)
  - **읽음 처리 버그 수정** — 방을 연 채 들어온 메시지도 읽음 처리(웹도 동일 버그였음 → 나가도 안읽음으로 안 남게)
  - **읽음을 Broadcast로 전환 (앱+웹)** — `postgres_changes` UPDATE(간헐 미수신) 대신 대화 공유 채널 `chat:read:<id>`에 "read" 이벤트 broadcast → 양쪽 즉시 읽음 반영(카톡식). DB `read_at`은 안읽음 카운트/재입장 폴백용 유지
  - ⚠️ **미해결(dev build 필요)** — ① Android 엣지투엣지 백그라운드 복귀 시 시스템바 inset이 잠깐 사라지는 현상(앱 전역, 스토리 포함) ② 키보드 완벽 처리(`react-native-keyboard-controller`는 Expo Go 불가). 둘 다 dev build에서 정리
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **앱 검색 기능 구현 (유저 검색 + 최근 검색)**
  - 웹 검색 로직 포팅 — `features/search/api.ts`(`search_users` RPC + 차단 제외). 스키마 변경 없음
  - 최근 검색을 웹 `localStorage` → **`AsyncStorage` 비동기**로 포팅(`features/search/history.ts`, 최대 10개)
  - `screens/search/SearchScreen.tsx` + 기존 `(tabs)/search.tsx` placeholder 교체 — 입력 300ms 디바운스, 입력 시 결과/빈칸 시 최근 검색, 탭 시 최근검색 추가 + 프로필 이동. 순수 UI `SearchInput`·`SearchUserRow` 분리
  - 탭 전환 시 입력어/결과 초기화(`useFocusEffect` 정리 함수) — 탭 떠나면 비우고 복귀 시 빈 입력+최근검색
  - `cd apps/mobile && npx tsc --noEmit` 통과. main 파일별 커밋
  - 참고: 프로토타입 "발견" 탭(추천 크루/공식·동아리/실시간 급상승)은 승격·구독·랭킹 의존 → Phase 2. 이번은 검색만

---

## 2026-06-23

### 완료
- **앱 알림 기능 구현 (목록/뱃지/읽음/이동)**
  - 웹 `notifications/api.ts` 로직 포팅 — `features/notifications/`(`getNotifications`/`getUnreadCount`/`markAsRead`/`markAllAsRead`). 이동 대상을 `href` 문자열 대신 RN 라우팅용 `target` 객체(post/story/profile)로 반환, 라우트는 앱용(`/post/[id]`). 스키마 변경 없음
  - 알림 화면 — `screens/notifications/NotificationsScreen.tsx` + `app/notifications.tsx`(push). 헤더(알림+모두읽음), 목록, 탭 시 읽음처리(낙관적)+게시물/스토리/프로필 이동, 빈/로딩/에러. 순수 UI `components/notifications/NotificationRow.tsx` 분리
  - 홈 헤더 벨 → 알림 화면 + 안읽음 빨간 뱃지, `HomeScreen` 포커스 시 `getUnreadCount` 갱신
  - **버그 수정**: 본인이 자기 글에 누른 좋아요/댓글이 알림에 "나"로 뜨던 문제 — actor 컬럼이 없어 "최근 좋아요/댓글한 사람"으로 추정하던 것이 원인. actor 추정 쿼리에 `neq(user_id, 본인)` 추가(트리거는 본인 행동 알림 미생성 확인). ⚠️ 웹도 동일 버그 + 근본 해결은 `notifications.actor_id` 컬럼 → 이슈트래커 기록
  - `cd apps/mobile && npx tsc --noEmit` 통과. main에 파일별 커밋
- **앱 스토리 기능 구현 (스토리바/작성/뷰어/자체 카메라)**
  - **이미지 업로드 공용 헬퍼 분리** — `features/shared/imageUpload.ts`로 리사이즈/압축/버킷 업로드 공용화. 피드 `uploadPostImages`도 이 헬퍼로 교체(중복 제거, expo-image-manipulator 로직 1곳)
  - **스토리 API/타입** — `features/stories/`에 웹 `stories/api.ts` 로직 포팅(DB/쿼리 동일, 스키마 변경 없음). `getStories`(내 스토리→크루→같은 학교 정렬)/`createStory`/`recordStoryView`/`toggleStoryLike`/`getMyStoryLikedStatus`/`deleteStory`/`getStoryViewers`. 업로드만 모바일 방식(`story-images` 버킷, width 1080)
  - **스토리 신고 API** — `features/reports/api.ts` 웹에서 포팅(`createReport`, `reports` 테이블)
  - **홈 스토리바** — `components/stories/StoryBar.tsx`. 내 스토리는 "내 스토리" 카드(미리보기 썸네일 + 우하단 추가 배지)로 합치고, 타 유저는 그룹 카드(썸네일 + 미열람 보라 테두리 + 닉네임). `HomeHeader` placeholder 카드 제거, `HomeScreen`에 `useFocusEffect`로 포커스 시 스토리 갱신
  - **스토리 작성 화면** — `screens/stories/StoryCreateScreen.tsx` + `app/story/create.tsx`. 갤러리 선택 + 업로드 → `createStory`
  - **자체 카메라** — `expo-camera` 설치. 작성 화면을 "카메라 먼저"로 전환(라이브 프리뷰 + 촬영/전후면 전환/플래시/갤러리 단축) → 미리보기 모드(공개범위 + 다시/공유). `app.json`에 카메라 권한 문구 추가
  - **스토리 뷰어** — `screens/stories/StoryViewerScreen.tsx` + `app/story/[userId].tsx`. 9:16 칸(화면 맨 위부터, 아래 남는 공간은 검정), 세로 사진 `cover`/정사각·가로 `contain`+같은 이미지 블러, 진행바 자동재생(5초)+탭 일시정지, 좌측/우측 탭 이전·다음, 유저 간 이동, 좋아요(낙관적+롤백), `···` 메뉴(본인 삭제/타인 신고+ConfirmDialog), 내 스토리 "N명 봄" → 조회자 시트. 조회 기록은 본인 제외. `expo-linear-gradient` 스크림 추가
  - `cd apps/mobile && npx tsc --noEmit` 통과. main에 파일별 커밋
  - ⚠️ **미해결 이슈**: 뷰어에서 다른 앱/홈 갔다 복귀 시 사진이 상태바 영역 뒤로 올라감(Android/Expo Go). StatusBar/AppState 재적용 시도했으나 미완 → 이슈트래커 기록, dev build 기준 재검증 예정
- **중복 코드 공용화(시간/비율/유저컨텍스트/ScreenHeader)**
- **공용 ConfirmDialog 추가 + 작성 화면 초기화/취소 경고**
  - 재사용 가능한 `components/common/ConfirmDialog.tsx`(RN Modal, danger 분기) 추가 — 스토리 삭제/신고·친구 삭제 등 재사용 예정
  - WriteScreen: 게시 성공 후 입력값 초기화(다음에 방금 올린 글 안 남게), "취소" 시 작성 중인 내용 있으면 ConfirmDialog로 discard 경고(탭 전환은 draft 유지)
  - 게시물 작성 큰 미리보기 추가(선택 사진을 고른 비율로 표시, 비율 변경 시 프레임도 변경)
- **CommentsSheet 로직 useComments 훅 분리(리팩토링)**
- **Expo 게시물 작성 화면 구현 (사진 업로드)**
  - `expo-image-picker`/`expo-image-manipulator`를 설치하고 `react-dom`을 Expo SDK 54 호환 `19.1.0`으로 정렬
  - 앱 `feed/api.ts`에 이미지 리사이즈/압축 후 Supabase Storage `post-images` 업로드 함수와 `posts`/`post_media` 작성 함수를 추가(스키마 변경 없음)
  - 작성 탭 placeholder를 `WriteScreen`으로 교체하고, 사진 다중 선택/미리보기/삭제, 본문, 비율 자동감지+수동 선택, 공개범위 선택, 게시 후 홈 이동을 연결
  - `PostImageUploader`, `PostAspectRatioPicker`, 공용 `VisibilityPicker` 순수 UI를 분리
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 크루 관리 화면 구현**
  - 앱 `profile/api.ts`에 `getFriends`/`getPendingRequests`/`getSentRequests` RPC 조회를 추가하고 기존 수락/거절/삭제 RPC를 재사용(스키마 변경 없음)
  - `(tabs)` 바깥 `app/profile/connections.tsx`와 `ConnectionsScreen`을 추가해 내 크루/받은 요청/보낸 요청 3탭, lazy load, 새로고침, 빈상태/로딩/에러 표시를 구현
  - `ConnectionTabs`/`ConnectionUserRow` 순수 UI를 분리하고, 받은 요청 수락·거절, 보낸 요청 취소, 내 크루 삭제를 낙관적 행 제거+실패 롤백으로 처리
  - 내 프로필의 크루 통계를 누르면 크루 관리 화면으로 이동하도록 연결하고, 유저 행 탭 시 상대 프로필로 이동
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 상대 프로필 크루 액션 구현**
  - 앱 `profile/api.ts`에 친구 상태 조회/신청/수락/거절/삭제 RPC와 유저 즐겨찾기 조회/토글을 이식(기존 RPC·테이블만 사용, 스키마 변경 없음)
  - `ProfileConnectionActions` 순수 UI와 RN `ActionSheet` 공용 컴포넌트를 추가하고, 상대 프로필에서 친구 신청/요청됨+취소/수락·거절/친구 상태를 표시
  - 상대 프로필 헤더 `...` 메뉴에서 즐겨찾기 추가/해제와 친구 삭제를 연결하고, 낙관적 업데이트+실패 롤백 및 크루 수 갱신 처리
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 기본 아바타 실루엣 통일**
  - 기본 아바타를 웹과 동일한 회색 실루엣으로 통일
- **앱 댓글 고도화 (대댓글/좋아요/삭제/멘션)**
  - `features/comments/api.ts`에 `deleteComment`(본인만, cascade, 원댓글일 때만 `recount_post_comments`), `toggleCommentLike`(`comment_likes` 토글 + `recount_comment_likes` + 실패 시 롤백), `getLikedCommentIds` 추가 — 기존 테이블/RPC 호출만, 스키마 변경 없음
  - `CommentsSheet`를 평탄화 → **트리 렌더**로 리팩토링: 답글 달기(@멘션 자동 채움 + "○○에게 답글 달기" 배너), 대댓글 "답글 N개 보기/숨기기" 접기펼치기, 댓글 좋아요(하트+수, 낙관적+롤백), 본인 댓글 삭제, 대댓글 @부모닉네임 멘션(프로필 링크)
  - 댓글 한 행을 순수 UI `components/comments/CommentRow.tsx`로 분리(재사용). 드래그 닫기/모달/safe-area 셸은 유지
  - `cd apps/mobile && npx tsc --noEmit` 통과

---

## 2026-06-22

### 완료
- **앱 게시물 상세 화면 1차 구현**
  - 앱용 `getPost(postId)` 추가(`features/feed/api.ts`) — 차단 제외/soft delete 제외, 작성자+미디어(order_index) 조합해 기존 `FeedPost` 형태로 반환(FeedPostCard 그대로 재사용)
  - `screens/post/PostDetailScreen.tsx` 추가 — `getPost`+`getLikedPostIds([postId])` 로드, 좋아요 토글(홈과 동일 `togglePostLike`+recount), 댓글은 기존 `CommentsSheet` 바텀시트, 작성자 탭 → `/profile/[nickname]`. 헤더(뒤로+게시물), safe-area-context 적용
  - 라우트 `app/post/[id].tsx` — `(tabs)` 바깥(탭바 안 보임), 세션 가드, id 없으면 `/` 리다이렉트
  - 탐색 타일·프로필 그리드 `Pressable` → `/post/[id]` 이동 (탐색 masonry 디자인/비율 유지, 프로필 내/상대 동일)
  - 저장/신고/차단/삭제는 이번 범위 제외(UI no-op). 연속 피드 미확장(단일 상세 우선)
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo Router 전환 + 앱 화면 확장 (탐색/프로필)**
  - 수동 useState 탭 → Expo Router 파일 기반 라우팅 전환(실기기 검증). 세션 게이트 `src/lib/session.tsx`, `app/(tabs)` 5탭.
  - **탐색 화면**: 같은 학교 public 인기순 2열 masonry. 웹 `ExploreGrid` 규칙 그대로 — 세로→4:5, 정사각·가로→1:1 썸네일, 둥근타일+흰 좋아요뱃지+빨강 하트. 무한 스크롤. (실기기 검증)
  - **프로필 화면(내 프로필)**: 웹 page 레이아웃으로 재구성 — KrewSurface 흰 패널 안에 아바타+게시물/크루 통계, 닉네임/실명/학과, bio/링크, **3열 1:1 그리드**. 앱용 `getProfile(nickname?)/getProfilePosts/getProfileCounts`(닉네임 분기 지원). 재사용 컴포넌트 `KrewSurface`, `PostThumbnailGrid`(3열 flex 행), `ProfileInfoPanel`로 분리.
  - 웹 코드/문서 전수 파악(features 13개 api + 주요 렌더링 컴포넌트 + ARCHITECTURE/DECISIONS/NOTES). 비율·탐색·하단탭 규칙 등 메모리 기록.
- **Expo 상대방 프로필 라우트 1차 연결**
  - `(tabs)` 바깥 파일 기반 라우트 `apps/mobile/app/profile/[nickname].tsx` 추가
  - 세션이 없으면 `/login`, 닉네임 파라미터가 없으면 `/profile`로 리다이렉트
  - 기존 `ProfileScreen`의 `nickname` prop을 재사용해 상대방 프로필 보기 전용 진입 경로를 연결
  - 탭 그룹 바깥 라우트라 프로필 진입 시 하단 탭바가 가려지는 구조
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 피드/댓글 작성자 프로필 이동 연결**
  - 공용 `UserInline` 컴포넌트를 추가해 앱 작성자 표시 UI를 재사용 가능하게 분리
  - 홈 피드 카드 작성자 영역을 누르면 `/profile/[nickname]`로 이동하도록 연결
  - 댓글 바텀시트의 댓글/대댓글 작성자 영역을 누르면 시트를 닫고 해당 프로필로 이동하도록 연결
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 바텀시트 높이 보정**
  - 댓글 시트 높이를 화면 대부분을 덮는 `94%` 고정 높이로 변경해 인스타그램식 풀 높이 바텀시트에 가깝게 조정
  - 댓글 리스트/로딩 영역에 `flex: 1`을 적용해 입력창을 하단에 두고 댓글 목록이 남은 공간을 채우도록 보정
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 바텀시트 닫기 UX 보정**
  - 댓글 시트의 `닫기` 텍스트 버튼을 제거하고 핸들/헤더를 아래로 드래그하면 닫히는 제스처를 추가
  - 모달 상단 배경을 어두운 단색으로 바꿔 Android 상태바 영역에 뒤 피드 이미지가 비쳐 보이는 느낌을 줄임
  - 댓글 제목을 중앙 정렬해 인스타그램식 바텀시트 헤더에 가깝게 보정
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 바텀시트 드래그/상태바 재보정**
  - 단색 모달 배경을 다시 반투명 배경으로 복구해 뒤 피드 맥락이 보이도록 수정
  - 드래그 닫기를 `Animated` 기반으로 바꿔 시트가 손가락을 따라 내려가고, 취소 시 스프링으로 원위치 복귀하도록 보정
  - Android 상태바 겹침 완화를 위해 루트 `StatusBar`에 `backgroundColor`와 `translucent={false}`를 명시
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo safe area 1차 보정**
  - 앱 루트에 `SafeAreaProvider`를 추가하고 주요 화면의 `SafeAreaView`를 `react-native-safe-area-context`로 교체
  - 하단 탭바에 bottom inset을 반영해 Android 시스템 내비게이션바 영역과 겹치지 않도록 보정
  - 댓글 모달에 top/bottom inset을 적용해 상태바/시스템 내비게이션바 영역 침범을 줄임
  - 댓글 시트 드래그 responder를 터치 시작부터 잡도록 바꿔 첫 드래그부터 시트가 손가락을 따라 움직이도록 보정
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 시트 닫힘 중복 모션 제거**
  - RN `Modal`의 `animationType="slide"`와 내부 `Animated.timing`이 동시에 내려가던 문제를 제거
  - `Modal` 애니메이션은 끄고 내부 시트 애니메이션만 사용하도록 변경
  - 닫힘 중복 호출 방지 ref를 추가해 backdrop/드래그 닫기가 겹쳐 호출되지 않도록 보정
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 시트 하단 여백/닫힘 튐 보정**
  - 모달 overlay의 bottom inset padding을 제거해 댓글 시트가 화면 하단에 다시 붙도록 수정
  - 입력 영역에만 bottom safe-area padding을 적용해 Android 시스템 내비게이션바와 입력창이 겹치지 않도록 보정
  - 닫힘 애니메이션 종료 시 `translateY`를 즉시 0으로 되돌리던 코드를 제거해 시트가 중간에 다시 뜨는 프레임을 방지
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 앱 구조 분리 + 홈 피드 1차 연결**
  - 검증용으로 `App.tsx`에 몰려 있던 세션 분기, 로그인 화면, 홈 화면을 `apps/mobile/src/app`, `screens`, `components`, `features` 구조로 분리
  - `apps/mobile/src/lib/theme.ts`를 추가해 KREW 앱 색상 토큰을 앱 전용으로 분리
  - 앱용 피드 API `apps/mobile/src/features/feed/api.ts` 추가
    - `getFeed()` — 같은 학교 게시물, 작성자, 미디어 조회
    - `getLikedPostIds()` — 현재 유저 좋아요 상태 조회
    - `togglePostLike()` — `post_likes` 토글 + `recount_post_likes` RPC 호출
  - `HomeScreen`에서 로그인 후 `세션 연결 완료` 화면 대신 실제 홈 피드 화면을 표시하도록 변경
  - `FlatList` 기반 피드 렌더링, 당겨서 새로고침, 무한 스크롤, 좋아요 토글 1차 연결
  - RN 전용 `FeedPostCard`, `Avatar`, `StateView` 공용 컴포넌트 추가
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 홈 피드 KREW 모바일 레이아웃 1차 보정**
  - 앱 홈에서 이메일/로그아웃 노출을 제거하고 KREW 워드마크 + 우측 원형 액션 버튼 구조로 변경
  - 웹 모바일 홈과 유사한 `내 스토리` 카드, 하단 탭바, 둥근 흰 피드 카드, 다중 이미지 배지, 실제 프로필 이미지 표시를 추가
  - 좋아요/댓글/북마크 액션 영역과 작성자 메타 라인을 웹 모바일 피드에 가깝게 재배치
  - `cd apps/mobile && npx tsc --noEmit` 재통과
- **Expo 앱 아이콘 체계 정리 1차**
  - `react-native-svg`를 Expo SDK 54 호환 버전(`15.12.1`)으로 설치하고 `lucide-react-native` 추가
  - 홈 헤더, 하단 탭바, 피드 카드의 텍스트/이모지 아이콘을 lucide 아이콘(`Bell`, `MessageCircle`, `Home`, `Search`, `Plus`, `Heart`, `Bookmark`, `MoreHorizontal` 등)으로 교체
  - 기기 폰트에 따라 아이콘 모양이 달라지는 문제를 줄이고 웹의 lucide 계열 아이콘 방향과 맞춤
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 피드 다중 이미지 캐러셀 구현**
  - `FeedMediaCarousel` 컴포넌트 추가
  - 피드 카드의 단일 첫 이미지 렌더를 horizontal `FlatList` + `pagingEnabled` 캐러셀로 교체
  - 이미지 스와이프 종료 시 현재 인덱스를 계산해 `1/2`, `2/2` 배지가 실제 위치와 동기화되도록 변경
  - 게시물 `aspect_ratio`에 따라 정사각형/세로/가로 이미지 프레임 유지
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 바텀시트 1차 연결**
  - 앱용 댓글 API `apps/mobile/src/features/comments/api.ts` 추가
    - `getComments()` — 댓글/대댓글 조회 및 작성자 정보 조합
    - `createComment()` — 댓글 작성 + `recount_post_comments` RPC 호출
  - `CommentsSheet` 컴포넌트 추가
    - RN `Modal` 기반 하단 시트
    - 댓글 목록/빈 상태/로딩/에러 표시
    - 댓글 입력 및 전송 버튼 연결
  - 피드 카드 댓글 아이콘을 누르면 해당 게시물 댓글 시트가 열리도록 `HomeScreen`과 `FeedPostCard` 연결
  - 댓글 작성 후 피드 카드 댓글 수를 즉시 갱신
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 댓글 바텀시트 반복 로딩 버그 수정**
  - 원인: 댓글 조회 후 피드 댓글 수 갱신 → `HomeScreen` 재렌더 → `onCommentCountChange` 콜백 참조 변경 → `CommentsSheet` effect 재실행 루프
  - `HomeScreen`의 `handleCommentCountChange`를 `useCallback`으로 고정해 댓글 시트가 계속 로딩 상태로 돌아가는 문제를 차단
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 피드 이미지 로딩 개선 + 댓글 시트 자동 포커스 제거**
  - Expo SDK 54 호환 `expo-image`를 설치하고 앱 피드 캐러셀 이미지를 RN 기본 `Image`에서 Expo Image로 전환
  - 피드 이미지에 `memory-disk` 캐시, `contentFit="cover"`, 짧은 transition, recycling key를 적용해 재방문/스크롤 시 로딩 체감을 개선
  - 댓글 바텀시트가 열릴 때 입력창을 자동 focus하지 않도록 변경해, 사용자가 댓글 입력창을 누를 때만 키보드가 뜨도록 보정
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo 앱 탭 전환 구조 1차 구현**
  - `AuthenticatedApp` 셸을 추가해 로그인 이후 홈/검색/작성/활동/프로필 탭 상태를 관리하도록 분리
  - `BottomTabBar`를 실제 `Pressable` 탭 버튼으로 변경하고 활성 탭, 접근성 label/selected state를 반영
  - 홈 화면 내부에 있던 하단 탭 렌더링을 앱 셸로 올려 탭바 중복 렌더링 가능성을 제거
  - 검색/작성/활동/프로필은 이후 기능 연결을 위한 placeholder 화면으로 먼저 구성
  - `cd apps/mobile && npx tsc --noEmit` 통과
- **Expo dev server 실행 이슈 확인**
  - `npx expo start`, `npx expo start --port 8081` 모두 현재 로컬 Node `v24.15.0`에서 `ERR_SOCKET_BAD_PORT(65536)`로 종료됨
  - Expo SDK 54 문서 기준 조합은 Node `20.19.x` 이상이며, 현재 Expo CLI/freeport 조합은 Node 24에서 포트 탐색 문제가 있어 Node 20 LTS로 실행 필요
- **Expo Router 전환 (수동 탭 → 파일 기반 라우팅)**
  - 공식 문서(`/router/installation`, `/router/advanced/tabs`) 확인 후 진행
  - `expo-router` + `react-native-safe-area-context`/`react-native-screens`/`expo-linking` 설치, `package.json` main을 `expo-router/entry`로 변경, `app.json`에 `scheme: univer` + `plugins: [expo-router]` 추가
  - `app/` 파일 기반 라우트 신설: `app/_layout.tsx`(세션 게이트 + Stack), `app/login.tsx`, `app/(tabs)/_layout.tsx`(세션 없으면 로그인 리다이렉트, 커스텀 탭바), `(tabs)/index·search·write·activity·profile`
  - `AppRoot`의 세션 로직을 `src/lib/session.tsx`(SessionProvider/useSession)로 이전
  - `BottomTabBar`를 Expo Router 탭 상태(`state`/`navigation`) 기반으로 변경(기존 KREW 디자인 유지)
  - 수동 탭 구조 제거: `index.ts`, `App.tsx`, `src/app/AppRoot.tsx`, `src/app/AuthenticatedApp.tsx`, `src/app/tabs.ts` 삭제
  - 효과: 탭별 네비게이션 스택/안드로이드 백버튼/딥링크 기반 확보, 웹(Next App Router)과 파일 기반 라우팅 멘탈모델 일치
  - 실기기 확인: 로그인 → 홈 진입, 하단 탭 5개 전환, 세션 유지, 로그아웃, 피드/좋아요/댓글 동작 정상 / `cd apps/mobile && npx tsc --noEmit` 통과
  - 연결 메모: WSL2 + 실기기는 `npx expo start --tunnel` 필요(LAN 모드면 "Failed to download remote update")

### 다음 작업
- [ ] 상세 화면을 `(tabs)` 바깥 라우트로(`app/post/[id].tsx`, `app/profile/[username].tsx`) 만들어 진입 시 하단 탭바가 가려지는 구조 적용
- [x] 상대방 프로필 라우트 `app/profile/[nickname].tsx` 1차 연결
- [x] 피드 카드 작성자·댓글 작성자 탭 시 `/profile/[nickname]` 이동 연결
- [ ] 검색/활동(탐색)/프로필 placeholder를 실제 조회 화면으로 연결
- [ ] 화면들의 `react-native` `SafeAreaView`를 `react-native-safe-area-context`로 교체 (deprecation 경고 제거)
- [ ] `react-dom` 19.1.0으로 정렬(`npx expo install react-dom`) — 선택
- [ ] 그동안 쌓인 커밋 push

---

## 2026-06-21

### 완료
- **Expo 앱 전환 검증 시작**
  - `docs/APP_MIGRATION.md`를 추가해 앱 1차 범위, 웹/앱 분리 기준, 재사용 후보 API, 실행/확인 방식을 정리
  - `apps/mobile`에 Expo SDK 54 TypeScript 앱 뼈대 생성
  - 앱 전용 `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill` 의존성 추가
  - Expo용 Supabase client `apps/mobile/src/lib/supabase.ts` 추가
  - 앱 첫 화면을 KREW 톤의 이메일 로그인/세션 확인 화면으로 구성
  - Expo 앱 환경변수 예시 `apps/mobile/.env.example` 추가
  - Android Expo Go 54.0.8 기준 앱 실행 및 이메일 로그인 성공 확인
  - 루트 `.gitignore`에 `.claude/`, `supabase/.temp/` 명시

### 다음 작업
- [ ] Expo Go 앱 재실행 후 Supabase 세션 유지 확인
- [ ] 앱 홈 피드 vertical slice 구현 (`getFeed`, 이미지 렌더, 좋아요)
- [ ] 댓글 바텀시트와 댓글 조회/작성 연결
- [ ] 프로필/탐색 조회 화면 연결

---

## 2026-06-19

### 완료
- **피드/모바일 게시물 상세 카드 룩 통일**
  - 홈 피드 `PostCard`를 모바일 좌우 풀폭(edge-to-edge), 그림자 없는 흰 표면으로 정리
  - 피드 카드 최상위 패딩과 모바일 좌우 margin/라운드를 제거해 게시물 이미지가 화면 폭을 풀블리드로 채우도록 보정
  - 모바일 게시물 상세를 피드와 같은 풀폭 구조로 재배치하고, 이미지 풀블리드/액션·본문 패딩 구조를 맞춤
  - 게시물 사이 세로 간격은 유지해 KREW 연보라 배경이 구분선처럼 보이도록 조정
  - 데스크톱 피드 카드와 상세 2단 레이아웃은 기존 가운데 칼럼/모달 구조를 유지
  - 모바일 상세의 인라인 `댓글 달기...` 입력 버튼을 제거하고 댓글 보기/첫 댓글 링크와 댓글 아이콘이 기존 `CommentSheet` 바텀시트를 열도록 유지
  - 데스크톱 게시물 상세 2단 모달 구조와 댓글 입력, 좋아요/댓글/신고/차단/캐러셀 로직은 유지
- **프로필 페이지 카드/그리드 통합 레이아웃 보정**
  - 모바일 프로필에서 프로필 정보와 게시물 그리드를 하나의 KREW 카드 표면 안에 묶어 표시하도록 재구성
  - 프로필 카드 내부 중복 카드 래핑을 제거하고, 프로필 정보와 게시물 그리드 사이에 얇은 구분선만 남김
  - 프로필 그리드는 3열 간격을 좁히고 썸네일 라운드를 `rounded-lg`로 정리
  - 프로필/탐색 풀폭 비교용 미리보기 `docs/design/profile-explore-preview.html` 추가
  - 프로필 조회, 크루/친구 신청, 메시지 이동, 설정/옵션 액션 로직은 유지
  - 데스크톱 프로필은 현재 모바일 중심 카드 폭을 유지하므로, 향후 웹 전용 레이아웃을 별도 분기할 필요가 있음

### 다음 작업
- [ ] 모바일 실기기에서 홈 피드 카드와 게시물 상세 카드 폭/라운드/댓글 바텀시트 진입 확인
- [ ] 프로필 카드/그리드 통합 레이아웃을 모바일 실기기에서 확인하고, 데스크톱 전용 레이아웃 분기 여부 결정
- [ ] 게시물 상세 모바일 연속 피드 UX 적용 여부와 순서 정책 별도 논의

---

## 2026-06-16

### 완료
- **KREW 기반 4차 디자인 적용 (메시지/채팅/알림)**
  - 메시지 목록을 KREW 배경, 검색 입력, 카드형 대화 목록, 보라 포인트 요청 탭으로 재스타일링
  - 채팅방 fullscreen 화면의 헤더, 요청 수락 안내, 메시지 말풍선, 입력창을 KREW 토큰 기준으로 정리
  - 알림 모바일 페이지와 데스크톱 알림 패널의 헤더, 읽음 처리 버튼, 알림 카드, 읽지 않음 상태 표시를 KREW 스타일로 통일
  - 기존 대화 검색/생성, 채팅 요청 수락, 메시지 전송/읽음 처리, 알림 읽음 처리/이동 로직은 유지
- **KREW 기반 5차 디자인 적용 (게시물 작성)**
  - `/write` 작성 화면의 헤더, 게시 버튼, 본문 입력, 해시태그 입력, 편집 모드 미디어 미리보기를 KREW 배경/카드/보라 포인트 기준으로 재스타일링
  - `PostImageUploader`와 비율 선택기를 KREW 카드형 미디어 선택/segmented control 톤으로 정리
  - 공개 범위 선택기의 라이트 테마를 KREW 토큰으로 맞추고, 스토리 작성에서 쓰는 다크 테마는 유지
  - 영상 Phase A를 고려해 화면 문구는 미디어 단위로 열어두되, 실제 영상 업로드/플레이어/DB 변경은 구현하지 않음
- **KREW 기반 6차 디자인 적용 (프로필 편집/크루 관리)**
  - `/profile/edit` 프로필 사진 변경, 닉네임, 소개, 대표 링크, 학과 표시 영역을 KREW 카드형 폼으로 재스타일링
  - `/profile/connections` 크루 관리 헤더, 탭, 요청/크루 리스트, 수락/거절/삭제 버튼을 KREW 배경/카드/보라 포인트 기준으로 정리
  - 기존 프로필 조회/저장, 아바타 업로드, 닉네임 중복 확인, 크루 요청 수락/거절/삭제 로직은 유지
- **KREW 기반 7차 디자인 적용 (설정)**
  - `/settings` 헤더, 계정/지원 섹션, 로그아웃/탈퇴 액션을 KREW 카드형 리스트와 보라 포인트 기준으로 재스타일링
  - 기존 프로필 편집/내 활동/차단 목록 이동, 로그아웃, 계정 탈퇴 확인 다이얼로그 로직은 유지
- **KREW 기반 8차 디자인 적용 (내 활동/차단 목록)**
  - `/settings/activity` 헤더, 탭, 빈 상태, 로딩 그리드, 스토리/게시물 보관함 그리드, 즐겨찾기 리스트를 KREW 배경/카드/보라 포인트 기준으로 재스타일링
  - 스토리 보관함 미리보기 모달의 오버레이, 닫기 버튼, 모달 라운드/그림자를 KREW 톤에 맞게 정리
  - `/settings/blocked` 차단 목록 헤더, 로딩 스켈레톤, 빈 상태, 차단 계정 리스트와 해제 버튼을 KREW 카드형 리스트로 재스타일링
  - 기존 내 활동 탭 lazy load, 게시물/프로필 이동, 스토리 조회자 조회, 차단 해제 로직은 유지
- **KREW 기반 9차 디자인 적용 (인증/온보딩)**
  - 인증 화면 공통 KREW 레이아웃/카드/입력/버튼 스타일을 `components/auth/AuthLayout.tsx`로 분리
  - 로그인 화면을 KREW 로고 중심 첫 화면과 학교 이메일 시작 CTA 중심으로 재스타일링하고, 기존 이메일+비밀번호 로그인 폼은 보조 로그인으로 유지
  - 회원가입, 비밀번호 찾기, 비밀번호 재설정 화면을 KREW 배경/카드/보라 포인트 폼으로 통일
  - 온보딩 화면에 학교 인증 카드와 프로필 설정 폼을 KREW 톤으로 적용
  - 기존 Google 로그인, 이메일+비밀번호 로그인/가입, 비밀번호 재설정, 온보딩 저장 로직은 유지
- **계정 전환 시 stale 캐시/세션 정리**
  - 홈 피드/탐색/프로필 메모리 캐시를 비우는 `clear*PageCache` 함수와 통합 `clearAllPageCaches()` helper 추가
  - `AppSessionProvider`가 Supabase `onAuthStateChange`를 구독하도록 변경해 로그인/로그아웃/유저 변경 시 캐시를 비우고 현재 유저/알림/채팅 뱃지를 재동기화
  - 로그아웃 API에서도 명시적으로 페이지 캐시를 먼저 비워 같은 브라우저 탭에서 계정 전환 시 이전 계정 관점의 프로필/피드/탐색 상태가 남지 않도록 보강
  - 기존 페이지 재방문 캐시 TTL과 정상 로그인 후 내 프로필 표시 흐름은 유지
- **모바일 프로필 중복 메뉴 정리**
  - 모바일 타인 프로필에서 상단바 `...`와 프로필 카드 내부 `...`가 동시에 보이지 않도록 카드 내부 친구 옵션 버튼을 모바일에서 숨김
  - 데스크톱에서는 상단 모바일 헤더가 없으므로 카드 내부 친구 옵션 버튼을 유지
- **카운터 갱신 RPC 전환**
  - 게시물 좋아요, 게시물 댓글 수, 댓글 좋아요 수, 스토리 조회수를 직접 `UPDATE count = count + delta` 방식으로 쓰지 않고 `recount_*` SECURITY DEFINER RPC 호출로 교체
  - 좋아요/댓글/조회 row insert·delete/upsert 로직과 낙관적 UI 흐름은 유지하고, 최종 카운트는 RPC 반환값 또는 재계산 결과 기준으로 동기화
  - `database.types.ts`에 `recount_post_likes`, `recount_post_comments`, `recount_comment_likes`, `recount_story_views` 타입 추가
  - 향후 posts/comments/stories 광역 UPDATE RLS 정책 제거에 대비
- **users 민감 컬럼 직접 SELECT 제거**
  - 프로필 조회와 현재 유저 프로필 조회에서 `users.email`, `users.real_name`, `users.fcm_token` 직접 SELECT 제거
  - 현재 유저 이메일은 Supabase Auth 세션의 `user.email`을 사용하고, 실명은 `get_user_real_name(p_user_id)` RPC 반환값으로 채움
  - `fcm_token`은 현재 소비처가 없어 `getCurrentUserProfile` 반환 타입에서 제외
  - `database.types.ts`에 `get_user_real_name` RPC 타입 추가

### 다음 작업
- [ ] 공용 오버레이(ActionSheet/ConfirmDialog) 디자인 적용 여부 결정
- [ ] 같은 브라우저 탭에서 A계정 로그아웃 → B계정 로그인 후 프로필/피드/탐색 캐시가 이전 계정 관점으로 남지 않는지 확인
- [ ] 모바일 실기기에서 로그인/회원가입/온보딩/설정/내 활동/차단 목록 시각 및 기존 기능 확인

---

## 2026-06-15

### 완료
- **KREW 기반 1차 디자인 적용**
  - 전역 디자인 토큰을 연보라 배경, 단색 보라 포인트(`#7C3AED`), KREW 카드 그림자/라인 색상 기준으로 정리
  - 모바일/데스크톱 앱 셸의 화면상 워드마크를 `KREW`로 변경하고, 헤더/사이드바/하단 탭 활성 색상을 보라 포인트로 통일
  - 하단 탭을 KREW 스타일의 높이/라벨/중앙 `+` 강조 버튼으로 조정하고 마지막 탭 라벨을 `마이`로 변경
  - 홈 스토리바를 원형 아바타 링에서 균일 카드형 모멘트바로 변경하고, 최신 스토리 이미지를 카드 배경으로 표시
  - 홈 피드 `PostCard`를 둥근 흰 카드, 내부 둥근 이미지 프레임, 부드러운 그림자, 보라 해시태그/좋아요 색상 기준으로 재스타일링
  - 기능 로직 변경 없이 기존 피드 좋아요/댓글/저장/게시물 메뉴/댓글 바텀시트 흐름 유지
- **KREW 기반 2차 디자인 적용 (검색/탐색)**
  - 반복되는 KREW 페이지 여백, 헤더, 흰 카드 표면, 섹션 헤더를 `KrewLayout` 공통 컴포넌트로 분리
  - 검색 페이지를 연보라 배경, 큰 검색창, 카드형 최근 검색/검색 결과 영역으로 재스타일링
  - 검색 결과 프로필 이동 시 닉네임 URL 인코딩을 적용해 특수문자 닉네임 이동 안정성 보강
  - 탐색 페이지를 같은 학교 게시물 2열 매스너리로 변경하고, 각 타일에 좋아요 수 pill을 상시 표시
  - 기존 검색 API, 탐색 API, 탐색 무한 스크롤, 게시물 상세 진입 로직은 유지
- **탐색 업로드 비율 반영**
  - 탐색 API가 게시물 `aspect_ratio`를 함께 내려주도록 보강
  - 탐색 매스너리 타일을 순서 기반 임의 비율이 아니라 업로드 시 선택한 정사각형/세로 비율 중심으로 렌더링
  - 가로 게시물은 2열 탐색에서 지나치게 작아 보이지 않도록 정사각형 타일로 표시
- **게시물 작성 첫 이미지 비율 자동 감지**
  - 새 게시물 작성 시 첫 이미지의 실제 `naturalWidth`/`naturalHeight`를 읽어 정사각형/세로/가로 비율을 자동 선택
  - 자동 선택 이후에도 기존 비율 선택 UI에서 사용자가 수동 변경할 수 있도록 유지
  - 기존 게시물의 저장된 `aspect_ratio`는 이번 작업에서 일괄 보정하지 않음
- **KREW 기반 3차 디자인 적용 (프로필/게시물 상세/댓글)**
  - 프로필 페이지를 KREW 카드형 헤더, 보라 포인트 버튼, 둥근 3열 게시물 그리드로 재스타일링
  - 모바일 프로필에서는 공통 KREW 헤더 대신 뒤로가기/닉네임/설정 또는 더보기 전용 헤더를 표시
  - 프로필 카드 상단을 아바타+게시물/크루 지표 구조로 재배치하고, 기존 그리드 탭 바를 제거
  - 피드 이미지와 프로필 그리드 썸네일의 라운드를 제거해 콘텐츠 사진은 더 담백하게 보이도록 보정
  - 게시물 상세 직접 접근/웹 모달 wrapper와 상세 내부 헤더/액션/본문/해시태그를 KREW 토큰 기준으로 정리
  - 게시물 상세 본문에도 피드와 동일하게 작성자 닉네임 프로필 링크를 표시
  - 댓글 목록, 데스크톱 댓글 입력, 모바일 댓글 바텀시트를 KREW 색상/표면/입력 pill 기준으로 재스타일링
  - 타인 프로필의 친구 신청/메시지 버튼을 한 줄 액션으로 정리하고 버튼 크기를 축소
  - 기존 프로필 데이터 조회, 크루/메시지 액션, 게시물 상세 액션, 댓글 작성/답글/삭제/좋아요 로직은 유지

### 다음 작업
- [ ] 모바일 실기기에서 홈 피드/모멘트바/하단 탭 시각 확인
- [ ] 프로필/게시물 상세 디자인 확인 후 채팅 목록/채팅방, 게시물 작성 화면 순서로 확장 적용

## 2026-06-12

### 완료
- **페이지 재방문 체감 속도 개선 1차**
  - 홈 피드 메모리 캐시 추가: 피드 목록, 다음 커서, 좋아요/저장 상태를 짧게 보관해 재방문 시 즉시 표시
  - 탐색 그리드 메모리 캐시 추가: 게시물 썸네일 목록, offset, hasMore를 보관해 상세/프로필 이동 후 복귀 시 스켈레톤을 줄임
  - 프로필 페이지 메모리 캐시 추가: 닉네임별 프로필/게시물/관계 상태를 짧게 보관해 같은 프로필 재방문 시 즉시 표시
  - 캐시는 새로고침 시 사라지는 브라우저 메모리 캐시로 제한하고, 홈/탐색 90초·프로필 60초 TTL 적용
- **홈 피드/프로필 첫 렌더 우선순위 조정**
  - 홈 피드는 해시태그 조회를 생략하고 `posts + users + media`가 도착하면 먼저 렌더링하도록 변경
  - 홈 피드 좋아요/저장 상태는 카드 표시 후 비동기로 붙여 첫 화면 대기 시간을 줄임
  - 프로필 페이지는 프로필 헤더를 먼저 표시하고 게시물 그리드/게시물 수/관계 상태/즐겨찾기 상태는 후속 조회로 채우도록 분리
- **모바일 피드 댓글 진입 단축**
  - 모바일 홈 피드에서 댓글 버튼 클릭 시 게시물 상세 라우트 이동 대신 기존 `CommentSheet` 바텀시트를 즉시 열도록 변경
  - 데스크톱 홈 피드는 기존처럼 게시물 상세/모달 이동 유지
- **전역 요청 중복 제거 1차 최적화**
  - `AppSessionProvider` 추가: 현재 유저 프로필, 알림 읽지 않음 수, 채팅 읽지 않음 수를 전역에서 한 번만 조회/구독하도록 정리
  - `Header`/`NavItems`가 각자 `getUnreadCount`, `getChatUnreadCount`, `getCurrentUserProfile`을 호출하던 구조를 provider 값 사용으로 변경
  - 사이드바용/바텀탭용 `NavItems`가 동시에 마운트되어도 데이터 요청과 Realtime 구독이 중복되지 않도록 보정
  - 프로필 탭 링크를 현재 유저 닉네임을 알 수 있을 때 `/profile/me` 대신 실제 `/profile/[nickname]`으로 연결해 불필요한 replace 이동을 줄임
  - `getBlockRelatedUserIds()`에 30초 TTL + 진행 중 promise 공유 캐시를 추가하고 차단/해제 시 cache invalidate 처리

### 다음 작업
- [ ] 배포 후 모바일에서 페이지 전환/뒤로가기 시 즉시 표시 여부와 Network 요청 수 비교
- [ ] 필요 시 홈 피드/탐색/프로필 데이터 캐시 또는 RPC 통합 2차 최적화 검토

---

## 2026-06-11

### 완료
- **이미지 표시 최적화 (성능 최적화 Phase 2)**
  - `next.config.ts`에 Supabase Storage public 이미지 remote pattern 등록
  - 홈 피드 `PostCard`와 게시물 상세 `ImageCarousel`을 `next/image`로 전환
  - 탐색/프로필/내 활동 3열 그리드 썸네일을 `next/image` + `sizes`로 전환
  - 스토리 뷰어, 스토리 유저 프리뷰, 보관함 스토리 미리보기 이미지를 `next/image`로 전환
  - `/write` 수정 모드 기존 게시물 이미지도 `next/image`로 전환
  - 제외: Avatar, 알림/관리자 소형 이미지, 로컬 `blob:` 미리보기
- **이미지 업로드 압축 (성능 최적화 Phase 1)**
  - `browser-image-compression` 설치
  - `src/lib/image/compress.ts` 추가 — `compressImageFile(file, options)`: 업로드 전 브라우저 압축, GIF/비이미지/실패 시 원본 fallback, 압축본이 더 크면 원본 사용
  - `features/feed/api.ts` `uploadPostImages` 압축 적용 (maxSizeMB 2, maxWidthOrHeight 1600, quality 0.8)
  - `features/stories/api.ts` `uploadStoryImage` 압축 적용 (maxSizeMB 2, maxWidthOrHeight 1920, quality 0.75)
  - `features/profile/mutations.ts` `uploadAvatar` 압축 적용 (maxSizeMB 0.5, maxWidthOrHeight 512, quality 0.8)
  - 확장자/업로드 경로 기존 방식 유지, Supabase Storage에는 압축본 저장
  - 범위 제한: 표시 렌더링(`<img>`→next/image)·`next.config.ts`·쿼리 최적화는 이번 작업에서 제외 (Phase 2는 Codex가 이어서 진행)
- **답글 멘션 링크 및 입력 포커스 보정**
  - 답글 작성으로 자동 삽입되는 첫 `@닉네임`만 프로필 링크(`/profile/[nickname]`)로 표시
  - 직접 입력한 일반 댓글의 `@텍스트`는 멘션 기능으로 처리하지 않도록 MVP 범위 제한
  - 모바일 댓글 바텀시트에서 `답글 달기` 클릭 시 댓글 입력창에 즉시 포커스되도록 보정
  - 데스크톱 게시물 상세 댓글 입력도 답글 대상 선택 시 포커스되도록 적용
- **모바일 댓글 바텀시트 키보드 대응 보정**
  - 실제 모바일 브라우저에서 키보드가 열릴 때 댓글 바텀시트 헤더가 화면 위로 밀려 사라지는 문제 확인
  - `CommentSheet`를 `visualViewport` 기준으로 배치해 키보드 표시 시에도 보이는 뷰포트 안에 시트가 유지되도록 보정
  - 댓글 시트가 열려 있는 동안 바디 스크롤을 잠가 배경/고정 레이어가 함께 밀리는 현상 완화
  - 댓글 목록 영역과 헤더/입력 영역의 shrink/scroll 구조를 명확히 분리
- **모바일 게시물 상세 본문 UX 개선**
  - 긴 본문이 모바일 게시물 상세 화면을 과하게 밀어내지 않도록 기본 3줄 접기 처리
  - `더보기`/`접기` 버튼으로 본문을 확장하거나 다시 접을 수 있도록 적용
  - 모바일 게시물 상세 모달 내부가 세로 스크롤되도록 보정
- **새 채팅 인계 문서 최신화**
  - `AGENTS.md`의 완료 요약을 탐색/내 활동/차단/게시물 비율/모바일 상세 UX 기준으로 갱신
  - 다음 작업을 migration 정리, 탐색 상세 고도화, 모바일 상세 실기기 확인, Expo 전환 준비 순서로 정리

### 다음 작업
- [ ] 탐색 상세 흐름 고도화 (탐색 게시물 연속 피드)
- [ ] 모바일 댓글 바텀시트 키보드/답글 포커스 보정 후 실제 기기 재확인
- [ ] 이미지 표시 최적화 배포 후 모바일 피드/탐색/프로필 그리드 체감 확인

---

## 2026-06-10

### 완료
- **모바일 피드 이미지 폭 보정**
  - 홈 피드 모바일 레이아웃에서 게시물 이미지가 좌우 여백 없이 화면 폭을 꽉 쓰도록 조정
  - 에러 메시지 등 텍스트 UI는 기존 좌우 여백을 유지해 읽기성을 보존
- **작성 화면 fullscreen 전환**
  - `/story/create`를 fullscreen route group으로 이동해 모바일 Header/BottomTabBar 없이 표시
  - 스토리 작성 프리뷰를 `h-dvh` 기준 남은 영역에 맞춰 공개범위/공유 버튼까지 한 화면에 들어오도록 보정
  - `/write`를 fullscreen route group으로 이동해 게시물 작성 화면에서 하단 탭바 제거
  - 보완: `/write`는 데스크톱 사이드바를 유지하도록 `(sub)` route group으로 복구하고, 모바일 하단 탭바만 숨기도록 분리
- **게시물 비율 선택 1단계 기반 작업**
  - `posts.aspect_ratio` 컬럼 추가 migration 작성 (`square`/`portrait`/`landscape`, 기본 `portrait`)
  - `database.types.ts`와 `features/feed/api.ts`에 게시물 비율 타입/저장/조회 경로 반영
  - 기존 작성 UI가 비율을 넘기지 않아도 `portrait` 기본값으로 저장되도록 API 기본값 설정
- **게시물 비율 선택 2단계 작성 화면 UI**
  - `/write`에 `square`/`portrait`/`landscape` 비율 선택 UI 추가
  - 선택된 사진을 큰 미리보기로 확인하고, 썸네일을 눌러 최대 10장 중 원하는 사진을 전환 확인할 수 있도록 개선
  - 게시 저장 시 선택한 비율을 `createPost`에 전달하도록 연결
  - 실제 DB에 `posts.aspect_ratio` migration이 적용되기 전에도 피드/상세/게시가 죽지 않도록 `portrait` fallback 처리 추가
  - 썸네일 선택 테두리가 이미지 영역에 가려지지 않도록 내부 outline 방식으로 보정
- **게시물 비율 선택 3단계 표시 적용**
  - 홈 피드 `PostCard` 이미지 프레임을 `aspect_ratio` 기준으로 고정하고 `object-cover`로 표시
  - 게시물 상세 `ImageCarousel` 모바일/일반 표시도 같은 비율 프레임을 사용하도록 보정
  - 다중 이미지 현재 위치 배지(예: `1/2`)를 이미지 오른쪽 위에 표시
  - 현재 위치 배지는 모바일에서만 표시하고, 스크롤 종료 후 인덱스를 갱신해 스와이프 중 숫자 떨림을 줄이도록 보정
- **게시물 작성 UX 정리**
  - `(sub)` 레이아웃에서 `/write`만 데스크톱 작성 폭을 넓게 쓰도록 분리
  - `/write` 모바일 하단 탭바 숨김은 유지하면서 데스크톱 사이드바는 유지
  - 게시물 이미지 미리보기는 모바일/데스크톱 모두 과하게 커지지 않도록 최대 폭 제한
  - 데스크톱 썸네일 크기와 작성 화면 좌우 여백을 보정
- **Supabase migration 정리 현황 문서화**
  - 원격 Supabase migration 이력 60개와 로컬 migration 파일 27개를 대조
  - 로컬 누락 version 51개, 로컬에만 있는 version 18개 확인
  - `supabase migration repair`는 보류하고 원격 이력을 기준으로 SQL 원문 확보 후 보강하기로 정리
  - `docs/MIGRATION_SYNC.md`에 mismatch 목록과 정리 원칙 추가
- **스토리 조회자 시트 UX 수정**
  - 조회자 목록의 프로필 표시를 공용 `Avatar` 컴포넌트로 통일
  - 조회자 row 클릭 시 해당 유저 프로필(`/profile/[nickname]`)로 이동하도록 연결
- **모바일 게시물 상세 댓글 UX 개선**
  - 모바일 인터셉트 게시물 상세 모달을 전체 화면(`h-dvh`) 형태로 보정
  - 모바일 게시물 상세에서 댓글 목록/입력창을 인라인으로 밀어 넣지 않고 댓글 바텀시트로 열리도록 변경
  - 데스크톱 게시물 상세 모달의 이미지/댓글 레이아웃은 기존 구조 유지
  - 댓글 바텀시트의 댓글 수 갱신 콜백을 고정해 반복 로딩이 발생하지 않도록 보정

### 다음 작업
- [ ] Expo 앱 전환 준비 (1순위)
- [ ] 모바일 웹 기준 주요 화면 체감 속도 점검

---

## 2026-06-09

### 완료
- **탐색(Explore) 탭 1차 구현 (임시 그리드)**
  - 하단 탭 `카테고리`(죽은 `/category` 링크) → `탐색`(`/explore`)으로 교체, 나침반 아이콘 적용
  - `features/explore/api.ts` `getExplorePosts`: 같은 학교 + 전체공개 + 이미지 있는 글, 내 글/차단 유저 제외, 좋아요순→최신순 정렬
  - `components/explore/ExploreGrid.tsx`: 3열 썸네일 그리드, hover 시 좋아요·댓글 수 오버레이
  - `/explore` 페이지: 무한 스크롤(IntersectionObserver), 로딩 스켈레톤/빈 상태, 썸네일 클릭 시 게시물 상세 이동
  - 참고: 명세서상 탐색 탭은 본래 타 학교 콘텐츠용. 단일 학교 MVP 동안 같은 학교 콘텐츠로 그리드 UX를 자리잡게 하는 임시 구현 (다학교 확장 시 승격/주간바이럴 로직으로 교체 예정)
- **내 활동 탭별 lazy load 리팩토링**
  - `/settings/activity` 진입 시 기본 탭인 스토리만 먼저 조회하도록 변경
  - 저장됨/좋아요/댓글/즐겨찾기는 각 탭 최초 클릭 시 해당 데이터만 조회하도록 변경
  - 한 번 조회한 탭은 메모리에 유지해 재진입 시 즉시 표시
  - 탭별 로딩/에러 상태를 분리해 한 탭 요청 실패가 다른 탭 UI를 막지 않도록 유지
- **내 활동 탭 전환 체감 속도 개선**
  - 스토리 탭 최초 로드 후 저장됨/좋아요/댓글 탭 데이터를 백그라운드에서 미리 조회
  - 즐겨찾기는 후순위 기능이라 기존처럼 탭 최초 클릭 시 조회 유지
- **게시물 좋아요 연타 방지**
  - 홈 피드와 게시물 상세에서 좋아요 요청 중 같은 게시물의 추가 클릭을 무시하도록 보정
  - 빠른 연속 클릭으로 좋아요 수가 여러 번 낙관 업데이트되는 문제 수정
- **차단 기능 1차 구현**
  - `block_user` RPC 추가: 차단 row 생성, 기존 친구 관계 삭제, 상호 즐겨찾기 삭제를 한 번에 처리
  - `get_block_related_user_ids` RPC 추가: 내가 차단한 유저와 나를 차단한 유저를 모두 반환
  - 피드/게시물 상세/검색/프로필 조회에서 차단 관계 유저를 숨기도록 1차 필터링 적용
  - 게시물 `...` 메뉴의 차단 버튼을 실제 차단 확인 다이얼로그와 API 호출로 연결
  - 차단 후 홈 피드에서는 해당 유저 게시물을 즉시 제거하고, 상세 페이지에서는 홈으로 이동하도록 처리

- **차단 기능 2차 구현**
  - `get_blocked_users` RPC 추가: 내가 차단한 유저 목록 반환 (닉네임/학과/차단 시각 포함)
  - `unblock_user` RPC 추가: 특정 유저 차단 해제 (친구 관계 자동 복구 없음)
  - `database.types.ts`에 두 RPC 타입 추가
  - `features/blocks/api.ts`에 `getBlockedUsers`, `unblockUser`, `BlockedUser` 타입 추가
  - `features/chat/api.ts` `getConversations`에서 차단 관계 유저와의 대화 목록 제외
  - `features/chat/api.ts` `sendMessage`에서 차단 관계 상대에게 메시지 전송 차단
  - `/settings/blocked` 페이지 추가: 차단한 계정 목록, 차단 해제 확인 다이얼로그
  - 설정 페이지에 "차단한 계정" 메뉴 추가
  - 채팅방 헤더 `...` 메뉴에 차단 버튼 추가, 차단 후 `/messages`로 이동
  - 보완: 차단 관계 채팅방 직접 URL 접근 시 메시지 조회/Realtime 수신/읽음 처리/입력창을 차단

- **게시물/스토리 공개범위 정리**
  - posts/stories SELECT RLS의 `close_friends` 판별을 `close_friends` 테이블 → `user_connections(status='accepted')` 크루 관계로 교체 (양방향)
  - 빈 `close_friends` 테이블로 인해 크루공개 콘텐츠가 작성자에게만 보이던 버그 수정
  - `VisibilityPicker` 공통 컴포넌트 신규 생성 (전체공개/크루공개, light·dark 테마, 게시물·스토리 재사용)
  - `/write` 작성 화면에 공개범위 선택 UI 복구 (기존 주석 처리 + `public` 고정 상태 해제, 수정 모드에서는 숨김)
  - `/story/create` 작성 화면에 다크 테마 공개범위 선택 UI 추가
  - `features/stories/api.ts` `createStory(imageUrl, visibility)` 파라미터 추가
- **스토리 뷰어 모바일 9:16 안전 프레임 보정**
  - 모바일에서 스토리 배경은 화면 전체를 채우되 실제 콘텐츠 프레임은 9:16 비율로 고정
  - 기기별 화면비 차이로 스토리 이미지가 다르게 잘리는 문제를 줄이고, 데스크톱부터 기존 3열 프리뷰 레이아웃 유지
  - 모바일 좌우 이동은 화면 좌우 터치 영역으로 처리
  - 상단 오버레이와 하단 액션바를 별도 컴포넌트/레이어로 분리
  - 모바일 하단 액션바는 스토리 프레임이 아닌 화면 하단 독립 레이어로 배치
  - 모바일 스토리 프레임을 상단 정렬하고 상단 UI는 safe-area를 고려하도록 보정

### 다음 작업
- [ ] Expo 앱 전환 준비 (1순위)
- [ ] 다학교 확장 시 탐색 탭 본 기능(승격 공식계정/주간 바이럴/팔로우) 구현

---

## 2026-06-08

### 완료
- **내 활동 1차 구현**
  - `/settings/activity` 페이지 생성
  - 설정 페이지에 `내 활동` 메뉴 추가
  - 탭 UI 추가: 스토리 / 저장됨 / 좋아요 / 댓글 / 즐겨찾기
  - `features/activity/api.ts` 생성 — 앱 전환 재사용을 고려해 내 활동 조회 로직 분리
- **스토리 보관함 1차 구현**
  - 내가 올린 스토리 전체 조회
  - 활성/만료 상태 표시
  - 전체공개/크루공개 공개범위 표시
  - 스토리 목록 카드에 업로드 날짜 배지 표시
  - 스토리 클릭 시 이미지 크게 보기 모달 표시
  - 스토리 상세 모달에 업로드 날짜/시간, 조회 수, 좋아요 수, 조회자별 좋아요 상태 표시
- **내 활동 UI 구조 정리**
  - `/settings/activity/page.tsx`에서 스토리 그리드, 저장 게시물 그리드, 스토리 상세 모달을 `components/activity/`로 분리
  - 페이지는 탭 상태, 데이터 로딩, 라우팅만 담당하도록 책임 축소
- **게시물 저장 기능 연결**
  - 기존 `bookmarks` 테이블 기반 저장/저장취소 API 연결
  - 홈 피드 북마크 버튼 상태 표시 추가
  - 저장한 게시물을 `내 활동 > 저장됨` 탭에서 확인 가능하도록 연결
- **닉네임 정책 보강**
  - 신규 가입 시 이메일 앞부분을 공개 닉네임으로 쓰지 않도록 `handle_new_user()` 트리거 수정
  - 기본 닉네임을 `user_랜덤값` 임시값으로 생성하고 온보딩에서 직접 입력해야 시작 가능하도록 변경
  - 온보딩 저장 시 닉네임 형식/중복 검사 추가
  - `users_active_nickname_lower_unique` 인덱스 추가로 활성 유저 기준 대소문자 무관 중복 닉네임 방지
  - 탈퇴 유저 닉네임은 점유 해제되어 재사용 가능하도록 기존 전체 unique 제약 제거
  - Supabase 원격 프로젝트(`qmslcvnuzjraphvnaqxx`)에 migration 적용 및 확인
- **Google 프로필 파싱 트리거 복구**
  - 닉네임 정책 migration 중 `handle_new_user()`의 Google `full_name` 파싱이 누락된 문제 수정
  - `심재성(학부생-자동차공학과)` 형식을 `real_name=심재성`, `department=자동차공학과`로 다시 분리
  - 잘못 저장된 `simsim020304@kookmin.ac.kr` row를 원격 DB에서 보정
  - Google `avatar_url` 저장 로직 제거 — 프로필 사진은 앱 자체 업로드만 사용
  - Google 프로필 사진 URL이 들어간 기존 row의 `avatar_url`을 NULL로 보정
- **내 활동 2차 구현**
  - `내 활동 > 좋아요` 탭을 실제 좋아요한 게시물 목록과 연결
  - `내 활동 > 댓글` 탭을 실제 댓글 단 게시물 목록과 연결
  - `user_favorites` 테이블/RLS/migration 추가
  - 프로필 친구 옵션 메뉴에 즐겨찾기 추가/해제 연결
  - `내 활동 > 즐겨찾기` 탭에서 즐겨찾기 계정 목록 표시
  - 계정 탈퇴 시 관련 즐겨찾기 기록 정리하도록 `delete_account()` 보강
- **내 활동 오류 보정**
  - 댓글 탭 조회 조건을 실제 원격 DB 스키마에 맞게 수정
  - 특정 탭 조회 실패가 스토리/저장/좋아요 등 다른 탭 표시를 막지 않도록 탭별 에러 처리로 변경

### 다음 작업
- [ ] 차단 기능 구현 및 피드/검색/프로필/채팅 반영
- [ ] 게시물/스토리 공개범위 정리 (`public` / `close_friends` → 전체공개 / 크루공개)
- [ ] 하단 탭 `카테고리` → `탐색` 교체 및 같은 학교 public 게시물 그리드 구현

---

## 2026-06-06

### 완료
- **Google OAuth 실사용 테스트** — Vercel 배포 환경에서 확인
  - 실명(`심재성`) + 학과(`자동차공학과`) 자동 파싱 정상 확인
  - 온보딩 화면에서 실명/학과 읽기 전용, 닉네임만 입력 흐름 정상
- **댓글 수 불일치 수정** — SQL 직접 삭제로 `comments_count` 미감소 → 전체 재동기화
- **이메일 인증 정책 확정**
  - `@kookmin.ac.kr` 도메인 자체가 재학생 증명이므로 이메일 인증 OFF 유지
  - Resend는 비밀번호 재설정 메일 발송용으로만 연동 예정
- **팔로우 기능 설계 확정**
  - 단방향, 수락 불필요, 실명 미공개
  - 같은 학교: 크루 + 팔로우 모두 가능 / 다른 학교: 팔로우만 가능
  - 피드·스토리 노출 순서: 크루 → 팔로우 → 전교생
  - 타교생 콘텐츠는 나중에 탐색(Explore) 탭에서만 노출
  - 팔로우 알림은 설계만 해두고 현재 비활성
- **`follows` 테이블 생성** (Supabase migration: `20260606_create_follows_table`)
  - `follower_id`, `following_id`, `created_at`
  - 자기 자신 팔로우 방지 CHECK, UNIQUE 제약, 인덱스 2개, RLS 활성화

### 다음 작업
- [ ] Resend 연동 (비밀번호 재설정용)
- [ ] 팔로우 API + UI (Codex 프롬프트)
- [ ] 피드/스토리 노출 순서에 팔로우 반영 (Codex 프롬프트)

---

## 2026-06-05

### 완료

#### 보안 패치 (Supabase MCP 직접 적용 — migration 3개)
- **anon 함수 실행 권한 전면 차단**
  - 기존: 모든 public 함수가 비로그인 포함 누구나 호출 가능
  - `REVOKE FROM PUBLIC` 후 `GRANT TO authenticated`만 선택 부여
  - 트리거 전용 함수(notify_*, handle_new_user 등)는 authenticated에서도 제거
- **Storage 버킷 파일 목록 노출 차단**
  - avatars, post-images, post-videos, story-images 4개 버킷
  - 기존 광범위 SELECT 정책 제거 → 로그인 유저 전용 정책으로 교체
  - URL 직접 접근은 그대로, 전체 목록 조회만 차단
- **함수 search_path 고정**
  - 모든 public 함수에 `SET search_path = public` 추가
  - search_path 조작을 통한 악성 함수 주입 경로 차단

#### 런타임 버그 수정
- `delete_account()` — 이미 삭제된 `user_likes` 테이블 참조 제거 (계정 탈퇴 시 오류 발생하던 버그)
- `toggle_user_like()`, `get_user_like_status()` 함수 제거 (user_likes 삭제 후 방치된 dead code)

#### Supabase Auth 설정 변경 (대시보드)
- 최소 비밀번호 길이: 6자 → **8자**
- 비밀번호 조건: **Letters and digits** (영문+숫자 조합 강제)

#### Google OAuth 연동 (국민대 Google Workspace)
- Google Cloud Console에서 OAuth 앱 생성 (웹 애플리케이션)
- Supabase Google provider 활성화 (Client ID/Secret 등록)
- `handle_new_user` 트리거 수정
  - Google `full_name`(`심재성(학부생-자동차공학과)` 형식) 파싱
  - `real_name`, `department` 자동 저장
  - **프로필 사진(avatar_url)은 가져오지 않음** — 앱 자체 업로드만 사용
- `prevent_sensitive_user_update` 트리거 수정
  - `real_name` NULL → 값 최초 1회 설정 허용 (온보딩용)
  - 이후 변경은 여전히 차단

#### 실명 공개 범위 구현 (코드)
- `features/profile/api.ts` `getProfile()` — 뷰어가 친구(accepted)이거나 본인일 때만 `real_name` 반환, 아니면 null
- `app/(main)/profile/[nickname]/page.tsx` — `real_name` 있을 때만 닉네임 아래 표시

#### 기존 계정 실명 수동 등록
- `s2j_3.04` (simsim020304@kookmin.ac.kr) — `real_name: 심재성`, `department: 자동차공학과` 직접 입력

### 남은 항목
- [ ] 로그인/회원가입 UI — Google 버튼, 실명 입력칸, 비밀번호 찾기 (Codex)
- [ ] 기존 유저 실명 입력 — 프로필 편집 페이지에 real_name 입력칸 추가 (Codex)
- [ ] Resend 이메일 연동 + 이메일 인증 재활성화 (배포 전 필수)

## 2026-06-01

### 완료
- 앱 전환 전 정리 항목 기록
  - `features/` 레이어의 웹 전용 의존성 점검
  - 정리 대상 확인:
    - 채팅 API/hook의 `window.dispatchEvent`, `window` 이벤트
    - Auth redirect의 `window.location.origin`
    - 검색 기록의 `localStorage`
    - 이미지 업로드 API의 브라우저 `File` 타입
  - `docs/PLAN.md`에 앱 전환 전 정리 체크리스트 추가
- 계정 탈퇴/복구 soft delete 정책 보강
  - 기존 `delete_account()`가 게시글/스토리/댓글을 hard delete하던 문제 확인
  - `delete_account()`를 작성 콘텐츠 soft delete 방식으로 변경
    - `posts`, `stories`, `comments`, `messages`의 `deleted_at` 기록
    - `users.deleted_at` 기록 및 `fcm_token` 제거
  - `restore_account()`가 30일 내 계정과 작성 콘텐츠를 함께 복구하도록 변경
  - 탈퇴 전 사용자가 직접 삭제한 콘텐츠는 복구하지 않도록 탈퇴 시각과 같은 `deleted_at`만 복구
  - Supabase 원격 프로젝트(`qmslcvnuzjraphvnaqxx`)에 migration 적용 및 함수 본문 재조회 확인
  - 주의: 실제 유저 플로우 테스트는 아직 미완료. 탈퇴/복구 관련 이상 발생 시 우선 `20260601100000_soft_delete_account_content.sql` 확인
- 프로필 대표 링크 기능 구현
  - `profile_links` 테이블 migration 추가 (프로필당 여러 링크 확장 가능한 구조)
  - Supabase 원격 프로젝트(`qmslcvnuzjraphvnaqxx`)에 `profile_links` migration 적용
  - 프로필 편집 페이지에 대표 링크 입력칸 추가
  - URL 정규화 유틸 추가 (`instagram.com/...`, `www...` 입력 시 `https://` 링크로 저장)
  - 프로필 페이지에서 학과 아래에 대표 링크 표시
  - 로컬(`localhost:3000`)에서 링크 저장 및 프로필 표시 동작 확인
- 채팅 수신 메시지 자동 스크롤
  - 상대방 메시지가 Realtime으로 추가될 때 화면이 맨 아래로 자동 스크롤되지 않던 문제 수정
  - `previousLastMessageIdRef`로 마지막 메시지 ID를 추적해 새 메시지가 추가됐을 때만 하단 스크롤 실행
  - loadMore(이전 메시지 추가 로드) 시에는 스크롤 위치 보정 로직 그대로 유지
- 채팅방 fullscreen route group 분리
  - `/messages` 대화 목록은 `(main)` 레이아웃 유지
  - `/messages/[conversationId]` 채팅방은 `(fullscreen)`으로 이동해 하단 탭바/사이드바 제거
  - 채팅방 root를 `h-dvh` 기반 전용 화면으로 변경하고 메시지 영역만 스크롤되도록 조정
  - 뒤로가기 버튼은 항상 `/messages`로 이동하도록 변경
- 채팅 전송 후 모바일 키보드 깜빡임 완화
  - 입력창 focus를 이미 활성 상태일 때는 다시 호출하지 않도록 조건부 처리
  - 전송 핸들러의 직접 `scrollIntoView` 호출 제거
  - 전송 성공 후 대화 목록 `reload()` 대기를 제거하고 메시지 변경 effect에 스크롤 책임 집중

## 2026-05-31

### 완료
- 채팅 연속 전송 UX 개선
  - 메시지 전송 요청 완료를 기다리지 않고 입력창을 즉시 비우도록 변경
  - 전송 중에도 textarea/전송 버튼을 잠그지 않아 여러 메시지를 연속 입력/전송 가능
  - 기존 낙관적 메시지/실패 처리 흐름은 유지

## 2026-05-27

### 완료
- **users 테이블 RLS 활성화 + 민감 컬럼 보호** (보안 취약점 수정)
  - 기존 문제: RLS 비활성화 상태 → anon key REST 직접 호출로 모든 유저 이메일/실명/role 노출
  - 기존 문제: `users_update_own` 정책에 컬럼 제한 없어 자가 admin 승격 등 가능
  - 적용:
    - RLS 활성화 (`relrowsecurity = true`)
    - `users_select`: 로그인 유저는 활성 유저(`deleted_at IS NULL`) 조회 가능 — 재귀 없는 단순 정책
    - `users_select_own`: 본인은 deleted_at 무관 조회 (탈퇴 복구 흐름 대비)
    - `users_update_own`: 본인 row만 UPDATE
    - `prevent_sensitive_user_update()` BEFORE UPDATE 트리거 — 민감 컬럼 변경 차단
  - 차단 컬럼: `role`, `university_id`, `is_active`, `email`, `real_name`, `credit_balance`, `level`, `level_score`, `created_at`
  - 부분 허용: `is_onboarded` (false → true 1회만, 온보딩 완료용)
  - bypass: `auth.uid() IS NULL`이면 트리거 통과 (handle_new_user, service_role, postgres 직접 접근)
  - 검증: RLS 활성화 ✓, 정책 3개 ✓, 트리거 1개 ✓
  - migration 파일: `supabase/migrations/20260527150000_enable_users_rls_with_sensitive_column_protection.sql`
- Supabase migration 로컬 파일 정리
  - `npx supabase login` + `supabase link` + `supabase db pull`로 `supabase/migrations/` 폴더 생성
  - db pull로 누락된 4개 migration 파일 수동 생성 (DB에서 DDL 직접 추출하여 동일하게 작성)
    - `20260521014413_create_user_connections.sql`
    - `20260521014544_create_notification_triggers.sql`
    - `20260520064729_create_admin_rpc_functions.sql`
    - `20260527015619_create_chat_tables.sql`
  - DB 재생성/복구 시 로컬 파일로 스키마 재현 가능한 상태
- 1:1 채팅 기능 1차 구현
  - `conversations`, `messages` 타입 및 채팅 RPC 타입 반영
  - `features/chat/api.ts` 추가 (`getOrCreateConversation`, 목록/메시지 조회, 전송, 읽음 처리, 요청 수락, 안읽은 수)
  - `features/chat/hooks.ts` 추가 (메시지/대화 목록 Realtime 구독 및 cleanup)
  - `components/chat/` UI 추가 (`ConversationItem`, `MessageBubble`, `MessageInput`)
  - `/messages`, `/messages/[conversationId]` 라우트 추가
  - 프로필 페이지 "메시지 보내기" 버튼 연결
  - 사이드바/모바일 헤더 메시지 링크를 `/messages`로 연결하고 안읽은 메시지 뱃지 표시
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 채팅 실시간 업데이트 및 시간 표시 개선
  - 대화 목록 Realtime/chat refresh 갱신 시 로딩 스켈레톤 없이 조용히 갱신하도록 분리
  - 사이드바 메시지 뱃지를 30초 polling 대신 conversations Realtime UPDATE 구독으로 즉시 갱신
  - 채팅용 KST 시간 포맷(`formatChatTime`) 추가
  - 메시지 시간/읽음 상태를 hover 시에만 표시하도록 변경
  - 메시지 간 5분 이상 차이가 날 때 시간 구분선 표시
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 채팅 UI 추가 개선
  - 메시지 간격 축소 (`space-y-3` → `space-y-0.5`)
  - MessageBubble 시간 표시를 말풍선 아래(height 차지)에서 옆 flex 레이아웃으로 변경 — 가로 overflow 없이 빈 공간에 표시
  - 채팅방 `overflow-x-hidden` 추가로 가로 스크롤 방지
  - NavItems Realtime 채널 이름 중복 버그 수정 (`"nav:conversations"` → `"nav:conversations:${Date.now()}"`) — React StrictMode 이중 마운트로 인한 에러
- 채팅 메시지 페이지네이션 구현
  - `getMessages`를 DESC+reverse 방식으로 변경 — 항상 최신 50개를 가져와 오름차순 표시
  - `before` cursor 파라미터 추가 — 특정 시점 이전 메시지 조회 지원
  - `useMessages` 훅에 `hasMore`, `isLoadingMore`, `loadMore` 추가
  - 채팅방 상단 스크롤 감지 시 이전 메시지 자동 로드 (prepend)
  - prepend 후 scrollHeight 차이만큼 scrollTop 보정 — 스크롤 위치 튀는 현상 방지
  - "이전 메시지 불러오는 중..." / "첫 번째 메시지입니다." UI 추가
- 채팅 메시지 낙관적 전송 처리
  - 전송 즉시 임시 메시지를 목록 끝에 추가하고 성공 시 실제 메시지로 교체
  - Realtime INSERT 수신 시 동일 발신자/내용의 낙관적 메시지를 실제 메시지로 대체해 중복 표시 방지
  - 전송 실패 시 임시 메시지 제거, 성공 후에만 대화 목록 reload 실행
  - 낙관적 메시지는 흐리게 표시해 전송 중 상태 구분
- 채팅 전송 후 UX 버그 수정
  - 메시지 전송 완료 후 입력창 포커스 유지
  - 전송 성공 및 대화 목록 갱신 후 채팅방 하단으로 부드럽게 스크롤
- 채팅 Realtime 미수신 원인 수정
  - `messages` INSERT 구독 filter에 UUID가 섞여 `conversation_id` 매칭이 실패하던 문제 수정
  - 채널 이름만 UUID로 유니크하게 유지하고 filter는 `conversation_id=eq.{id}`로 복구
  - `messages`, `conversations` 테이블을 `supabase_realtime` publication에 등록하는 migration 추가

## 2026-05-26

### 완료
- 개발 환경 안정화
  - `C:\Users\PC\.wslconfig` 신규 생성 (`memory=8GB`, `processors=4`)
  - `package.json` dev 스크립트에 `NODE_OPTIONS=--max_old_space_size=4096` 추가
- 코드 정리
  - 미사용 중복 파일 3개 삭제 (auth alias login/signup, 구버전 posts/write)
  - `getFeed` 기본 조회 limit `3` → `20` 복구
- 스토리 뷰어 이미지 비율 판정
  - `onLoad`에서 `naturalHeight > naturalWidth` 판정
  - 세로 사진은 `object-cover`로 꽉 채우고, 가로/정사각형은 `object-contain` + 블러 배경 유지
- 스토리 목록 정렬 개선
  - `getStories()`에서 accepted 상태 `user_connections`를 조회해 크루 ID Set 생성
  - 친구 조회 실패 시 빈 목록 fallback으로 스토리 로딩은 계속 진행
  - 스토리바 정렬을 내 스토리 → 크루 → 같은 학교 나머지 순서로 변경
- 크로스 유저 스토리 네비게이션 구현
  - StoryBar에서 정렬된 유저 ID 목록을 `users` 쿼리로 스토리 뷰어에 전달
  - 스토리 뷰어에서 마지막/첫 스토리 이동 시 다음/이전 유저 스토리로 이동
  - 데스크톱 사이드 프리뷰 카드 및 `getStoryPreview()` API 추가
  - 진행 타이머의 Router 업데이트를 `setTimeout(0)` 경유로 처리
- 스토리 뷰어 레이아웃 보정
  - 메인 스토리를 중앙 고정하는 3열 그리드 구조로 변경
  - 이전/다음 화살표를 absolute 오버레이에서 좌우 열 내부 버튼으로 이동
  - 프리뷰가 없는 경우에도 좌우 열 공간을 유지하도록 배치 조정
- 문서 최신화
  - 코드 기준으로 `AGENTS.md`, `docs/PLAN.md`, `docs/WORKLOG.md` 현재 상태 반영

## 2026-05-25

### 완료
- React 19/Next 16 hook lint 에러 수정
  - `/search` 최근 검색 초기화를 `useState` lazy initializer로 변경
  - 메인 레이아웃 알림 패널 닫힘 상태를 pathname 기반으로 계산하도록 조정
  - 프로필 편집 닉네임 상태 업데이트를 effect 내부 타이머 콜백으로 이동하고 `initialNickname` 의존성 추가
  - 관리자 대시보드/신고/유저 목록 로드 함수를 `useCallback`으로 고정하고 effect 초기 호출을 타이머 콜백으로 지연
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 크루 목록 및 요청 관리 페이지 구현
  - `get_friends`, `get_pending_requests`, `get_sent_requests` RPC 마이그레이션 추가
  - `src/features/profile/api.ts`에 크루 목록/받은 요청/보낸 요청 조회 함수 추가
  - `/profile/connections` 페이지 추가 (내 크루/받은 요청/보낸 요청 탭, 수락/거절/삭제/취소 액션)
  - 본인 프로필의 크루 수 클릭 시 `/profile/connections`로 이동하도록 연결
- Supabase RPC 직접 적용 (마이그레이션 파일만 있었고 미적용 상태였음)
  - `get_friends`, `get_pending_requests`, `get_sent_requests` Supabase에 직접 실행
- 화면 동작 확인 완료 (내 크루 / 받은 요청 / 보낸 요청 / 수락·거절·취소·삭제 액션)
- 개발 환경 WSL2(Ubuntu)로 전환 완료
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과

## 2026-05-21

### 완료
- 유저 연결 모델 전환 (`user_likes` → `user_connections`)
  - `user_connections` 테이블 신규 (`requester_id`, `receiver_id`, `status: pending/accepted/rejected`)
  - `send_friend_request`, `accept_friend_request`, `reject_friend_request`, `remove_friend`, `get_connection_status` RPC 생성
  - `trg_notify_friend_request` 트리거 (신청/수락 알림)
  - `notifications` type CHECK 제약에 `friend_request`, `friend_accepted` 추가
  - `users` 테이블에 `credit_balance`, `level`, `level_score` 컬럼 추가 (크레딧/레벨 시스템 대비)
- 프로필 페이지 친구 시스템 UI 적용
  - 상태별 버튼 분기 (`none` / `pending` / `accepted`)
  - 친구 수 표시 및 낙관적 업데이트/실패 롤백 처리
- 알림 타입 전환
  - `user_like` 제거
  - 알림 패널 친구 신청/수락 문구 추가

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
- 메인 화면 껍데기 구현
  - `src/components/layout/Header.tsx` 추가 (모바일 전용: 로고, 알림, 채팅)
  - `src/components/layout/BottomTabBar.tsx` 추가 (모바일 전용: 홈, 검색, 글쓰기, 카테고리, 프로필)
  - `src/components/layout/SideBar.tsx` 추가 (웹 전용: 로고, 홈, 검색, 카테고리, 프로필, 채팅, 알림)
  - `src/app/(main)/layout.tsx` 추가 (모바일/웹 반응형 메인 레이아웃)
  - `src/app/(main)/page.tsx` 추가 (빈 피드 상태)
  - 기존 `src/app/page.tsx` 제거 후 메인 라우트를 `(main)` 그룹으로 이동
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 학교 이메일 인증 기본 흐름 구현
  - `@supabase/ssr`, `@supabase/supabase-js` 설치
  - `src/lib/supabase/browser.ts` 추가 (브라우저용 Supabase 클라이언트)
  - `src/lib/supabase/server.ts` 추가 (server component / route handler용 클라이언트)
  - `src/features/auth/api.ts` 추가
    - 이메일 도메인 추출
    - `universities` 조회
    - 매직링크 발송
    - `users.is_onboarded` 조회
  - `src/middleware.ts` 추가
    - 비로그인 유저 ` /auth/login ` 리다이렉트
    - 로그인 + 미온보딩 유저 ` /onboarding ` 리다이렉트
    - `/auth/*`, `/onboarding` 예외 처리
  - `src/app/(auth)/auth/login/page.tsx` + `LoginForm.tsx` 추가
    - 학교 이메일 입력
    - 등록된 도메인만 매직링크 발송
    - 미등록 도메인 에러 표시
  - `src/app/(auth)/auth/callback/route.ts` 추가
    - 매직링크 코드 교환
    - 온보딩 여부에 따라 `/` 또는 `/onboarding` 이동
  - `src/app/onboarding/page.tsx` 추가 (임시 placeholder)
- 로그인 방식 조정
  - `signInWithOtp`에 `shouldCreateUser: true` 추가
  - `emailRedirectTo`를 `http://localhost:3000/auth/callback`으로 고정
  - Confirm email이 꺼진 환경에서 비밀번호 없이 즉시 로그인 가능한 OTP 흐름으로 조정
- 개발 환경 미들웨어 인증 체크 임시 비활성화
  - `src/middleware.ts`에서 `NODE_ENV === 'development'`면 인증/온보딩 체크 없이 통과
  - 프로덕션 환경에서는 기존 인증 체크 유지
- 웹 사이드바 게시물 작성 버튼 추가
  - `src/components/layout/SideBar.tsx` 하단에 `+ 새 게시물` 버튼 추가
  - 클릭 시 `/posts/write`로 이동하도록 메인 레이아웃에서 props 전달
- 스토리바 컴포넌트 추가
  - `src/components/story/StoryItem.tsx` 추가 (아바타, 이름, viewed 상태별 테두리)
  - `src/components/story/StoryBar.tsx` 추가 (가로 스크롤 목록, 첫 슬롯 `내 스토리`)
  - `src/app/(main)/page.tsx` 상단에 스토리바 배치
- 스토리바 더미 데이터 제거
  - `src/app/(main)/page.tsx`의 하드코딩 스토리 배열 제거
  - `StoryBar`는 `stories` props만 받아 렌더링하고, 빈 배열이면 `내 스토리`만 표시
  - 실제 스토리 데이터는 추후 `features/story/api.ts`에서 주입 예정
- 스토리바 `내 스토리` 버튼 링크화
  - `src/components/story/StoryBar.tsx`의 `MyStoryItem`을 `Link`로 변경
  - 클릭 시 `/story/create`로 이동하고 클릭 커서를 표시하도록 수정
- 게시물 이미지 업로더 컴포넌트 추가
  - `src/components/feed/PostImageUploader.tsx` 추가
  - 다중 사진 선택, 최대 10장 제한, 선택 이미지 미리보기, 삭제 버튼 구현
  - `images` / `onImagesChange` props만으로 동작하도록 구성
- 게시물 작성 페이지 추가
  - `src/app/(main)/posts/write/page.tsx` 추가
  - 상단 헤더, 이미지 업로더, 내용 textarea, 공개 범위 토글, 해시태그 입력 UI 구현
  - 게시 버튼 클릭 시 `{ images, content, visibility, hashtags }`를 `console.log`로 출력
- 게시물 작성 저장 로직 연결
  - `src/features/feed/api.ts` 추가
  - `post-images` Storage 업로드, `posts` / `post_images` / `post_hashtags` 저장 로직 구현
  - 현재 로그인 유저의 `university_id` 조회 후 게시물 저장하도록 연결
  - 미로그인/학교 정보 없음/저장 실패 시 에러 처리 추가
  - 게시 중 로딩 상태 표시, 저장 완료 후 `/`로 이동
  - 공개 범위 UI는 화면에서 숨기고 `visibility`는 현재 `public`으로 고정
- 인증/온보딩 비밀번호 기반 흐름으로 전환
  - `src/app/(auth)/auth/login/page.tsx`, `LoginForm.tsx` 수정
  - 매직링크 UI 제거 후 이메일 + 비밀번호 로그인(`signInWithPassword`)으로 변경
  - 로그인 성공 시 `/` 이동, `/auth/signup` 링크 추가
  - `src/app/(auth)/auth/signup/page.tsx`, `SignupForm.tsx` 추가
  - 국민대 이메일(`kookmin.ac.kr`) 검증 후 `signUp`으로 회원가입, 성공 시 `/onboarding` 이동
  - `src/app/onboarding/page.tsx` 수정
  - 닉네임/학과 입력, `users` 테이블 `nickname`, `department`, `is_onboarded=true` 업데이트 후 `/` 이동
  - 인증/온보딩 로직을 `src/features/auth/api.ts`로 정리
- 미들웨어 인증 체크 재활성화
  - `src/middleware.ts`의 개발 환경 우회 코드 제거
  - 비로그인 유저는 `/auth/login`으로 리다이렉트
  - 로그인 완료 + 미온보딩 유저는 `/onboarding`으로 리다이렉트
  - 예외 경로는 `/auth/login`, `/auth/signup`, `/auth/callback`, `/onboarding`만 유지
- 피드 조회 API 1차 추가
  - `src/features/feed/api.ts`에 `getFeed` 함수 추가
  - 현재 로그인 유저의 `university_id` 기준으로 `posts`를 최신순 조회
  - `users`, `post_images`, `post_hashtags`, `hashtags` 데이터를 배치 조회해 `FeedPost[]` 형태로 조립
  - `deleted_at IS NULL`, 기본 `limit=20`, `created_at` 커서 기반 `nextCursor` 반환 처리
- 피드 게시물 카드 컴포넌트 추가
  - `src/components/feed/PostCard.tsx` 추가
  - 아바타/닉네임/학과/상대 시간/더보기 버튼을 포함한 카드 헤더 구현
  - 이미지 스와이프 영역과 페이지 인디케이터 구현
  - 좋아요/댓글/북마크 버튼과 카운트, 본문, 해시태그 표시 구현
  - 실제 동작은 props 콜백만 연결하고 Supabase 쿼리는 포함하지 않음
- 피드 목록 컴포넌트 추가
  - `src/components/feed/FeedList.tsx` 추가
  - `PostCard` 목록 렌더링, 빈 상태 문구, 로딩 스켈레톤 UI 구현
  - 실제 데이터 조회 없이 props만 받아 동작하도록 구성
- 메인 피드 페이지 연결
  - `src/app/(main)/page.tsx`를 client component로 전환
  - `getFeed()` 호출 후 `FeedList`에 `posts`, `isLoading` 전달
  - 좋아요/댓글/북마크 액션은 임시로 `console.log` 콜백 연결
  - 피드 조회 실패 시 에러 메시지 표시하도록 처리
- 피드 이미지/웹 사이드바 레이아웃 보정
  - `src/components/feed/PostCard.tsx`의 이미지 영역을 정사각형 비율로 유지하면서 최대 크기를 제한
  - 이미지에 `object-cover`를 유지하고 카드 안에서 가운데 정렬되도록 조정
  - `src/components/layout/SideBar.tsx`를 `justify-between` 구조로 변경해 메뉴는 상단, `+ 새 게시물` 버튼은 하단에 고정
- 메인 피드 디자인 밀도 조정
  - `src/app/(main)/layout.tsx`의 전체 배경을 흰색으로 통일하고 피드 최대 폭을 약 470px로 축소
  - 메인 레이아웃과 우측 패널의 경계선 성격 요소를 제거해 화면을 단순화
  - `src/components/feed/PostCard.tsx`에서 이미지 좌우 패딩과 둥근 모서리를 제거하고 카드 폭 전체를 쓰는 1:1 이미지로 조정
  - `src/components/story/StoryBar.tsx`의 배경을 흰색으로 유지하고 구분선을 제거
- 웹 사이드바 고정 처리
  - `src/components/layout/SideBar.tsx`에 `sticky`, `top-0`, `h-screen` 기준 레이아웃을 적용
  - 피드 스크롤 시에도 사이드바는 화면 왼쪽에 고정되도록 조정

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
- [ ] 온보딩 페이지 구현 (학교, 학과, 닉네임 저장)
- [ ] 가입 시 `users.university_id`를 실제 이메일 도메인 기준으로 반영하도록 보완
- [ ] 피드 기능 설계 및 `features/feed` 구조 초안 작성

## 2026-04-28

### 완료
- PostCard 이미지 슬라이드 좌우 화살표 추가
  - `src/components/feed/PostCard.tsx`에서 이미지가 2장 이상일 때만 이전/다음 버튼 표시
  - 첫 이미지에서는 왼쪽 버튼, 마지막 이미지에서는 오른쪽 버튼을 숨기도록 처리
  - 버튼 클릭 시 현재 카드 폭 기준으로 이전/다음 이미지로 부드럽게 이동
- 메인 피드 무한 스크롤 구현
  - `src/app/(main)/page.tsx`에서 `posts`, `nextCursor`, `isLoadingMore` 상태를 관리하고 `IntersectionObserver`로 다음 페이지 자동 로드
  - `src/features/feed/api.ts`의 기본 조회 개수를 테스트용 3개로 임시 조정하고 복구 TODO 주석 추가
  - `src/components/feed/FeedList.tsx`에 추가 로딩 표시(`더 불러오는 중...`) props 연결
- 메인 피드 화면 연결 완료
  - `src/app/(main)/page.tsx`에서 `getFeed()` 호출 후 `FeedList`로 데이터 전달
  - 로딩 상태, 에러 메시지, 좋아요/댓글/북마크 임시 `console.log` 콜백 연결
- 피드 레이아웃 및 카드 크기 조정
  - `src/app/(main)/layout.tsx`의 메인 피드 최대 폭을 약 470px로 축소
  - `src/components/feed/PostCard.tsx` 이미지 영역을 카드 폭 전체를 쓰는 1:1 비율로 조정
  - `src/components/story/StoryBar.tsx` 구분선 제거 및 배경 단순화
- 웹 사이드바 고정 및 작성 버튼 위치 보정
  - `src/components/layout/SideBar.tsx`를 `justify-between` 구조로 변경
  - `+ 새 게시물` 버튼이 항상 하단에 보이도록 수정
  - 사이드바에 `sticky`, `top-0`, `h-screen`을 적용해 스크롤 시에도 고정되도록 조정
- 운영 문서 및 코드 주석 정리
  - `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/WORKLOG.md` 최신 상태 반영
  - 피드/레이아웃/미들웨어 관련 핵심 파일에 역할 및 주요 로직 주석 추가
- 인증/스토리/Supabase 유틸 주석 보강 및 전체 정리
  - `src/app/(auth)/`, `src/app/(main)/`, `src/app/onboarding/` 하위 주요 페이지에 한국어 주석 추가
  - `src/components/feed/PostImageUploader.tsx`, `src/components/story/` 전체에 props/역할/핵심 흐름 주석 추가
  - `src/features/auth/api.ts`, `src/lib/supabase/`, `src/types/database.types.ts`, `src/middleware.ts` 주석 보강
  - 전체 변경분 기준으로 문서 동기화 후 커밋/푸시 준비

## 2026-05-09

### 완료
- 댓글 바텀시트 UI 및 피드 연결
  - `src/components/feed/CommentSheet.tsx` 신규 추가
  - 댓글 목록/작성/삭제 UI와 로딩/빈 상태 처리
  - 메인 피드 댓글 버튼 클릭 시 바텀시트 열기 및 댓글 수 즉시 동기화
- 댓글 API 1차 구현
  - `src/features/comments/api.ts` 신규 추가
  - `getComments`, `createComment`, `deleteComment` 구현
  - 댓글 작성/삭제 시 `posts.comments_count` 증감 처리 및 soft delete 적용
- `database.types.ts` 수동 교체 및 `post_likes` 타입 정상화
  - `src/types/database.types.ts`에 `post_likes` 포함 최신 public 스키마 타입 반영
  - `src/features/feed/api.ts`의 post_likes 타입 우회 코드 제거
  - `togglePostLike`, `getLikedPostIds`를 `supabase.from("post_likes")` 직접 호출로 정리
- 게시물 좋아요 토글 기능 구현
  - `src/features/feed/api.ts`에 `togglePostLike`, `getLikedPostIds` 추가
  - 메인 피드에서 좋아요 상태를 초기 조회하고 낙관적 업데이트 후 서버 응답으로 동기화
  - `PostCard` 하트 아이콘을 좋아요 여부에 따라 채움/비움으로 표시
- Supabase 프로젝트 복구 (INACTIVE → ACTIVE)
- AGENTS.md 업데이트 (Next.js 16, Supabase 프로젝트 ID, 현재 진행상황 반영)
- 노션 로드맵 업데이트 (관리자 페이지 설계 추가, Sprint 계획 갱신)
- 무한 스크롤 구현 (IntersectionObserver + cursor 페이지네이션 + isLoadingMore 상태, 테스트용 limit=3)
- PostCard 이미지 슬라이드 화살표 버튼 추가 (2장 이상일 때만 표시, 첫/마지막에서 해당 방향 숨김, smooth 스크롤)

### 주요 결정사항
- 관리자 페이지 MVP에 포함 (비개발자 UI, 전체 학교 조회)
- 이미지 처리/최적화는 배포 전 일괄 처리
- 사진 비율 선택은 추후 추가

## 2026-05-10

### 완료
- 대댓글 1단계 중첩 기능 구현
  - `comments.deleted_at` 제거에 맞춰 댓글 API를 hard delete 방식으로 변경
  - `getComments`가 부모 댓글 최신순, 대댓글 오래된순 중첩 구조를 반환하도록 수정
  - `CommentSheet`에 답글 보기 토글, 답글 대상 표시/취소, 대댓글 작성/삭제/좋아요 UI 연결
- 댓글 좋아요 기능 구현
  - `src/types/database.types.ts`의 `comments` 타입에 `likes_count` 반영
  - `src/features/comments/api.ts`에 `toggleCommentLike`, `getLikedCommentIds` 추가
  - `src/components/feed/CommentSheet.tsx`에서 댓글 좋아요 상태 조회, 하트 UI, 낙관적 업데이트 및 실패 롤백 처리

## 2026-05-10

### 완료
- 성능 인덱스 6개 Supabase에 추가
  - idx_comments_post_id (댓글 게시물별 조회)
  - idx_post_images_post_id (이미지 게시물별 조회)
  - idx_posts_university_created (피드 학교별 최신순)
  - idx_posts_user_created (프로필 유저별 최신순)
  - idx_post_likes_target_id (좋아요 목록 게시물별)
  - idx_notifications_user_created (알림 유저별 최신순)
- 댓글 좋아요 기능 구현
  - toggleCommentLike, getLikedCommentIds 추가 (features/comments/api.ts)
  - 모든 댓글에 하트 + likes_count 표시 (본인 댓글도 포함)
  - 낙관적 업데이트 + 실패 시 롤백
- 대댓글 구현
  - 1단계 중첩 구조 (대댓글에 대댓글 없음)
  - 답글 달기 버튼 + @닉네임 자동 입력
  - 답글 N개 보기/숨기기 토글
  - 대댓글도 좋아요/삭제 가능
- 댓글 hard delete로 전환
  - deleted_at 컬럼 제거
  - 부모 댓글 삭제 시 대댓글 cascade 삭제
  - comment_likes cascade 삭제
- 댓글 UI 개선
  - 댓글 간격 축소
  - 대댓글 왼쪽 세로 막대기 제거
  - 답글 숨기기 버튼 대댓글 아래로 이동
- 본문 더보기/접기 버튼 구현 (PostCard.tsx)
  - 2줄 초과 시 말줄임 + ...더보기 버튼 표시
  - 펼친 상태에서 접기 버튼 표시
  - 본문 텍스트 색상 text-zinc-950으로 변경

### 트러블슈팅
- comments UPDATE RLS 정책 누락 → likes_count 업데이트 실패 → 정책 추가
- hard delete 전환 시 deleted_at 참조 RLS 정책 충돌 → 정책 재설계

### 다음 작업
- [ ] PostCard ... 버튼 메뉴 (본인: 수정/삭제 / 타인: 신고/차단)
- [ ] 좋아요 목록 모달
- [ ] 스토리
- [ ] 프로필 페이지
- [ ] 관리자 페이지

## 2026-05-11

### 완료
- 게시물 수정 모드 구현
  - `/posts/write?postId=...` 진입 시 기존 게시물 content, hashtags, images 조회
  - 수정 모드 타이틀을 `게시물 수정`으로 변경
  - 기존 이미지는 읽기 전용으로 표시하고 사진 수정은 비활성화
  - content, hashtags만 업데이트하도록 `updatePost` 연결
- 게시물 상세 조회 API 추가
  - `getPost(postId)`로 수정 화면에 필요한 content, hashtags, images 반환
  - 해시태그 저장/교체 로직을 공통 함수로 정리

## 2026-05-11

### 완료
- 시스템 폰트 적용 (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Noto Sans KR)
- PostCard ... 버튼 메뉴 구현
  - ActionSheet 공용 컴포넌트 신규 생성 (src/components/common/ActionSheet.tsx)
  - 본인 게시물: 수정 / 삭제 / 링크 복사 / 취소
  - 타인 게시물: 신고 / 차단 / 링크 복사 / 취소
  - 신고/차단은 console.log (추후 구현)
- 게시물 수정 모드 구현
  - getPost, updatePost 함수 추가 (features/feed/api.ts)
  - /posts/write?postId=xxx 수정 모드 분기
  - 기존 내용/해시태그 미리 채워짐, 사진은 읽기 전용
- 게시물 삭제 구현 (soft delete)
  - deletePost 함수 추가 (features/feed/api.ts)
  - 삭제 후 피드에서 즉시 제거
- 토스트 메시지 컴포넌트 구현 (src/components/common/Toast.tsx)
  - 하단 중앙 고정, 3초 후 자동 사라짐
  - success/error 두 가지 타입
- 토스트 PostCard 연결
  - 삭제 성공/실패, 링크 복사 시 토스트 표시
- 게시물 작성/수정 완료 토스트 (피드에서 표시)
  - 작성/수정 완료 후 쿼리 파라미터로 피드에 전달
  - 피드 page.tsx에서 토스트 표시 후 URL 정리
- 스토리 작성 1차 구현
  - story-images Storage 업로드 API 추가 (features/stories/api.ts)
  - stories 테이블 insert 및 24시간 expires_at 설정
  - /story/create 페이지 추가 (사진 1장 선택, 세로 미리보기, 공유하기)
  - 공유 완료 후 피드에서 "스토리가 공유됐습니다" 토스트 표시
- 스토리바 실제 데이터 조회 연결
  - `getStories` 추가 (같은 학교, 만료 전, 삭제되지 않은 스토리 조회)
  - 유저별 스토리 그룹핑 및 `story_views` 기반 `hasUnviewed` 계산
  - 본인 스토리 우선 표시, StoryBar 내부 조회 및 `/story/[userId]` 이동 연결
- 스토리 뷰어 구현
  - `getUserStories`, `recordStoryView`, `getStoryViewers` 추가 (features/stories/api.ts)
  - `/story/[userId]` 전체화면 뷰어 추가 (5초 자동 진행, 진행 바, 좌우 이동, 닫기)
  - 타인 스토리 진입 시 `story_views` 기록 및 조회수 증가
  - 본인 스토리에서 조회자 수와 조회자 목록 바텀시트 표시
- 토스트 메시지 컴포넌트 구현 (src/components/common/Toast.tsx)
- 토스트 PostCard/피드 연결 (삭제/링크복사/수정완료/작성완료)
- 스토리 업로드 구현 (src/app/(main)/story/create/page.tsx)
- 스토리 API 구현 (src/features/stories/api.ts)
  - uploadStoryImage, createStory, getStories, getUserStories
  - recordStoryView, toggleStoryLike, getMyStoryLikedStatus
  - getStoryViewers (조회자별 isLiked 포함), deleteStory
- 스토리바 구현 (StoryBar.tsx 수정)
- 스토리 뷰어 구현 (src/app/(main)/story/[userId]/page.tsx)
  - 9:16 비율, 블러 배경, 5초 자동 넘김, 일시정지
  - 진행바, 화살표 네비게이션
  - 본인: 조회수 + 조회자 바텀시트 (좋아요 여부 포함)
  - 타인: 하트 좋아요 버튼
  - X 버튼 화면 우측 상단, ... 버튼 (본인: 삭제 / 타인: 신고)

### 트러블슈팅
- posts UPDATE 정책 with_check 누락 → 삭제 실패 → 수정
- posts SELECT 정책 deleted_at IS NULL 조건이 soft delete UPDATE 차단 → 본인 게시물은 deleted_at 무관하게 SELECT 가능하도록 정책 수정
- stories UPDATE RLS 정책 with_check 누락 → 수정
- 스토리 비율/블러배경 렌더링 수정 여러 차례

### 다음 작업
- [ ] 토스트 메시지 PostCard 연결 완료
- [ ] 좋아요 목록 모달
- [ ] 스토리
- [ ] 프로필 페이지
- [ ] 관리자 페이지

## 2026-05-12

### 완료
- stories SELECT RLS 정책 수정 (soft delete 호환 — 본인 스토리는 deleted_at 무관 SELECT 가능)
- 스토리 삭제 확인 다이얼로그 구현 (ConfirmDialog 공용 컴포넌트 신규)
  - ActionSheet → ConfirmDialog 2단계 흐름
  - 게시물 삭제/로그아웃/신고에도 재사용 예정
- ActionSheet/ConfirmDialog/ViewerSheet 열릴 때 스토리 타이머 멈춤, 닫을 때 재개
- 스토리 뷰어 종료 시 refreshStories 파라미터로 StoryBar 새로고침
- users 테이블 bio 컬럼 추가 (프로필 소개글)
- users 테이블 nickname UNIQUE 제약 추가
- database.types.ts bio 컬럼 반영

### 트러블슈팅
- stories soft delete 시 SELECT 정책 위반으로 403 발생 → posts와 동일한 패턴으로 정책 수정
- users RLS 활성화 시도 → 재귀 문제로 일시 롤백, 배포 전 재설계 필요

### 다음 작업
- [ ] 온보딩 닉네임 중복 체크 추가
- [ ] 프로필 페이지 /profile/[nickname]
- [ ] 프로필 편집 페이지 (닉네임/소개/프로필사진 + 로그아웃)
- [ ] 사이드바/탭바 프로필 버튼 연결

## 2026-05-16

### 완료
- users 테이블 bio, real_name 컬럼 추가
- users 테이블 nickname UNIQUE 제약 추가
- database.types.ts bio, real_name 반영
- feed/api.ts users select 불필요한 컬럼 제거 (id, nickname, department, avatar_url 4개만)
- auth/api.ts getCurrentUserProfile real_name, bio select 추가
- 프로필 페이지 구현 (/profile/[nickname])
  - getProfile, getProfilePosts, getPostsCount (features/profile/api.ts 신규)
  - 프로필 헤더, 게시물 3열 그리드, 본인/타인 분기
  - /profile/me 자동 리다이렉트
- NavItems 컴포넌트 신규 생성 (클라이언트 컴포넌트로 분리)
  - usePathname()으로 현재 경로 감지, 사이드바/탭바 활성화 표시
- 사이드바 border-r 제거
- lucide-react 설치 및 아이콘 적용
  - 알림: Bell 아이콘
  - 메시지: MessageCircleMore 아이콘
  - 채팅 → 메시지로 명칭 변경
- Avatar 공용 컴포넌트 신규 생성 (src/components/common/Avatar.tsx)
  - 회색 실루엣 기본 이미지, xs/sm/md/lg/xl 5가지 사이즈
  - 피드/댓글/스토리바/스토리뷰어/프로필 전체 적용
- 사이드바/탭바 프로필 아이콘 → 본인 프로필 사진으로 변경

### 트러블슈팅
- lucide-react를 서버 컴포넌트(layout.tsx)에서 import 시 createContext 에러 → 클라이언트 컴포넌트(NavItems.tsx)로 이동
- users RLS 활성화 시도 → 재귀 문제로 롤백
- gmail 계정에 국민대 닉네임이 저장된 문제 → 세션 꼬임으로 발생, DB 직접 수정

### 다음 작업
- [ ] 회원가입 플로우 재설계 (이메일 → 인증 → 비밀번호+닉네임+이름+학과)
- [ ] 온보딩 닉네임 중복 체크
- [ ] 프로필 편집 페이지 (닉네임/소개/프로필사진 + 로그아웃)
- [ ] 스토리 UI/UX 개선
- [ ] 좋아요 목록 모달
- [ ] 관리자 페이지

## 2026-05-18

### 완료
- 프로필 편집 페이지 구현 (src/app/(main)/profile/edit/page.tsx 신규)
  - 프로필 사진 변경 (avatars 버킷 업로드, 카메라 아이콘 오버레이)
  - 닉네임 수정 (대소문자 입력 허용, 저장 시 소문자 변환)
  - 닉네임 실시간 중복 체크 (debounce 300ms, 본인 닉네임 제외)
  - 소개(bio) 수정 (최대 150자)
  - 학과 표시만 (수정 불가)
  - 프로필 편집 버튼 연결 (/profile/edit으로 이동)
- features/profile/mutations.ts 신규 생성
  - updateProfile, checkNicknameDuplicate, uploadAvatar 함수
  - features/profile/api.ts에서 분리
- features/auth/api.ts에 signOut() 추가
- 전체 button 태그에 cursor-pointer 전역 적용 (globals.css)
- 프로필 편집 버튼 UI 수정 (검은색 → 회색 테두리)
- 설정 페이지 신규 (/settings)
  - ChevronLeft 뒤로가기, 프로필 편집 이동, 공지사항/문의하기 비활성, 로그아웃 ConfirmDialog
- 헤더 이중 렌더링 버그 수정
  - `(sub)` route group 분리 → `/settings`, `/profile/edit`에서 UNIVER 헤더 제거
  - 스크롤 시 헤더 침범 현상 해결
- 프로필 페이지 설정 아이콘(톱니바퀴) 추가 → /settings 이동
- 프로필 편집 로그아웃 버튼 제거
- 게시물 상세 모달 구현 (PostDetail.tsx + Intercepting Routes)
  - `@modal/(.)posts/[postId]` — 프로필/피드에서 모달
  - `(sub)/posts/[postId]` — 직접 URL 접근 시 풀페이지
  - 웹 좌우 2단, 인스타 방식 (본문+댓글 스크롤, 좋아요+입력 하단 고정)
  - 피드 댓글 버튼 → PostDetail 모달 연결
- 피드 이미지 원본 비율로 변경 (PostCard.tsx)
  - aspect-square 제거, object-contain, 배경 검정
  - 프로필 썸네일 1:1 유지
- UserInfo 공용 컴포넌트 신규 (`src/components/common/UserInfo.tsx`)
  - 아바타 + 닉네임 → `/profile/${nickname}` Link
  - PostCard, PostDetail, CommentSheet, PostDetail CommentsList 적용
- 학과(department) 표시 주석 처리

### 주요 결정
- 로그아웃 버튼을 프로필 편집에서 설정 페이지로 이동 (B안)
  - 프로필 페이지 설정 아이콘(톱니바퀴)에서 /settings로 이동
  - /settings 페이지에 로그아웃 포함

### 다음 작업
- [ ] 관리자 페이지 (/admin)
- [ ] 회원가입 플로우 재설계
- [ ] 스토리 UI/UX 개선
- [ ] 좋아요 목록 모달

## 2026-05-19

### 완료
- 게시물 작성 페이지 경로 변경
  - 기존 `src/app/(main)/posts/write/page.tsx`를 유지한 채 `src/app/(sub)/write/page.tsx` 신규 생성
  - 게시물 작성/수정 진입 경로를 `/posts/write`에서 `/write`로 변경
  - PostCard, PostDetail 수정 액션 및 NavItems 작성 버튼 링크를 `/write`로 연결
- 메인 피드 컬럼 폭 되돌림
  - `src/app/(main)/layout.tsx`의 피드 컬럼을 `max-w-[630px]`에서 `max-w-[470px]`로 복구
  - 우측 패널 `w-72` 조정은 유지
- 모달 내 UserInfo 링크 클릭 시 모달 자동 닫힘 처리
  - `@modal/(.)posts/[postId]/page.tsx`에 `usePathname` 추가
  - `pathname`이 `/posts/${postId}`와 다르면 `null` 반환 → 다른 경로 이동 시 모달 자동 언마운트
- 회원가입 후 자동 로그인 처리
  - `signUpWithPassword` 완료 후 `signInWithPassword` 자동 호출
  - 이메일 인증 비활성화 상태에서 세션 미생성 문제 해결
- 온보딩 완료 후 홈 이동
  - `router.replace("/") + router.refresh()` → `window.location.href = "/"` 로 변경
- 사이드바 프로필 활성화 조건 수정
  - 내 닉네임 기준 정확히 일치할 때만 활성화, 남의 프로필에서는 비활성화
- 스토리바 내 스토리/스토리 링 UI 수정
  - `MyStoryCreateItem`의 "나" 텍스트를 현재 유저 아바타로 교체
  - `getCurrentUserProfile()`로 현재 유저 프로필 조회 후 Avatar fallback 포함 적용
  - 미확인 스토리는 인스타 스타일 그라데이션 링으로 변경
  - 확인한 스토리는 기존 회색 링 유지
  - 내 스토리 생성 아이템은 내 스토리가 있을 때 회색 링, 없을 때는 링 없이 아바타만 표시
  - 내 스토리 그룹은 목록에서 제외해 중복 렌더링 제거
  - 내 스토리가 있을 때는 아바타 원은 `/story/[userId]`, + 버튼은 `/story/create`로 클릭 동작 분리

### 기타
- Supabase 이메일 인증 비활성화 (개발 편의, 배포 전 재활성화 필요)
- `simsim020304@kookmin.ac.kr` 계정 수동 `email_confirmed_at` 처리

## 2026-05-20

### 완료
- 알림 actor 닉네임 표시 보정
  - `notifications.reference_id`와 타입별 원본 테이블을 기준으로 actor 역추적 로직 수정
  - 게시물 좋아요/스토리 좋아요/댓글 좋아요/게시물 댓글/유저 좋아요 알림에서 실제 닉네임 표시
- 프로필 유저 좋아요 기능 추가
  - `features/profile/api.ts`에 `toggleUserLike`, `getUserLikeStatus` RPC 래퍼 추가
  - `database.types.ts`에 `toggle_user_like`, `get_user_like_status` RPC 타입 반영
  - 프로필 페이지 타인 헤더에 하트 아이콘 + 좋아요 수 표시
  - 유저 좋아요 토글 낙관적 업데이트 및 실패 시 롤백 적용
- 게시물 미디어 테이블 전환 반영
  - Supabase `post_images` 테이블을 `post_media`로 교체한 스키마를 `database.types.ts`에 반영
  - `post_images` → `post_media` 전환 및 reports 정비 마이그레이션 추가
  - `features/feed/api.ts`의 `PostImage` 타입을 `PostMedia`로 변경하고 `media` 필드로 반환하도록 수정
  - 게시물 생성/피드/상세 조회 쿼리를 `post_media` 기준으로 변경
  - PostCard, PostDetail, 게시물 작성/수정 화면, 프로필 썸네일 조회를 새 미디어 구조에 맞게 수정
- 신고 API 연결
  - `features/reports/api.ts` 신규 생성 (`createReport`)
  - `reports` 타입을 현재 DB 스키마에 맞게 반영
  - 피드/게시물 상세 신고와 스토리 신고 ActionSheet를 실제 reports insert로 연결
  - 신고 전 ConfirmDialog 확인 절차와 완료/실패 Toast 피드백 추가
- 게시물 상세 데스크톱 모달 레이아웃 버그 수정
  - 모달 높이를 96vh, 최대 폭을 1100px로 조정하고 우측 댓글 컬럼을 500px 고정
  - 좌측 이미지 영역을 600px 이하로 제한하고 현재 이미지 비율에 맞춰 폭 계산
  - 우측 댓글 스크롤 영역과 하단 입력창 분리로 댓글이 없을 때도 입력창 고정
- 게시물 상세 댓글 기능 복구
  - 댓글 좋아요, 대댓글 표시, 답글 보기/숨기기, 답글 달기 입력 흐름 복구
  - `toggleCommentLike`, `getLikedCommentIds` 기반 낙관적 업데이트와 실패 롤백 적용
- 게시물 상세 컴포넌트 파일 분리
  - `ImageCarousel`, `PostComments`, `PostDetailParts`, `lib/utils/time`으로 코드 이동
  - 기능/로직/스타일 변경 없이 `PostDetail.tsx` 본체만 남기도록 정리
- 알림 시스템 UI 구현
  - `features/notifications/api.ts` 신규 생성 (`getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`)
  - `notifications` 타입을 현재 알림 종류(`post_like`, `story_like`, `comment_like`, `post_comment`, `report_received`)에 맞게 반영
  - 웹 사이드바 벨 클릭 시 360px 알림 패널 표시, 바깥 클릭 닫기, 모두 읽음/단건 읽음 처리 연결
  - 모바일 `/notifications` 페이지 신규 생성
  - Header/NavItems 벨 아이콘에 읽지 않은 알림 빨간 점 뱃지 추가
  - 알림 항목에 actor 아바타, 알림 문구, 상대 시간, 게시물/스토리 썸네일, 클릭 이동 처리 적용
- 관리자 페이지 1차 구현
  - `middleware.ts`에 `/admin` 접근 시 `users.role = 'admin'` 검사 추가, 비관리자는 `/`로 리다이렉트
  - `features/admin/api.ts` 신규 생성 (`getDashboardStats`, `getAdminReports`, `getAdminUsers`, `handleReport`)
  - `/admin` 전용 레이아웃과 좌측 사이드바 구현
  - `/admin` 대시보드 구현 (일/월/년/전체 탭, 신규가입/게시물/스토리/댓글/좋아요/미처리신고 KPI 카드, 새로고침)
  - `/admin/reports` 구현 (목록 조회, 기각/삭제/복구 처리, 상태별 버튼 분기, 처리 후 새로고침)
  - `/admin/users` 구현 (닉네임/이메일 검색, 가입일/게시물 수/신고당한 횟수/권한 뱃지 표시)
  - 사이드바 하단에 관리자 전용 버튼 추가 (`role='admin'`일 때만 노출)
- 신고 시스템 개선
  - `reports.target_snapshot` 컬럼 추가 (신고 시점 콘텐츠 스냅샷 자동 저장)
  - `reports.target_author_id` 컬럼 추가 (콘텐츠 삭제 후에도 작성자 보존)
  - 콘텐츠 삭제 방식을 hard delete에서 soft delete로 전환해 복구 가능하도록 조정
  - `trg_fill_report_snapshot` 트리거 추가
- 알림 시스템
  - `post_like`, `story_like`, `comment_like`, `post_comment`, `report_received` 알림 트리거 5종 연결
  - `NotificationPanel` 웹 슬라이드 패널 구현
  - 모바일 `/notifications` 페이지 구현
  - 벨 아이콘 읽지 않은 알림 수 뱃지 표시
- 회원가입 이메일 인증 흐름 조정
  - `signUpWithPassword`에 `emailRedirectTo=/auth/callback` 추가
  - 회원가입 직후 자동 로그인 제거
  - 회원가입 성공 시 인증 메일 발송 완료 화면으로 전환
- 계정 탈퇴 및 복구 기능 구현
  - `delete_account` RPC 연동
  - 설정 페이지에 탈퇴 확인 다이얼로그 및 탈퇴 액션 추가
  - 탈퇴 완료 후 즉시 로그아웃하고 `/auth/login`으로 이동하도록 단순화
- 유저 검색 기능 구현
  - `search_users` RPC 기반 `features/search/api.ts` 추가
  - 최근 검색 localStorage 관리 (`search_history`, 최대 10개)
  - 검색 입력/결과/최근 검색 컴포넌트 분리
  - `/search` 페이지에 300ms debounce, 최근 검색, 프로필 이동 연결
- 버그 수정
  - `comment_likes` INSERT RLS `WITH CHECK` 추가

## 2026-05-24

### 현재 상태 확인
- 프로젝트 경로: `/mnt/c/dev/univer` (`C:\dev\univer`)
- 로컬 URL: `http://localhost:3000/`
- 기존 오류: `lightningcss.linux-x64-gnu.node missing`
- 조치 완료: `node_modules`, `.next` 삭제 후 `npm install` 재실행
- 현재 화면 상태: 로그인 페이지 정상 표시, 브라우저 콘솔 에러 없음
- Git 상태: `package-lock.json`만 변경됨 (`npm install` 재실행 영향으로 보임)

### 문서/코드 기준 진행 상태
- 기능명세서 기준 핵심 방향: 대학생 실명 SNS, 국민대 우선, 사진 중심 SNS MVP, 전교생/크루 공개 범위, 피드/스토리/프로필/알림/관리자 기능 중심
- 로컬 코드 기준 이미 구현된 큰 기능
  - 이메일+비밀번호 로그인/회원가입/온보딩/미들웨어
  - 메인 레이아웃, 피드, 게시물 작성/수정/삭제, 게시물 상세 모달
  - 댓글/대댓글/좋아요, 스토리 업로드/뷰어/삭제
  - 프로필/프로필 편집/설정/로그아웃/계정 탈퇴
  - 유저 검색, 알림, 신고, 관리자 1차 페이지
  - 친구(크루) 신청/수락/거절/삭제 흐름

### 확인 중 발견한 문제
- `npm run lint` 실패
  - React 19/Next 16 ESLint 규칙 `react-hooks/set-state-in-effect` 관련 에러 6개
  - 위치: `/search`, `/profile/edit`, `/admin`, `/admin/reports`, `/admin/users`, `MainLayoutShell`
  - 경고 3개: 미사용 변수/의존성 경고
- 실제 로그인 테스트는 아직 계정 정보 확인이 필요함
  - 일반 계정 로그인 가능 여부 확인 필요
  - 관리자 계정 로그인 후 `/admin` 접근 가능 여부 확인 필요

### 내일 바로 할 일
1. 일반 계정으로 로그인 테스트
   - `/auth/login`에서 이메일+비밀번호 입력
   - 로그인 성공 시 `/` 홈 피드로 이동하는지 확인
   - 온보딩 미완료 계정이면 `/onboarding` 이동 여부 확인
2. 관리자 계정으로 로그인 테스트
   - 관리자 계정 로그인
   - `/admin` 접근 가능 여부 확인
   - 비관리자 계정은 `/admin` 접근 시 `/`로 돌려보내지는지 확인
3. `npm run lint` 에러 수정
   - `setState`를 직접 effect 안에서 호출하는 패턴 정리
   - admin/search/profile/edit/MainLayoutShell 순서로 수정
4. 수정 후 검증
   - `npm run lint`
   - `npm run build`
   - 로그인/관리자 화면 수동 확인
5. 남은 기능 작업 재개
   - 기존 `/posts/write` 라우트 삭제
   - 스토리 UI/UX 개선
   - 좋아요 목록 모달
   - 관리자 액션 범위 확장
