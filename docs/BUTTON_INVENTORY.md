# 앱 버튼 전수 목록

기준: 2026-09-17 작업 트리. 대상: `apps/mobile/src`의 349개 TS/TSX 파일. 미커밋 변경도 포함한 현재 소스이며, 스토어에 배포된 버전의 목록은 아니다. 코드·스타일·마이그레이션 변경 없이 JSX와 연결된 스타일을 읽었다.

## 디자이너에게 먼저

**A 글자형 46곳 / B 아이콘형 45곳 / C 복합·기타 터치 영역 64곳 = 155곳(93개 파일).** A 중 8곳은 상태를 선택하는 탭·선택기이고, 이를 제외한 실행 버튼 후보는 **38곳**이다. C를 전부 Button으로 바꾸자는 뜻이 아니다.

높이 52만 보고 묶으면 안 된다. 로그인은 폼 전체 너비, 닉네임 확인은 입력 옆의 내용 너비다. 높이 54도 온보딩 제출은 폼 전체, 스토리 공유는 영상 위의 작은 플로팅 버튼이다. 먼저 **역할·너비·배경 맥락**을 정하고 크기를 정해야 한다.

## 집계 방법과 읽는 법

- 집계 단위는 화면에 생성되는 개수가 아니라 **터치 요소의 구현 위치**다. `Pressable` 152곳 + 직접 `Text onPress` 3곳. 반복 목록은 템플릿 1곳, 공용 컴포넌트의 호출부는 중복 계산하지 않는다. 한 구현에 primary/secondary 또는 일반 탭/+ 분기가 있으면 한 행에 둘 다 썼다.
- 이름에 button이 없는 메뉴·글자 링크·행도 조사했다. 빈 영역 닫기·미디어 탭 영역·체크박스·스와치는 누락 방지를 위해 C에 포함했다. 핀치·드래그 제스처 자체, 입력칸의 키보드 submit은 버튼 수에 넣지 않았다.
- **A**: 글자로 명령을 실행하는 요소. 글자형 선택기도 A로 기록하되 `[선택기]`를 붙였다. 두 줄이어도 외부 공유처럼 하나의 명령이면 A다.
- **B**: 아이콘/아바타만인 도구·탭. 알림 개수 배지는 보조 표시라 B를 유지했다.
- **C**: 아이콘+글자, 콘텐츠·카드·본문 링크, 보이지 않는 영역, 셔터·체크박스·색상 선택. 역할이 다른 만큼 자동 공용화하지 않는다.
- 파일 경로는 모두 `apps/mobile/src/` 기준. 줄은 스타일 정의가 아니라 **실제 터치 JSX 시작 줄**이다. 스타일 칸은 기본 스타일 중심이며, 분기·상속은 값 칸에 병기했다.
- RN 수치는 논리 단위(dp/pt)다. 편의상 디자인 px처럼 읽되 물리 픽셀 실측값은 아니다. `최소`는 minHeight, `없음(py12)`는 높이 지정 없이 위아래 padding 12다. 내용 높이를 fontSize만으로 계산하지 않았다.
- `—`는 미지정/해당 없음. 배경은 색 토큰의 키를 적었다(`c.accent`/`colors.accent`의 accent). `colors.white` 등 고정색 맥락은 별도 표시했다. 없음은 투명이며 뒤의 화면색까지 없다는 뜻은 아니다.
- 글자는 `크기/실제 굵기`. theme의 regular=500, medium=600, semibold=700, bold=800, heavy=900을 풀어 썼다. 복합 콘텐츠는 대표 텍스트 및 보조 텍스트를 병기했다.
- 눌림 칸은 **pressed 상태만**이다. 비활성·선택·로딩·드래그 투명도를 섞지 않았다. 폭의 '부모 전체'는 화면 전체와 다르다. 폼·카드의 바깥 여백은 유지된다.
- `[의도]`는 2026-07-03 축소/후속 의도 기록과 관련된 항목이다. 해당 크기·메타 글자·아이콘 굵기를 Button 작업으로 되돌리지 않는다.

## 전수 목록

| # | 화면·동작 | 파일·줄 | 스타일 이름 | 분류 | 높이 | 둥글기 | 배경 | 글자 크기/굵기 | 눌림 효과 | 폭 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 내 활동·즐겨찾기 사용자 | [components/activity/ActivityFavoriteUserRow.tsx:30](../apps/mobile/src/components/activity/ActivityFavoriteUserRow.tsx#L30) | `row` | C | 없음(py12) | 18 | 없음 | 15/700;12/700·600 | 배경 accentSoft | 부모 전체 |
| 2 | 내 활동·게시물 타일 | [components/activity/ActivityPostGrid.tsx:50](../apps/mobile/src/components/activity/ActivityPostGrid.tsx#L50) | `tile` | C | 폭과 동일 | 12 | navBackground | 11/800·900 | 없음 | flex1 |
| 3 | 내 활동·스토리 타일 | [components/activity/ActivityStoryGrid.tsx:77](../apps/mobile/src/components/activity/ActivityStoryGrid.tsx#L77) | `tile` | C | 폭과 동일 | 12 | navBackground | 10/900;9/900 | 없음 | flex1 |
| 4 | 스토리 보관함·조회 | [components/activity/ActivityStoryPreviewMeta.tsx:21](../apps/mobile/src/components/activity/ActivityStoryPreviewMeta.tsx#L21) | `metaButton` | C | 없음(py6) | 999 | onMediaFillFaint | 12/800 | 0.7 | 내용 |
| 5 | 스토리 보관함·닫기 | [components/activity/ActivityStoryPreviewSheet.tsx:73](../apps/mobile/src/components/activity/ActivityStoryPreviewSheet.tsx#L73) | `closeButton` | B | 42 | 16 | onMediaFillFaint | — | 없음 | 42 |
| 6 | 스토리 보관함·바깥 닫기 | [components/activity/ActivityStoryPreviewSheet.tsx:91](../apps/mobile/src/components/activity/ActivityStoryPreviewSheet.tsx#L91) | `viewerBackdrop` | C | 전체 덮개 | — | scrimMed | — | 없음 | 전체 |
| 7 | 스토리 열람자·머리글 닫기 | [components/activity/ActivityStoryViewerList.tsx:27](../apps/mobile/src/components/activity/ActivityStoryViewerList.tsx#L27) | `viewerHeader` | C | 없음(pt16,pb10) | — | 없음 | 15/900;12/700 | 없음 | 부모 전체 |
| 8 | 로그인·Google 로그인 | [components/auth/GoogleAuthButton.tsx:41](../apps/mobile/src/components/auth/GoogleAuthButton.tsx#L41) | `button` | C | 52 | 18 | colors.white;테두리 rgba(20,22,30,0.1) | 15/900 | 0.82 | 폼 전체 |
| 9 | 카메라·닫기 | [components/camera/CameraControls.tsx:41](../apps/mobile/src/components/camera/CameraControls.tsx#L41) | `iconButton` | B | 44 | 22 | scrimWeak | — | 0.72 | 44 |
| 10 | 카메라·플래시 | [components/camera/CameraControls.tsx:54](../apps/mobile/src/components/camera/CameraControls.tsx#L54) | `iconButton` | B | 44 | 22 | scrimWeak | — | 0.72 | 44 |
| 11 | 카메라·셔터 원형 | [components/camera/CameraControls.tsx:79](../apps/mobile/src/components/camera/CameraControls.tsx#L79) | `captureOuter` | C | 78 | 39 | onMediaFill;테두리 onMediaBorder | — | 0.72 | 78 |
| 12 | 카메라·전후면 전환 | [components/camera/CameraControls.tsx:92](../apps/mobile/src/components/camera/CameraControls.tsx#L92) | `sideButton` | B | 52 | 26 | scrimWeak | — | 0.72 | 52 |
| 13 | 카메라 권한·닫기 | [components/camera/CameraPermissionView.tsx:41](../apps/mobile/src/components/camera/CameraPermissionView.tsx#L41) | `closeButton` | B | 44 | 22 | scrimWeak | — | 없음 | 44 |
| 14 | 카메라 권한·허용/설정 | [components/camera/CameraPermissionView.tsx:59](../apps/mobile/src/components/camera/CameraPermissionView.tsx#L59) | `permissionButton` | A | 없음(py12) | 12 | onMediaFillStrong | 15/800 | 0.72 | 내용 |
| 15 | 채팅 요청·수락 | [components/chat/ChatRequestBanner.tsx:25](../apps/mobile/src/components/chat/ChatRequestBanner.tsx#L25) | `acceptButton` | A | 없음(py9) | 13 | accent | 13/900 | 0.75 | 내용 |
| 16 | 채팅방·뒤로 | [components/chat/ChatRoomHeader.tsx:34](../apps/mobile/src/components/chat/ChatRoomHeader.tsx#L34) | `headerButton` | B | 40 | 16 | navBackground | — | 없음 | 40 |
| 17 | 메시지 목록·대화방 | [components/chat/ConversationRow.tsx:33](../apps/mobile/src/components/chat/ConversationRow.tsx#L33) | `row` | C | 없음(py12) | 18 | 없음 | 15/700 등 | 배경 accentSoft | 부모 전체 |
| 18 | 채팅·메시지 말풍선 | [components/chat/MessageBubble.tsx:42](../apps/mobile/src/components/chat/MessageBubble.tsx#L42) | `bubble`, `mineBubble`, `otherBubble` | C | 없음(py9) | 18;위 한쪽5 | accent/navBackground | 14/700 | 없음 | 내용 |
| 19 | 채팅·사용 불가 공유 말풍선 | [components/chat/MessageBubble.tsx:86](../apps/mobile/src/components/chat/MessageBubble.tsx#L86) | `bubble`, `unavailableBubble`, `mineBubble`, `otherBubble` | C | 없음(py9) | 18;위 한쪽5 | accent/navBackground | 14/700 | 없음(상시0.9) | 내용 |
| 20 | 채팅·공유 게시물 | [components/chat/MessageBubble.tsx:104](../apps/mobile/src/components/chat/MessageBubble.tsx#L104) | `postCard`, `minePostCard`, `otherPostCard` | C | 내용 | 18;위 한쪽5 | accent/navBackground | 13/900;12/700;11/800 | 0.72 | 238 |
| 21 | 채팅·보내기 | [components/chat/MessageInput.tsx:56](../apps/mobile/src/components/chat/MessageInput.tsx#L56) | `sendButton` | B | 38 | 16 | accent(비활성 card) | — | 0.75 | 38 |
| 22 | 댓글·답글 취소 | [components/comments/CommentInputBar.tsx:57](../apps/mobile/src/components/comments/CommentInputBar.tsx#L57) | 직접/전달 스타일 | A | 없음 | — | 없음 | 12/900 | 없음 | 내용 |
| 23 | 댓글·보내기 | [components/comments/CommentInputBar.tsx:72](../apps/mobile/src/components/comments/CommentInputBar.tsx#L72) | `sendButton` | B | 42 | 21 | accent | — | 없음 | 42 |
| 24 | 댓글·길게 누르기 메뉴 | [components/comments/CommentRow.tsx:59](../apps/mobile/src/components/comments/CommentRow.tsx#L59) | `row`, `replyRow` | C | 없음(py9) | — | 없음 | 14/600 | 없음;Android 진동18ms | 부모 전체 |
| 25 | 댓글·답글 달기 | [components/comments/CommentRow.tsx:102](../apps/mobile/src/components/comments/CommentRow.tsx#L102) | 직접/전달 스타일 | A | 없음 | — | 없음 | 12/800 | 없음 | 내용 |
| 26 | 댓글·좋아요+수 | [components/comments/CommentRow.tsx:109](../apps/mobile/src/components/comments/CommentRow.tsx#L109) | `likeButton` | C | 없음 | — | 없음 | 12/800 | 없음 | 내용 |
| 27 | 댓글·답글 보기/숨기기 | [components/comments/CommentThread.tsx:136](../apps/mobile/src/components/comments/CommentThread.tsx#L136) | `replyToggle` | A | 없음(py4) | — | 없음 | 12/800 | 없음 | 내용 |
| 28 | 공용 더보기·메뉴 항목 | [components/common/ActionSheet.tsx:36](../apps/mobile/src/components/common/ActionSheet.tsx#L36) | `item`, `lastItem` | A | 최소56 | — | 없음;아래 구분선 | 15/800 | 배경 overlayInkFaint | 시트 전체 |
| 29 | 공용 시트·바깥 닫기 | [components/common/BottomSheet.tsx:70](../apps/mobile/src/components/common/BottomSheet.tsx#L70) | 직접/전달 스타일 | C | 전체 덮개 | — | 기본 scrimMed + backdropStyle | — | 없음 | 전체 |
| 30 | 하단 탭·메뉴/+ [의도] | [components/common/BottomTabBar.tsx:103](../apps/mobile/src/components/common/BottomTabBar.tsx#L103) | `primaryTab`, `navTab` | B | 일반44;+46 | 일반—;+14 | 일반 없음;+brand | —(배지 별도) | 없음 | 일반44;+46 |
| 31 | 사용 안내·건너뛰기 | [components/common/CoachMarkOverlay.tsx:217](../apps/mobile/src/components/common/CoachMarkOverlay.tsx#L217) | `skipButton` | A | 최소40 | — | 없음 | 14/700 | 0.72(글자 상시0.6) | 내용 |
| 32 | 사용 안내·다음 | [components/common/CoachMarkOverlay.tsx:227](../apps/mobile/src/components/common/CoachMarkOverlay.tsx#L227) | `nextButton` | A | 최소40 | 12 | colors.black | 14/800 | 0.72 | 내용 |
| 33 | 확인 시트·확인 | [components/common/ConfirmDialog.tsx:49](../apps/mobile/src/components/common/ConfirmDialog.tsx#L49) | `item`, `lastItem` | A | 최소56 | — | 없음;아래 구분선 | 15/800 | 배경 overlayInkFaint | 시트 전체 |
| 34 | 확인 시트·취소 | [components/common/ConfirmDialog.tsx:63](../apps/mobile/src/components/common/ConfirmDialog.tsx#L63) | `item`, `lastItem` | A | 최소56 | — | 없음 | 15/800 | 배경 overlayInkFaint | 시트 전체 |
| 35 | 미디어·더블탭 좋아요 영역 | [components/common/DoubleTapLike.tsx:94](../apps/mobile/src/components/common/DoubleTapLike.tsx#L94) | 직접/전달 스타일 | C | 호출부 | 호출부 | 호출부 | — | 하트 애니메이션(눌림 opacity 아님) | 호출부 |
| 36 | 본문·펼치기/접기 | [components/common/ExpandableText.tsx:48](../apps/mobile/src/components/common/ExpandableText.tsx#L48) | 직접/전달 스타일 | C | 내용 | — | 없음 | 호출부 textStyle | 없음 | 부모 전체 |
| 37 | 본문·더보기 | [components/common/ExpandableText.tsx:61](../apps/mobile/src/components/common/ExpandableText.tsx#L61) | 직접/전달 스타일 | A | 없음 | — | 없음 | 피드14/800;릴스13/800 | 없음 | 내용 |
| 38 | 공용 게시물 썸네일 | [components/common/PostThumbnailGrid.tsx:41](../apps/mobile/src/components/common/PostThumbnailGrid.tsx#L41) | `tile` | C | 폭과 동일 | 10 | neutralFill | — | 없음 | flex1 |
| 39 | 공용 헤더·뒤로 | [components/common/ScreenHeader.tsx:29](../apps/mobile/src/components/common/ScreenHeader.tsx#L29) | `headerButton` | B | 40 | 16 | navBackground/legacy lightColors.white | — | 없음 | 40 |
| 40 | 빈 상태·실행 버튼 | [components/common/StateView.tsx:32](../apps/mobile/src/components/common/StateView.tsx#L32) | `button` | A | 없음(py12) | 14 | accent | 13/900 | 없음 | 내용 |
| 41 | 공용 사용자·프로필 이동 [의도:메타] | [components/common/UserInline.tsx:36](../apps/mobile/src/components/common/UserInline.tsx#L36) | `container` | C | 내용 | — | 없음 | 닉네임 스타일;메타12/500 | 0.65 | 내용/호출부 |
| 42 | 게시물·공개범위 선택 [선택기] | [components/common/VisibilityPicker.tsx:26](../apps/mobile/src/components/common/VisibilityPicker.tsx#L26) | `option`, `activeOption` | A | 40 | 15 | 선택 accent/그 외 없음 | 13/900 | 0.72 | 동일 flex1 |
| 43 | 게시물 공유·외부 공유 | [components/feed/ExternalShareSection.tsx:33](../apps/mobile/src/components/feed/ExternalShareSection.tsx#L33) | `externalButton` | A | 없음(py12) | 18 | accentSoft | 14/900;URL12/700 | 0.7 | 시트 내부 전체 |
| 44 | 피드·좋아요+수 [의도] | [components/feed/FeedPostActions.tsx:43](../apps/mobile/src/components/feed/FeedPostActions.tsx#L43) | `actionButton` | C | 내용 | — | 없음 | 13/700 | 없음 | 내용 |
| 45 | 피드·댓글+수 [의도] | [components/feed/FeedPostActions.tsx:55](../apps/mobile/src/components/feed/FeedPostActions.tsx#L55) | `actionButton` | C | 내용 | — | 없음 | 13/700 | 없음 | 내용 |
| 46 | 피드·공유 [의도:굵기] | [components/feed/FeedPostActions.tsx:65](../apps/mobile/src/components/feed/FeedPostActions.tsx#L65) | `actionButton` | B | 내용 | — | 없음 | — | 없음 | 내용 |
| 47 | 피드·저장 | [components/feed/FeedPostActions.tsx:75](../apps/mobile/src/components/feed/FeedPostActions.tsx#L75) | `bookmarkButton` | B | 최소40 | — | 없음 | — | 0.62 | 최소40 |
| 48 | 피드·더보기 | [components/feed/FeedPostHeader.tsx:40](../apps/mobile/src/components/feed/FeedPostHeader.tsx#L40) | `iconButton` | B | 최소40 | 20 | 없음 | — | 0.62 | 최소40 |
| 49 | 피드 영상·재생 영역 | [components/feed/FeedVideoPlayer.tsx:160](../apps/mobile/src/components/feed/FeedVideoPlayer.tsx#L160) | 직접/전달 스타일 | C | 영상 전체 | — | 없음 | — | 없음 | 영상 전체 |
| 50 | 피드 영상·음소거 | [components/feed/FeedVideoPlayer.tsx:169](../apps/mobile/src/components/feed/FeedVideoPlayer.tsx#L169) | `muteBadge` | B | 32 | 16 | scrimMed | — | 없음 | 32 |
| 51 | 공유 시트·내 스토리에 추가 | [components/feed/PostShareSheet.tsx:118](../apps/mobile/src/components/feed/PostShareSheet.tsx#L118) | `storyAction` | C | 50 | 14 | overlayInkFaint | 14/800 | 0.72 | 시트 내부 전체 |
| 52 | 릴스·좋아요+수 | [components/feed/ReelActions.tsx:44](../apps/mobile/src/components/feed/ReelActions.tsx#L44) | `actionButton` | C | 없음(내부 아이콘 상자32) | — | 없음 | 13/700 | 없음 | 내용 |
| 53 | 릴스·댓글+수 | [components/feed/ReelActions.tsx:57](../apps/mobile/src/components/feed/ReelActions.tsx#L57) | `actionButton` | C | 없음(내부 아이콘 상자32) | — | 없음 | 13/700 | 없음 | 내용 |
| 54 | 릴스·공유 | [components/feed/ReelActions.tsx:63](../apps/mobile/src/components/feed/ReelActions.tsx#L63) | `actionButton` | B | 내부 상자32 | — | 없음 | — | 없음 | 내부 상자32 |
| 55 | 릴스·저장 | [components/feed/ReelActions.tsx:74](../apps/mobile/src/components/feed/ReelActions.tsx#L74) | `actionButton` | B | 내부 상자32 | — | 없음 | — | 없음 | 내부 상자32 |
| 56 | 릴스·음소거 | [components/feed/ReelActions.tsx:80](../apps/mobile/src/components/feed/ReelActions.tsx#L80) | `actionButton` | B | 내부 상자32 | — | 없음 | — | 없음 | 내부 상자32 |
| 57 | 릴스·작성자 이동 | [components/feed/ReelFooter.tsx:28](../apps/mobile/src/components/feed/ReelFooter.tsx#L28) | `userRow` | C | 내용(아바타36) | — | 없음 | 15/700 | 없음 | 내용 |
| 58 | 릴스·더보기 | [components/feed/ReelMoreMenu.tsx:56](../apps/mobile/src/components/feed/ReelMoreMenu.tsx#L56) | `menuButton` | B | 44 | — | 없음 | — | 없음 | 44 |
| 59 | 공유 대상·보내기 | [components/feed/ShareTargetList.tsx:59](../apps/mobile/src/components/feed/ShareTargetList.tsx#L59) | `sendButton` | A | 없음(py9) | 999 | accent | 13/900 | 0.7 | 내용 |
| 60 | 홈·로고 길게 누르기 | [components/home/HomeHeader.tsx:33](../apps/mobile/src/components/home/HomeHeader.tsx#L33) | 직접/전달 스타일 | C | 로고28 | — | 없음 | 로고 자산 | 없음 | 로고 |
| 61 | 홈·알림 [의도] | [components/home/HomeHeader.tsx:44](../apps/mobile/src/components/home/HomeHeader.tsx#L44) | `iconButton` | B | 44 | — | 없음 | 배지10/900 | 없음 | 44 |
| 62 | 홈·메시지 [의도] | [components/home/HomeHeader.tsx:59](../apps/mobile/src/components/home/HomeHeader.tsx#L59) | `iconButton` | B | 44 | — | 없음 | 배지10/900 | 없음 | 44 |
| 63 | 인사이트·게시물 행 | [components/insights/InsightsContentRow.tsx:25](../apps/mobile/src/components/insights/InsightsContentRow.tsx#L25) | `row` | C | 없음(py10) | — | 없음 | 14/900;11/700·600 | 0.68 | 부모 전체 |
| 64 | 인사이트·정렬 [선택기] | [components/insights/InsightsContentTab.tsx:84](../apps/mobile/src/components/insights/InsightsContentTab.tsx#L84) | `sort`, `sortActive` | A | 28 | 8 | 선택 navBackground/그 외 없음 | 11/700·900 | 없음 | 최소54+내용 |
| 65 | 인사이트·대시보드 탭 [선택기] | [components/insights/InsightsDashboardTabs.tsx:27](../apps/mobile/src/components/insights/InsightsDashboardTabs.tsx#L27) | `tab` | A | 최소48 | — | 없음 | 14/700·900 | 없음 | 동일 flex1 |
| 66 | 인사이트·지표 타일 | [components/insights/InsightsMetricTile.tsx:22](../apps/mobile/src/components/insights/InsightsMetricTile.tsx#L22) | `tile`, `tileSelected` | C | 최소112 | 16 | navBackground/선택 card | 12/700;26/900;11/800 | 없음 | flexBasis88+flexGrow |
| 67 | 인사이트·기간 선택 | [components/insights/InsightsPeriodPicker.tsx:37](../apps/mobile/src/components/insights/InsightsPeriodPicker.tsx#L37) | `button` | C | 40 | 12 | navBackground | 13/900 | 0.7 | 최소104+내용 |
| 68 | 승격 안내·신청 | [components/insights/PromotionCard.tsx:73](../apps/mobile/src/components/insights/PromotionCard.tsx#L73) | `button` | A | 최소42 | 14 | accent(비활성 neutralFill) | 13/700 | 0.72 | 카드 내부 전체 |
| 69 | 알림·알림 행 | [components/notifications/NotificationRow.tsx:78](../apps/mobile/src/components/notifications/NotificationRow.tsx#L78) | `row`, `unread` | C | 없음(py12) | 18 | 읽음 없음/안 읽음 accentSoft | 14/600·900;12/700 | 0.7 | 부모 전체 |
| 70 | 크루·분류 탭 [선택기] | [components/profile/ConnectionTabs.tsx:28](../apps/mobile/src/components/profile/ConnectionTabs.tsx#L28) | `tab`, `activeTab` | A | 40 | 15 | 선택 accent/그 외 없음 | 13/900 | 0.72 | 동일 flex1 |
| 71 | 크루 관리·수락/거절/취소/삭제 | [components/profile/ConnectionUserRow.tsx:110](../apps/mobile/src/components/profile/ConnectionUserRow.tsx#L110) | `button`, `primaryButton`, `secondaryButton` | A | 38 | 13 | primary accent/secondary navBackground | 13/900 | 0.7 | 최소58+내용 |
| 72 | 프로필·메시지/친구/팔로우 | [components/profile/ProfileConnectionActions.tsx:165](../apps/mobile/src/components/profile/ProfileConnectionActions.tsx#L165) | `button` | A | 40 | 14 | accent/chipFill/accentSoft | 13/900 | 0.7 | 최소86+내용 |
| 73 | 내 프로필·편집 | [components/profile/ProfileContent.tsx:84](../apps/mobile/src/components/profile/ProfileContent.tsx#L84) | `profileActionButton` | A | 42 | 14 | chipFill | 14/600 | 0.75 | 행 안 flex1 |
| 74 | 내 프로필·인사이트 | [components/profile/ProfileContent.tsx:95](../apps/mobile/src/components/profile/ProfileContent.tsx#L95) | `profileActionButton` | A | 42 | 14 | chipFill | 14/600 | 0.75 | 행 안 flex1 |
| 75 | 프로필 편집·사진 변경 | [components/profile/ProfileEditAvatar.tsx:21](../apps/mobile/src/components/profile/ProfileEditAvatar.tsx#L21) | `button` | C | 없음(py8;아바타86) | — | 없음 | 13/900 | 0.72 | 부모 내부 |
| 76 | 프로필 편집·링크 추가 | [components/profile/ProfileEditLinksEditor.tsx:32](../apps/mobile/src/components/profile/ProfileEditLinksEditor.tsx#L32) | `addLinkButton` | C | 없음 | — | 없음 | 12/900 | 0.72 | 내용 |
| 77 | 프로필 편집·링크 삭제 | [components/profile/ProfileEditLinksEditor.tsx:60](../apps/mobile/src/components/profile/ProfileEditLinksEditor.tsx#L60) | `removeLinkButton` | B | 42 | 14 | navBackground | — | 0.72 | 42 |
| 78 | 프로필 편집·저장 | [components/profile/ProfileEditSaveButton.tsx:20](../apps/mobile/src/components/profile/ProfileEditSaveButton.tsx#L20) | `button` | A | 40 | — | 없음 | 14/900 | 0.72 | 40 |
| 79 | 프로필·헤더 도구 | [components/profile/ProfileHeaderBar.tsx:87](../apps/mobile/src/components/profile/ProfileHeaderBar.tsx#L87) | `headerButton` | B | 40 | — | 없음 | — | 없음 | 40 |
| 80 | 프로필·크루 수 | [components/profile/ProfileInfoPanel.tsx:61](../apps/mobile/src/components/profile/ProfileInfoPanel.tsx#L61) | `stat` | C | 내용 | — | 없음 | 18/900;12/700 | 0.65 | flex1 |
| 81 | 프로필·외부 링크 | [components/profile/ProfileInfoPanel.tsx:101](../apps/mobile/src/components/profile/ProfileInfoPanel.tsx#L101) | `linkChip` | C | 없음(py7) | 999 | chipFill | 12/800 | 0.68 | 내용(최대100%) |
| 82 | 검색·기록 모두 지우기 | [components/search/RecentSearchList.tsx:36](../apps/mobile/src/components/search/RecentSearchList.tsx#L36) | 직접/전달 스타일 | A | 없음 | — | 없음 | 12/800 | 없음 | 내용 |
| 83 | 검색·최근 검색어 | [components/search/RecentSearchList.tsx:43](../apps/mobile/src/components/search/RecentSearchList.tsx#L43) | `recentLabel` | C | 내용 | — | 없음 | 14/800 | 없음 | flex1 |
| 84 | 검색·기록 삭제 | [components/search/RecentSearchList.tsx:52](../apps/mobile/src/components/search/RecentSearchList.tsx#L52) | `recentRemove` | B | 30 | 15 | navBackground | — | 없음 | 30 |
| 85 | 검색·추천 크루 카드 | [components/search/RecommendedCrewCard.tsx:33](../apps/mobile/src/components/search/RecommendedCrewCard.tsx#L33) | `card` | C | 최소188 | 16 | card | 14/700;12/600 | 0.72 | 148 |
| 86 | 검색·추천 숨기기 | [components/search/RecommendedCrewCard.tsx:39](../apps/mobile/src/components/search/RecommendedCrewCard.tsx#L39) | `dismissButton` | B | 26 | 13 | overlayInkFaint | — | 없음 | 26 |
| 87 | 검색·추천 크루 요청 | [components/search/RecommendedCrewCard.tsx:77](../apps/mobile/src/components/search/RecommendedCrewCard.tsx#L77) | `requestButton` | A | 32 | 10 | accent | 12/900 | 0.72 | 카드 내부100%(128) |
| 88 | 검색·입력 지우기 | [components/search/SearchInput.tsx:38](../apps/mobile/src/components/search/SearchInput.tsx#L38) | `clear` | B | 24 | 12 | 없음 | — | 없음 | 24 |
| 89 | 검색·사용자 결과 행 | [components/search/SearchUserRow.tsx:22](../apps/mobile/src/components/search/SearchUserRow.tsx#L22) | `row` | C | 없음(py10) | 16 | 없음 | 14/700;12/600 | 배경 accentSoft | 부모 전체 |
| 90 | 설정·비밀번호 변경 | [components/settings/ChangePasswordForm.tsx:108](../apps/mobile/src/components/settings/ChangePasswordForm.tsx#L108) | `submitButton` | A | 50 | 14 | accent | 14/800 | 0.76 | 폼 전체 |
| 91 | 홈·내 스토리 카드 [의도] | [components/stories/StoryBar.tsx:98](../apps/mobile/src/components/stories/StoryBar.tsx#L98) | 직접/전달 스타일 | C | 140 | 22 | lavenderTint;테두리 | 12/900 | 0.8 | 100 |
| 92 | 홈·스토리 추가 배지 | [components/stories/StoryBar.tsx:111](../apps/mobile/src/components/stories/StoryBar.tsx#L111) | `addBadge` | B | 28 | 14 | accent;white 테두리 | — | 없음 | 28 |
| 93 | 홈·스토리 만들기 카드 [의도] | [components/stories/StoryBar.tsx:123](../apps/mobile/src/components/stories/StoryBar.tsx#L123) | `createCard` | C | 140 | 22 | onMediaFill;테두리 | 13/900 | 0.8 | 100 |
| 94 | 홈·다른 사람 스토리 카드 [의도] | [components/stories/StoryBar.tsx:142](../apps/mobile/src/components/stories/StoryBar.tsx#L142) | 직접/전달 스타일 | C | 140 | 22 | lavenderTint;테두리 | 12/900 | 0.8 | 100 |
| 95 | 스토리 카메라·보관함 | [components/stories/StoryCamera.tsx:100](../apps/mobile/src/components/stories/StoryCamera.tsx#L100) | `sideButton` | B | 52 | 26 | scrimWeak | — | 없음 | 52 |
| 96 | 스토리 카메라·갤러리 대안 | [components/stories/StoryCamera.tsx:113](../apps/mobile/src/components/stories/StoryCamera.tsx#L113) | 직접/전달 스타일 | A | 없음 | — | 없음 | 14/800 | 없음 | 내용 |
| 97 | 스토리·더보기 | [components/stories/StoryHeader.tsx:36](../apps/mobile/src/components/stories/StoryHeader.tsx#L36) | 직접/전달 스타일 | B | 없음(아이콘26) | — | 없음 | — | 없음 | 내용 |
| 98 | 스토리·닫기 | [components/stories/StoryHeader.tsx:44](../apps/mobile/src/components/stories/StoryHeader.tsx#L44) | 직접/전달 스타일 | B | 없음(아이콘26) | — | 없음 | — | 없음 | 내용 |
| 99 | 스토리·재생/정지 영역 | [components/stories/StoryPlayer.tsx:173](../apps/mobile/src/components/stories/StoryPlayer.tsx#L173) | 직접/전달 스타일 | C | 전체 | — | 없음 | — | 없음 | 전체 |
| 100 | 스토리·이전 영역 | [components/stories/StoryPlayer.tsx:178](../apps/mobile/src/components/stories/StoryPlayer.tsx#L178) | `tapZone`, `tapLeft` | C | top96~bottom110 | — | 없음 | — | 없음 | 30% |
| 101 | 스토리·다음 영역 | [components/stories/StoryPlayer.tsx:183](../apps/mobile/src/components/stories/StoryPlayer.tsx#L183) | `tapZone`, `tapRight` | C | top96~bottom110 | — | 없음 | — | 없음 | 30% |
| 102 | 스토리·열람자 보기 | [components/stories/StoryPlayer.tsx:233](../apps/mobile/src/components/stories/StoryPlayer.tsx#L233) | `viewersButton` | C | 없음(py9) | 999 | scrimMed | 14/800 | 없음 | 내용 |
| 103 | 스토리·좋아요 | [components/stories/StoryPlayer.tsx:247](../apps/mobile/src/components/stories/StoryPlayer.tsx#L247) | `likeButton` | B | 없음(아이콘30) | — | 없음 | — | 없음 | 내용 |
| 104 | 스토리·공유된 게시물 | [components/stories/StorySharedPostCard.tsx:33](../apps/mobile/src/components/stories/StorySharedPostCard.tsx#L33) | `card` | C | 내용 | 18 | colors.white | 14/700;13/600;12/700 | 0.78 | 78%,최대340 |
| 105 | 게시물·비율 [선택기] | [components/write/PostAspectRatioPicker.tsx:30](../apps/mobile/src/components/write/PostAspectRatioPicker.tsx#L30) | `option`, `activeOption` | A | 최소40 | 15 | 선택 accent/그 외 없음 | 12/900 | 0.72 | 동일 flex1 |
| 106 | 게시물·빈 사진 선택 영역 | [components/write/PostImageUploader.tsx:69](../apps/mobile/src/components/write/PostImageUploader.tsx#L69) | `emptyPreview` | C | 최소220 | 20 | navBackground;accentBorderSoft 테두리 | 14/900 | 0.72 | 부모 전체 |
| 107 | 게시물·선택 사진 썸네일 | [components/write/PostImageUploader.tsx:93](../apps/mobile/src/components/write/PostImageUploader.tsx#L93) | `thumbnail`, `thumbnailActive` | C | 72 | 14 | imagePlaceholder;선택 테두리 accent | — | 없음 | 72 |
| 108 | 게시물·선택 사진 삭제 | [components/write/PostImageUploader.tsx:110](../apps/mobile/src/components/write/PostImageUploader.tsx#L110) | `removeButton` | B | 24 | 999 | mediaControlBg | — | 없음 | 24 |
| 109 | 게시물·사진 추가 | [components/write/PostImageUploader.tsx:122](../apps/mobile/src/components/write/PostImageUploader.tsx#L122) | `addButton` | B | 72 | 14 | navBackground;accentBorderSoft 테두리 | — | 0.72 | 72 |
| 110 | 보관함·앨범 카드 | [components/write/PostMediaAlbumCard.tsx:26](../apps/mobile/src/components/write/PostMediaAlbumCard.tsx#L26) | `card` | C | 정사각 표지+글자 | —(표지6) | 없음(표지 imagePlaceholder) | 15/700;14/500 | 0.78 | 전달된 width |
| 111 | 보관함·앨범 모두 보기 | [components/write/PostMediaAlbumOverview.tsx:48](../apps/mobile/src/components/write/PostMediaAlbumOverview.tsx#L48) | 직접/전달 스타일 | A | 없음 | — | 없음 | 15/600 | 0.65 | 내용 |
| 112 | 보관함 앨범·뒤로 | [components/write/PostMediaAlbumPicker.tsx:83](../apps/mobile/src/components/write/PostMediaAlbumPicker.tsx#L83) | 직접/전달 스타일 | B | 없음(아이콘26) | — | 없음 | — | 0.65 | 내용 |
| 113 | 보관함 앨범·닫기 | [components/write/PostMediaAlbumPicker.tsx:109](../apps/mobile/src/components/write/PostMediaAlbumPicker.tsx#L109) | 직접/전달 스타일 | B | 없음(아이콘26) | — | 없음 | — | 0.65 | 내용 |
| 114 | 보관함 앨범·다시 시도 | [components/write/PostMediaAlbumPicker.tsx:126](../apps/mobile/src/components/write/PostMediaAlbumPicker.tsx#L126) | `retryButton` | A | 최소32 | 16 | overlayInk | 12/700 | 0.65 | 내용 |
| 115 | 자르기·순서 썸네일 | [components/write/PostMediaCropThumbnailStrip.tsx:152](../apps/mobile/src/components/write/PostMediaCropThumbnailStrip.tsx#L152) | `thumbnailButton` | C | 52 | 6 | imagePlaceholder | — | 0.7(드래그 별도) | 52 |
| 116 | 보관함·사진 타일 | [components/write/PostMediaGalleryItem.tsx:31](../apps/mobile/src/components/write/PostMediaGalleryItem.tsx#L31) | `button` | C | itemSize | — | imagePlaceholder | 선택 번호12/900 | 0.82 | itemSize |
| 117 | 보관함·카메라 타일 | [components/write/PostMediaGalleryList.tsx:103](../apps/mobile/src/components/write/PostMediaGalleryList.tsx#L103) | `cameraItem` | B | itemSize | — | mediaSheet | — | 0.72 | itemSize |
| 118 | 보관함·닫기 | [components/write/PostMediaPickerHeader.tsx:36](../apps/mobile/src/components/write/PostMediaPickerHeader.tsx#L36) | `sideButton` | B | 최소44 | — | 없음 | — | 0.6 | 최소52 |
| 119 | 보관함·다음 | [components/write/PostMediaPickerHeader.tsx:54](../apps/mobile/src/components/write/PostMediaPickerHeader.tsx#L54) | `sideButton` | A | 최소44 | — | 없음 | 15/700 | 0.6 | 최소52 |
| 120 | 보관함·권한 다시 선택 | [components/write/PostMediaPickerLimitedNotice.tsx:36](../apps/mobile/src/components/write/PostMediaPickerLimitedNotice.tsx#L36) | `button` | A | 없음(py spacing.md=12) | radius.sm=12 | accent | 13/900 | 0.82 | 내용 |
| 121 | 보관함·앨범 선택 | [components/write/PostMediaPickerToolbar.tsx:34](../apps/mobile/src/components/write/PostMediaPickerToolbar.tsx#L34) | `albumButton` | C | 최소34 | — | 없음 | 15/900 | 0.7 | flex1 |
| 122 | 보관함·사진/영상 전환 | [components/write/PostMediaPickerToolbar.tsx:50](../apps/mobile/src/components/write/PostMediaPickerToolbar.tsx#L50) | `actionButton` | C | 최소34 | 17 | overlayInk | 12/700 | 0.7 | 내용 |
| 123 | 보관함·여러 장 선택 | [components/write/PostMediaPickerToolbar.tsx:72](../apps/mobile/src/components/write/PostMediaPickerToolbar.tsx#L72) | `actionButton`, `multiSelectButtonActive` | C | 최소34 | 17 | overlayInk/선택 accent | 12/700 | 0.7 | 내용 |
| 124 | 자르기·비율 도구 | [components/write/PostMediaPreview.tsx:50](../apps/mobile/src/components/write/PostMediaPreview.tsx#L50) | `ratioButton` | B | 38 | 19 | mediaControlBg | — | 0.7 | 38 |
| 125 | 보관함·영상 타일 | [components/write/PostVideoGalleryItem.tsx:37](../apps/mobile/src/components/write/PostVideoGalleryItem.tsx#L37) | `button` | C | itemSize | — | imagePlaceholder | 영상 길이11/700 | 0.82 | itemSize |
| 126 | 영상 보관함·음소거 | [components/write/PostVideoPickerPreview.tsx:50](../apps/mobile/src/components/write/PostVideoPickerPreview.tsx#L50) | `soundButton` | B | 38 | 19 | mediaControlBg | — | 0.72 | 38 |
| 127 | 게시물 작성·취소 | [components/write/WriteHeader.tsx:25](../apps/mobile/src/components/write/WriteHeader.tsx#L25) | `headerButton` | A | 40 | 14 | navBackground | 14/900 | 0.72 | 최소58+내용 |
| 128 | 게시물 작성·게시 | [components/write/WriteHeader.tsx:37](../apps/mobile/src/components/write/WriteHeader.tsx#L37) | `submitButton` | A | 40 | 14 | accent | 14/900 | 0.72 | 최소58+내용 |
| 129 | 게시물 작성·영상 선택 | [components/write/WriteMediaSection.tsx:62](../apps/mobile/src/components/write/WriteMediaSection.tsx#L62) | `videoPickButton` | C | 48 | 16 | navBackground | 14/900 | 0.72 | 부모 전체 |
| 130 | 게시물 영상·삭제 | [components/write/WriteVideoPreview.tsx:40](../apps/mobile/src/components/write/WriteVideoPreview.tsx#L40) | `removeVideoButton` | B | 34 | 17 | mediaControlBg | — | 0.72 | 34 |
| 131 | 게시물 영상·음소거 | [components/write/WriteVideoPreview.tsx:52](../apps/mobile/src/components/write/WriteVideoPreview.tsx#L52) | `soundButton` | B | 36 | 18 | mediaControlBg | — | 0.72 | 36 |
| 132 | 내 활동·분류 탭 [선택기] | [screens/activity/MyActivityScreen.tsx:153](../apps/mobile/src/screens/activity/MyActivityScreen.tsx#L153) | `tab`, `activeTab` | A | 38 | 999 | surfaceGlass/선택 accent | 13/900 | 없음 | 내용 |
| 133 | 로그인·제출 | [screens/auth/LoginScreen.tsx:108](../apps/mobile/src/screens/auth/LoginScreen.tsx#L108) | `primaryButton` | A | 52 | 18 | accent | 15/900 | 없음 | 폼 전체 |
| 134 | 온보딩·닉네임 확인 | [screens/auth/OnboardingScreen.tsx:141](../apps/mobile/src/screens/auth/OnboardingScreen.tsx#L141) | `checkButton` | A | 52 | 18 | accentTintBg | 13/900 | 0.82 | 입력칸 옆 내용 |
| 135 | 온보딩·약관 동의 체크 | [screens/auth/OnboardingScreen.tsx:189](../apps/mobile/src/screens/auth/OnboardingScreen.tsx#L189) | `checkbox`, `checkboxOn` | C | 22 | 7 | navBackground/선택 accent | — | 없음 | 22 |
| 136 | 온보딩·시작 | [screens/auth/OnboardingScreen.tsx:218](../apps/mobile/src/screens/auth/OnboardingScreen.tsx#L218) | `primaryButton` | A | 54 | 18 | accent | 15/900 | 0.82 | 폼 전체 |
| 137 | 탐색·게시물 타일 | [screens/explore/ExploreScreen.tsx:197](../apps/mobile/src/screens/explore/ExploreScreen.tsx#L197) | `tile` | C | tileHeight | 20 | neutralFill | 조회수12/800 | 없음 | tileWidth |
| 138 | 릴스·뒤로 | [screens/feed/ReelsScreen.tsx:341](../apps/mobile/src/screens/feed/ReelsScreen.tsx#L341) | `backButton` | B | 44 | — | 없음 | — | 없음 | 44 |
| 139 | 채팅방·더보기 | [screens/messages/ChatRoomScreen.tsx:221](../apps/mobile/src/screens/messages/ChatRoomScreen.tsx#L221) | `headerMenuButton` | B | 40 | 16 | navBackground | — | 0.75 | 40 |
| 140 | 메시지·전체 탭 [선택기] | [screens/messages/MessagesScreen.tsx:86](../apps/mobile/src/screens/messages/MessagesScreen.tsx#L86) | `tab`, `tabActive` | A | 40 | 14 | 선택 accent/그 외 없음 | 14/900 | 없음 | 동일 flex1 |
| 141 | 메시지·요청 탭 [선택기] | [screens/messages/MessagesScreen.tsx:100](../apps/mobile/src/screens/messages/MessagesScreen.tsx#L100) | `tab`, `tabActive` | A | 40 | 14 | 선택 accent/그 외 없음 | 14/900;배지11/900 | 없음 | 동일 flex1 |
| 142 | 알림·뒤로 | [screens/notifications/NotificationsScreen.tsx:43](../apps/mobile/src/screens/notifications/NotificationsScreen.tsx#L43) | `backButton` | B | 40 | 16 | navBackground | — | 없음 | 40 |
| 143 | 알림·모두 읽음 | [screens/notifications/NotificationsScreen.tsx:52](../apps/mobile/src/screens/notifications/NotificationsScreen.tsx#L52) | `markAllButton` | A | 36 | 999 | navBackground | 12/900 | 0.7 | 내용 |
| 144 | 설정·차단 해제 | [screens/settings/BlockedAccountsScreen.tsx:115](../apps/mobile/src/screens/settings/BlockedAccountsScreen.tsx#L115) | `unblockButton` | A | 36 | 12 | navBackground | 12/900 | 0.7 | 내용 |
| 145 | 설정·하위 화면 이동 행 | [screens/settings/SettingsScreen.tsx:43](../apps/mobile/src/screens/settings/SettingsScreen.tsx#L43) | `row` | C | 50 | 14 | 없음 | 14/900 | 배경 accentSoft | 부모 전체 |
| 146 | 설정·로그아웃 | [screens/settings/SettingsScreen.tsx:152](../apps/mobile/src/screens/settings/SettingsScreen.tsx#L152) | `row` | A | 50 | 14 | 없음 | 14/900 | 배경 accentSoft | 부모 전체 |
| 147 | 설정·계정 삭제 | [screens/settings/SettingsScreen.tsx:162](../apps/mobile/src/screens/settings/SettingsScreen.tsx#L162) | `row` | A | 50 | 14 | 없음 | 14/800 | 배경 accentSoft | 부모 전체 |
| 148 | 스토리 작성·닫기 | [screens/stories/StoryCreateScreen.tsx:126](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx#L126) | `overlayIconButton` | B | 46 | 23 | scrimWeak | — | 0.7 | 46 |
| 149 | 스토리 작성·배경색 도구 | [screens/stories/StoryCreateScreen.tsx:141](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx#L141) | `overlayIconButton` | B | 46 | 23 | scrimWeak | — | 0.7 | 46 |
| 150 | 스토리 작성·공유 | [screens/stories/StoryCreateScreen.tsx:158](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx#L158) | `shareButton` | A | 54 | 27 | colors.accent | 13/900 | 0.7 | 최소54+내용 |
| 151 | 스토리 작성·색 선택 바깥 닫기 | [screens/stories/StoryCreateScreen.tsx:186](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx#L186) | 직접/전달 스타일 | C | 전체 덮개 | — | 부모 배경 | — | 없음 | 전체 |
| 152 | 스토리 작성·색상 스와치 | [screens/stories/StoryCreateScreen.tsx:199](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx#L199) | `colorButton`, `colorButtonSelected` | C | 52 | 26 | 색상 배열;선택 테두리 white | — | 없음 | 52 |
| 153 | 댓글·본문 멘션 링크 | [components/comments/CommentRow.tsx:89](../apps/mobile/src/components/comments/CommentRow.tsx#L89) | `mention` | C | 본문 행 | — | 없음 | 14/800(본문 상속 포함) | 없음 | 인라인 |
| 154 | 온보딩·이용약관 링크 | [screens/auth/OnboardingScreen.tsx:201](../apps/mobile/src/screens/auth/OnboardingScreen.tsx#L201) | `agreeLink` | C | 본문 행 | — | 없음 | 12/900 | 없음 | 인라인 |
| 155 | 온보딩·개인정보 링크 | [screens/auth/OnboardingScreen.tsx:208](../apps/mobile/src/screens/auth/OnboardingScreen.tsx#L208) | `agreeLink` | C | 본문 행 | — | 없음 | 12/900 | 없음 | 인라인 |

## 1. A만 세면 몇 가지인가

46개 구현 위치(선택기 8 포함)의 **실제로 지정된 값**을 중복 제거했다. 빈 값은 숫자 0과 구분했다.

- 고정 height: **9종** = 28, 32, 36, 38, 40, 42, 50, 52, 54.
- minHeight: **6종** = 32, 40, 42, 44, 48, 56. 고정 높이와 섞어 고유 숫자만 세면 **12종**이다. 그 밖에 높이를 지정하지 않고 패딩/텍스트로 만드는 항목이 있다.
- borderRadius: **10종** = 8, 10, 12, 13, 14, 15, 16, 18, 27, 999. 미지정까지 상태로 세면 11종. 토큰 radius.sm은 계산 결과 12로 합쳤다.
- pressed opacity: **7종** = 0.6, 0.65, 0.7, 0.72, 0.75, 0.76, 0.82. 추가로 배경 전환 2종(overlayInkFaint/accentSoft), 명시적 효과 없음이 있다.
- 선택기 8곳을 제외한 실행 버튼 38곳만 보면 고정 높이 **8종**(정렬 버튼 28 제외), minHeight **5종**(탭 최소48 제외), 반경 **8종**(8·15 제외)이다. pressed opacity는 여전히 7종이다.

### 114와 무엇이 다른가

`docs/REFACTOR_PLAN.md`의 114는 과거 **스타일 정의 수**이지 실제 버튼 수가 아니다. 당시 집계 명령·전체 목록은 문서에 없어 그 114의 정확한 포함 조건까지는 재현·확정할 수 없다.

이번에는 TS AST에서 **이름에 대소문자 button이 들어가는 객체형 속성 정의**를 세면 **106개**다. buttonText 같은 스타일이 객체로 있으면 포함되고, pressed/disabled 파생 스타일과 스켈레톤·미사용 정의도 섞이는 집계다. 따라서 114→106을 버튼 8개 삭제로 해석하면 안 된다.

실제 요소 155와도 단위가 다르다. item/row/tab/sideButton 하나가 여러 버튼에 쓰이기도 하고, 버튼 하나가 여러 스타일을 합치기도 한다. 이번 표는 정의명이 아니라 **JSX의 내용과 연결된 동작**으로 분류했다. 다시 계산할 때는 현재 작업 트리의 Pressable 시작/자기닫힘 요소를 각각 1회만 세고, Text의 직접 onPress 3곳을 더하면 된다.

## 2. radius 토큰 사용은 정말 한 곳인가

**현재도 실제 소비 지점은 1곳이다.** `components/write/PostMediaPickerLimitedNotice.tsx:78`의 `borderRadius: radius.sm`(12). theme 자체 정의는 소비로 세지 않는다.

검색되는 다른 radius는 SkeletonBlock의 props나 내부 PILL_METRICS.radius 등이며 theme.radius 소비가 아니다. 일반 Button에 토큰을 도입하더라도 현재 숫자 13·14·18을 기존 sm12/md16에 자동 치환하면 디자인이 바뀐다. 새 공통 규격을 승인한 뒤 치환해야 한다.

## 3. pressed opacity 19종인가

**현재의 실제 눌림 효과는 19종이 아니라 11종**이다: 0.6, 0.62, 0.65, 0.68, 0.7, 0.72, 0.75, 0.76, 0.78, 0.8, 0.82. 이 값은 pressed 경로에 연결된 스타일 **55개 정의**에서 확인했다. 정의 수와 표의 호출 위치 수는 다르다.

소스의 숫자 리터럴 opacity를 상태 구분 없이 세면 **22종**(0과 1 포함, 둘을 빼면 20종)이다. 여기에 disabled 0.4/0.45/0.5/0.55/0.95, 삭제·낙관적 메시지, 드래그 0.85, 숨김 0, 상시 글자 투명도가 섞인다. 기존 '19종'은 현재 pressed 값의 근거로 쓸 수 없다.

통일 검토 후보는 다음과 같다. **같은 역사적 의도였다는 근거는 없으며**, 지금 역할이 비슷하다는 디자인 판단이다.

- 크루 관리/프로필 관계 버튼 0.7(#71~72)과 추천 크루 요청 0.72(#87): 관계를 만드는 명령.
- 프로필 편집 0.75(#73)와 게시물 취소·게시 0.72(#127~128): 실행 버튼 피드백.
- 비밀번호 제출 0.76(#90), 온보딩 제출 0.82(#136), 로그인 효과 없음(#133): 폼 제출인데 서로 다르다.
- 미디어 타일 0.82, 스토리 카드 0.8, 공유 게시물 카드 0.78은 A 버튼 문제가 아니다. 글자 버튼 정리와 함께 덮어쓰지 않는다.

## 4. 네 종류 제안은 맞는가

**'큰 채움52 / 보통 채움44 / 작은 알약32 / 테두리만'을 그대로 확정하는 것은 목록과 맞지 않는다.**

- 52는 큰 폼뿐 아니라 닉네임 확인에도 쓰인다. 폼 제출은 50/52/54로 나뉜다.
- A에 **고정 높이44는 없다.** 최소44인 보관함 '다음'은 채움 버튼도 아니다. 일반 관계/행 버튼은 36/38/40/42다.
- 높이32인 추천 요청은 radius10이지 알약999가 아니다. 알약은 36/38 또는 패딩 높이로도 존재한다.
- **A 중 외곽 테두리만 있는 독립 버튼을 찾지 못했다.** 메뉴의 아래 구분선은 outline 버튼이 아니다. Google 로그인 테두리는 C이며 흰색 채움도 있다.

디자이너가 시작할 분류는 다음 **5개 역할군**을 제안한다. 아직 확정 규격이 아니며 px 변경 승인도 아니다.

1. **폼 주요 실행**: 로그인/시작/비밀번호 변경. 폼 너비 전체, 현재50~54. 기준52의 타당성을 검토.
2. **행 안 실행**: 닉네임 확인/관계/수락/차단 해제/프로필 편집. 너비는 내용 또는 행 분할. 현재36~42와 닉네임 확인52를 함께 비교.
3. **작은 문맥 실행**: 추천 요청/앨범 재시도/메타 '모두 읽음'. 32 전후와 알약 여부는 별도 결정.
4. **글자형 명령**: 헤더 다음/저장/더보기/답글. 배경 없음, 터치 영역과 글자 크기를 별개로 정의.
5. **시트 메뉴 행**: 공용 ActionSheet/ConfirmDialog의 최소56. 구분선·danger·마지막 행 처리를 가진 별도 MenuItem 성격.

Button의 크기와 appearance(solid/soft/ghost), 너비(full/content/flex)는 독립 축으로 설계하는 편이 맞다. **탭/공개범위/비율 선택기 8곳은 별도 선택 컴포넌트**, C의 카드와 미디어 도구는 별도 검토다. 권한 안내·코치마크·스토리 플로팅 실행은 위 역할에 무리하게 맞추기 전에 배경 맥락부터 확인해야 한다.

## 5. 묶으면 안 되는 예외

- **인스타식 축소 묶음**: BottomTabBar 일반44/+46, 바54·아이콘25 관련 의도; HomeHeader 44 및 의도적으로 없앤 원형 배경; FeedPostActions stroke2와 카운트13/700; UserInline 메타12/500; StoryBar100×140. 표의 [의도] 항목이다. 숫자 표준화만으로 되돌리지 않는다. 근거: `docs/DECISIONS.md` 「코드에 박힌 의도된 값」 및 각 컴포넌트의 의도 주석.
- **시트의 동작 계약**: ActionSheet/ConfirmDialog 메뉴 행 최소56은 현재 한 모양이다. 댓글의 네이티브 애니메이션 none·종료 위치 유지, 공유의 스냅 제스처는 버튼 공용화와 무관하다. BottomSheet 덮개 C도 일반 Button이 아니다.
- **카메라 셔터와 미디어**: 셔터78·링, 카메라 제스처 투명판, 썸네일 드래그, 전체 영상 터치 영역은 각각 촬영/제스처/콘텐츠 계약이다. 아이콘 버튼과도 무리하게 합치지 않는다.
- **고정색/미디어 위 버튼**: 카메라·스토리의 scrim/onMediaFill/white는 일반 배경 위 accent와 다른 맥락이다. Google 브랜드 버튼의 white·브랜드 자산도 테마 반전 버튼으로 자동 교체하지 않는다.
- **선택 vs disabled vs pressed**: 선택 탭의 accent, 요청 중 비활성 0.95, 삭제 중 0.5, 드래그 0.85는 pressed 값이 아니다. 유사 숫자라는 이유로 묶으면 상태 구분을 잃는다.
- **접근성 터치 크기**: 최소40·44, hitSlop이 아이콘/텍스트 실제 크기와 다르다. 글자 없는 padding을 제거하거나 최소 크기를 고정 높이로 바꾸지 않는다.

## 새로 확인한 점과 한계

- 질문의 예시 중 릴스 actionButton은 내부 iconBox가 32이고, 좋아요/댓글은 숫자까지 있어 C다(#52~53). 공유·저장·음소거만 B다.
- PostMediaPickerToolbar actionButton에는 실제로 **아이콘+글자**가 있다(#122~123). 현재 코드는 아이콘 단독 B가 아니다.
- 스타일 이름 조사에는 `screens/write/WriteScreen.tsx`의 headerButton/submitButton/disabledButton처럼 현재 JSX에서 쓰지 않는 잔존 정의도 들어간다. 화면의 실제 버튼은 WriteHeader(#127~128)에 있다. 스켈레톤의 button 모양 역시 실행 버튼이 아니다.
- A에는 '테두리만' 대신 배경 없는 명령과 시트 메뉴 행이 많이 있다. 반대로 Google 로그인·영상 선택·링크 추가는 C지만 향후 Icon+LabelButton 후보가 될 수 있어 디자이너 판단이 필요하다.
- **소스 정적 조사**다. 폰트 배율·화면 크기에 따른 최종 터치 사각형과 체감 눌림 효과는 실기기 측정하지 않았다. 호출부 주입 스타일/동적 그리드 크기는 표에서 명시했다. '코드에 존재'와 '현재 배포되어 사용자에게 노출'은 같지 않다.
- 웹 `src/`는 범위 밖으로 조사하지 않았다.

## 재분류: 배경·폭·위치·동작 계약 (2026-09-18)

**이 절이 후속 Button 작업의 기준이다.** 앞의 155행 표와 9/17 판단은 조사 이력으로 그대로 남긴다. 특히 앞의 '5개 역할군'은 초안이며, 아래 분류로 대체한다. 표에서 발견한 폭·위치의 오류도 원본 표를 덮어쓰지 않고 여기서 정정한다. 현재 작업은 문서 갱신뿐이며 아래 권장치도 아직 적용하지 않았다.

### 범위와 수량

- 기존 A 46곳에서 선택기 8곳(#42·64·65·70·105·132·140·141)을 제외하면 38곳이다.
- 스토리·채팅 전용 A 3곳(#15 채팅 요청 수락, #96 스토리 갤러리 대안, #150 스토리 공유)을 제외하면 **검토 대상 35곳**이다.
- 이 중 **공용화 후보 10묶음·25곳**, **일반 Button으로 묶지 않을 별도 계약 10곳**으로 나눈다. 빠진 항목이나 중복 합산은 없다.
- **댓글 A 3곳(#22·25·27)은 포함**한다. 댓글의 아이콘 보내기 B와 좋아요+숫자 C는 범위 밖이다.
- 기존 B 45곳·C 64곳은 편입하지 않는다. 재검토에서 버튼 성격이 확인돼도 이번 범위를 늘리지 않는다.
- #59는 DM을 보내지만 위치는 **게시물 공유 시트**다(`PostShareSheet.tsx:157`). 채팅방 UI가 아니므로 포함한다. #72의 '메시지'도 프로필 안의 실행 버튼이라 포함한다. 분류는 호출되는 API가 아니라 보이는 화면 기준이다.
- #14 카메라 권한은 게시물·스토리 공용이므로 검토는 하되 아래에서 공용화 보류한다. #40 StateView도 채팅방에서 쓴다(`screens/messages/ChatRoomScreen.tsx:262`). **후속 구현 시 제외 화면을 건드리지 않도록 기본 동작은 보존하고, 대상 호출부만 새 버튼을 선택적으로 사용해야 한다.** 전역 스타일 교체는 허용하지 않는다.
- 개수는 기존 표와 같이 구현 위치 단위다. #71·72에는 여러 배경/상태 분기가 있어도 각각 1곳이다. '10묶음'은 디자인 검토 그룹 수이지 새 컴포넌트 10개를 만들라는 뜻이 아니다.

### 높이로 묶으면 안 되는 이유

사용자가 지적한 네 사례를 판단 오류의 예로 남긴다.

| 사례 | 높이로 분류하면 생기는 오류 | 호출부를 읽은 결론 |
|---|---|---|
| 설정 로그아웃·탈퇴 #146·147 | 50이라 폼 제출로 묶음 | `SettingsScreen.tsx:150` 카드 안의 목록 줄. 같은 `row`를 쓰는 하위 화면 이동 행과 맞춰야 한다. 배경 없음·부모 전체·좌측 정렬을 유지한다. |
| 닉네임 중복확인 #134 | 52라 큰 주요 제출로 묶음 | `OnboardingScreen.tsx:131` nicknameRow의 입력 옆 내용 폭. accentTintBg와 accent 글자다. 폼 제출과 달리 입력의 최소52와 나란히 놓인다. |
| 스토리 공유 #150 | 54라 폼 전체 폭으로 바꿈 | 미디어 위 내용 폭 버튼이다. 이번에는 스토리 자체가 제외 범위이므로 규격도 바꾸지 않는다. |
| 프로필 편집 저장 #78 | 40이라 채움 행 버튼으로 묶음 | `ProfileEditScreen.tsx:109` ScreenHeader.right에 들어가며 `ScreenHeader.tsx:104` rightSlot도 40×40이다. 배경 없이 accent 글자만 둔다. 버튼에 채움/내용 폭을 넣으면 헤더 계약이 깨진다. |

**높이는 분류 결과다.** 먼저 ①채움/연한 채움/없음 → ②폭의 결정 주체 → ③붙는 위치 → ④높이 계산 방식 → ⑤실행·로딩·닫힘·이벤트 계약을 확인하고, 마지막에 수치를 제안한다.

### 최종 공용화 후보 목록

아래 표의 배경 분기는 의도적으로 보존한다. 특히 동일 구현인 #71·72를 primary/secondary로 따로 세지 않는다. accent와 연한 채움을 하나의 색으로 통일한다는 뜻이 아니라, 같은 UI 껍데기의 명시적인 appearance 분기로 표현할 수 있다는 뜻이다.

| 묶음 | 수 | 속한 버튼(기존 표 번호) | 배경 → 폭 → 위치 | 한 UI로 묶을 수 있는 근거와 남길 계약 |
|---|---:|---|---|---|
| G1 폼 제출 | 3 | #90 비밀번호 변경, #133 로그인, #136 온보딩 시작 | accent → 폼 내부 전체 → 입력 폼의 마지막 실행 | 한 줄 label/onPress/disabled 조합. '변경 중/로그인 중/저장 중', Google 로그인과의 동시 비활성, 약관 동의 판정은 호출부 소유다. 모두 폼은 카드 안에 있으므로 화면 가로 끝까지 늘리지 않는다. |
| G2 카드 내부 주요 실행 | 2 | #68 승격 신청, #87 추천 크루 요청 | accent(승격 비활성은 neutralFill) → 카드 내부 전체 → 설명/사용자 카드 아래 | 카드 너비를 따른다는 공통점. 승격의 상태 문구·한 줄 제한·비활성 색은 호출부가 정한다. 추천 요청은 중첩 Pressable 안이므로 **event.stopPropagation()을 유지**해야 한다. 버튼은 이벤트를 버리지 않고 전달해야 한다. |
| G3 관계·대상 행 안 실행 | 4 | #59 공유 대상 보내기, #71 크루 관리, #72 프로필 관계의 실행 상태, #144 차단 해제 | primary accent / secondary navBackground·chipFill → 내용+기존 최소폭 → 사용자 행·프로필 동작 줄 | 클릭 콜백과 비활성 표시만 UI가 받는다. #59는 전송 중 전체 대상 잠금, #71은 isBusy, #72는 콜백 없음도 비활성, #144는 즉시 해제가 아니라 확인창 열기다. 서버 처리·확인창·잠금 범위는 공용 버튼이 만들지 않는다. #72의 비실행 상태는 아래에 별도 명시한다. |
| G4 내 프로필 분할 실행 | 2 | #73 프로필 편집, #74 인사이트 | chipFill → flex 분할 → 프로필 정보 아래 | 같은 스타일·같은 부모 행이다(`ProfileContent.tsx:83`). 인사이트가 없으면 편집 하나가 줄을 채운다. 고정 반폭이나 내용 폭으로 바꾸지 않는다. |
| G5 입력 옆 보조 실행 | 1 | #134 닉네임 중복확인 | accentTintBg → 내용 → 입력칸 옆 | label/disabled/onPress는 일반 버튼으로 표현 가능하나 입력과의 세로 정렬·간격8·가로 padding14는 별도 배치 계약이다. G1의 fullWidth를 물려주지 않는다. |
| G6 채움형 헤더 실행 | 3 | #127 작성 취소, #128 게시, #143 알림 모두 읽음 | 취소/모두 읽음 navBackground, 게시 accent → 내용+기존 최소폭 → 헤더 | 눌림·disabled·label을 UI로 분리 가능. 취소는 제출 중 잠금, 게시의 '업로드 중'은 폭이 늘 수 있다. 헤더 제목과 공간 배분은 호출부가 유지한다. 모두 읽음에 새 비동기 잠금을 임의로 추가하지 않는다. |
| G7 중앙 안내 실행 | 2 | #40 StateView action, #120 보관함 권한 다시 선택 | accent → 내용 → 빈 상태/그리드 아래 안내 | 문구와 요청 로직은 부모 소유. 같은 13/900 글자와 세로 padding12를 사용한다. #120의 hitSlop8·disabled·접근성 상태를 유지한다. #40은 **대상 화면에서만 선택적 적용**해야 채팅 제외를 지킨다. |
| G8 오류 줄 재시도 | 1 | #114 앨범 다시 시도 | overlayInk → 내용 → 앨범 시트의 오류 문장 옆 | 오류 문장이 flex1, 버튼은 내용 폭이다(`PostMediaAlbumPicker.tsx:121,195`). 중앙 StateView로 옮기거나 줄 전체를 채우면 안 된다. 일반 UI에 모양만 위임 가능하다. |
| G9 배경 없는 문맥 명령 | 5 | #22 댓글 답글 취소, #25 답글 달기, #27 답글 보기/숨기기, #82 검색 모두 지우기, #111 앨범 모두 보기 | 없음 → #22·82·111 내용 / #25·27 부모 stretch → 답글 배너·댓글 아래·섹션 머리글 | **채움 Button이 아니라 TextAction** 후보. 텍스트·pressed·hitSlop과 callback만 공통화한다. #25 Text의 marginLeft44/marginTop6, #27 바깥 marginLeft80/paddingY4는 위치 계약으로 남긴다. 답글 입력/펼침 상태는 호출부 소유다. |
| G10 헤더 글자 터치 슬롯 | 2 | #78 프로필 저장, #119 보관함 다음 | 없음, accent 글자 → #78 고정 슬롯 / #119 최소폭 → 헤더 | **HeaderTextAction** 후보. #78은 저장 중 '...', #119는 ActivityIndicator로 내용 교체 및 hitSlop8이다. 슬롯 규격을 각각 전달하고 스피너를 이유로 B로 재분류하지 않는다. 배경·padding을 자동으로 넣지 않는다. |

제안하는 구현 방향은 **G1~G8의 채움 UI 18곳**, **G9 TextAction 5곳**, **G10 HeaderTextAction 2곳**이다. 공용 UI는 단순 표시·터치 계약만 가진다. 단일 사용 그룹(G5/G8)을 위해 별도 파일을 늘릴 필요는 없다. 반대로 설정 행과 콘텐츠 카드를 수용하려고 Button에 임의 children/자동 닫기/본문 측정/상태 머신까지 넣지는 않는다.

### 일반 Button으로 묶지 않을 것: 10곳

이것은 조사 범위에서 누락시킨 것이 아니라, 검토 후 일반 Button의 대상에서 제외한 목록이다.

| 대상 | 수 | 제외 이유와 유지할 소유자 | 치수 제안 |
|---|---:|---|---|
| #28 ActionSheet, #33·34 ConfirmDialog | 3 | 메뉴 행이다. 아래 구분선·마지막 행·danger가 있고 ActionSheet는 item.onPress 후 onClose, ConfirmDialog는 onConfirm/onCancel만 호출한다. canCancel=false도 있다. 겉모양은 같아도 **자동 닫힘 계약을 통일하면 안 된다**. 시트 전용 MenuItem의 표현부 공용화는 별도 작업이며 스토리·채팅 호출도 있다. | 기존 최소56, 가로20, 세로0 유지. 변화0. |
| #146·147 설정 로그아웃·탈퇴 | 2 | 설정 목록의 row이며 확인창을 연다. 일반 폼 버튼이 아니라 SettingsRow의 명령 변형이다. C인 기존 이동 행 #145와 함께 별도 검토해야 하고 이번에 C를 편입하지 않는다. | 기존 높이50, 가로14 유지. 변화0. |
| #37 본문 더보기 | 1 | ExpandableText의 onTextLayout 측정/접힘 판정/숨김·본문 탭과 연결된다. 피드와 릴스에서 서로 다른 moreStyle을 받는다. 단순 명령처럼 보여도 이번 Button 규격에서 텍스트 흐름·터치 폭을 바꾸지 않는다. | 높이 없음·기존 텍스트 marginTop4·hitSlop6 유지. 변화0. |
| #43 외부 공유 | 1 | label+URL 두 줄. **시트 내부가 아니라 overlayContent의 고정 푸터**에 있다. safe area·onLayout 높이 측정·목록 bottom padding·닫힘 애니메이션이 연결된다(`PostShareSheet.tsx:60,91,101`). 일반 한 줄 버튼으로 압축하지 않는다. | 기존 세로12/가로14와 두 줄 간격3 유지. 변화0. |
| #31·32 코치마크 건너뛰기/다음 | 2 | 흰 tooltip 위 고정 검정 글자/검정 채움이다. 위치 측정·단계 진행과 연결된 짝이며 일반 테마 accent 버튼이 아니다. 자체 표시를 유지한다. | 기존 최소40, 가로14/18, 세로0 유지. 변화0. |
| #14 카메라 권한 | 1 | 실제로는 라이브 영상 위가 아니라 **검정색 권한 화면**이다(`CameraPermissionView.tsx:93`). onMediaFillStrong+검정 글자는 일반 accent/onAccent 조합과 다르다. 권한 재요청/설정 분기·alternativeSlot, 스토리와 공용이라는 계약도 있다. | 기존 세로12/가로24 유지. 변화0. |

#72 안의 `disabled label="신청됨"`(`ProfileConnectionActions.tsx:94`)과 `disabled label="크루 ✓"`(:138)는 **실행 버튼이 아닌 상태 표시**다. #68도 심사 중/승인 완료 상태에서는 실행하지 않는다. 새로운 공용 버튼이 disabled를 풀거나 콜백을 만들어서는 안 된다. 이들은 별도 Pressable 정의가 아니라 기존 분기이므로 위 수량에 추가하지 않았다.

### 추가 오분류와 호출부에서 찾은 사실

사용자가 지적한 네 사례 외에 이번에 확인한 내용이다.

1. **#25 댓글 답글 달기, #27 답글 펼치기**: 기존 표의 '내용 폭'은 부정확하다. #25는 `CommentRow.tsx:75,102,144`의 flex1 main 안에서 가로 stretch되고, 들여쓰기는 Pressable이 아니라 **Text**에 있다(:165). #27은 기본 column View 안에서 marginLeft80을 제외한 가로 영역으로 늘어난다(`CommentThread.tsx:136,143`). 공통 TextAction에 alignSelf:flex-start를 강제로 넣으면 기존 터치 영역이 줄어든다.
2. **#37 더보기**도 기본 View 아래 Pressable이 가로 stretch된다(`ExpandableText.tsx:35,61`; `FeedPostContent.tsx:20`). 기존 '내용 폭' 표기는 글자 폭과 터치 폭을 혼동했다. hitSlop6도 있다. 이 재분류에서는 별도 계약으로 뺐다.
3. **#43 외부 공유**의 위치는 '시트 내부 전체'가 아니라 **시트 밖 고정 푸터의 내부 전체**다. 두 줄 문구와 동적 푸터 높이를 갖기 때문에 액션 label 한 줄만으로 추상화하면 안 된다.
4. **#72 신청됨/크루 표시**는 실행 버튼이 아니다. 반면 #144 차단 해제는 누르면 즉시 서버 처리하는 버튼이 아니라 확인창 진입이다. 색·폭이 비슷하다고 실행·대기 규칙을 버튼 내부에서 통일하면 동작이 바뀐다.
5. **#87 추천 요청**은 눌리는 카드 안에 또 눌리는 버튼이 있고 stopPropagation이 있다(`RecommendedCrewCard.tsx:77`). onPress를 인자 없는 콜백으로만 다시 감싸면 호출부의 이벤트 차단을 보존하기 어렵다.
6. **#119 다음**은 헤더의 배경 없는 글자/스피너 슬롯이다. 배경의 accentSoft는 헤더 전체의 색이지 버튼 채움이 아니다. loading 때 아이콘처럼 보여도 글자 버튼의 같은 실행 계약이다.
7. **카메라 권한과 코치마크의 색**은 채움이라는 공통점만으로 accent로 바꿀 수 없다. 특히 권한 화면을 '영상 위 작은 버튼'으로 해석한 것도 부정확하다.
8. **B/C의 반대 사례**: Google 로그인 #8, 링크 추가 #76, 영상 선택 #129는 행동상 분명한 버튼이나 아이콘+글자라 기존 기준 C다. **이번에는 편입하지 않는다.** 최근 검색어 #83도 Text만 있지만 `SearchScreen.tsx:97`에서 프로필로 이동하는 검색 결과 행이며 `recentLabel.flex=1`이다. '글자만 있다'는 이유로 명령 Button으로 바꾸지 않는다. B에서 글자 실행 버튼으로 옮겨야 할 근거는 이번 호출부 확인에서 찾지 못했다.

A는 '글자가 있는 터치 요소'라는 1차 분류일 뿐, 전부 같은 Button으로 교체 가능하다는 인증이 아니다. C도 버튼 기능이 없다는 뜻이 아니다.

### 질문 ①: 고정 높이와 패딩 중 무엇을 택하는가

**공용화와 크기 통일은 별개다. 두 방식은 섞어도 되지만, 호출부마다 임의로 섞지 않고 용도를 명시해야 한다.**

- 일반 채움 실행(G1~G6)은 **minHeight + paddingVertical**을 기본 제안한다. 기준 높이를 확보하면서 글자 확대/긴 문구가 필요로 하는 만큼 커질 수 있다. 고정 height만 쓰면 커진 글자를 담을 수 없고, 패딩만 쓰면 폼·동작 줄의 정렬 기준이 없어진다.
- 중앙 안내(G7)는 같은 글자 스타일·세로12로 이미 일관돼 있으므로 **내용 높이+패딩 방식 유지**가 타당하다. 기준 높이를 하나 더 넣을 근거가 없다. 기존 fontSize13인데 '높이37'이라고 단정하지 않는다.
- G8의 짧은 오류 행은 **현재 minHeight32 + 가로 padding**을 유지한다. G9는 글자/배치 규칙 자체를 보존한다. G10은 **헤더가 정한 슬롯**을 사용한다.
- 공용 UI가 높이 계산 모드를 받을 수는 있다. 다만 고정 height, minHeight, padding을 동시에 무제한 덮어쓰게 하지 말고 **최소높이형 / 내용형 / 헤더 슬롯형**을 구분해야 한다. 폼 내용형을 슬롯 안에 넣는 것은 허용하지 않는다.
- 채팅 수락 #15는 이번 제외 범위다. 공유 대상 #59의 패딩9와 중앙 안내의 패딩12는 둘 다 accent지만 붙는 위치가 달라 같은 높이를 강요하지 않는다.
- 글자 자동 축소나 font scaling 차단으로 고정 높이에 억지로 맞추는 안은 제안하지 않는다. 슬롯형은 확대 글자/375px에서 별도 확인해야 한다.

### 질문 ②·③: 어디까지 한 컴포넌트인가

위의 추가 오분류가 질문②에 대한 답이다. 질문③의 기준은 **표시·터치를 공유하되 비즈니스 동작은 공유하지 않는 것**이다.

- onPress 이벤트, disabled, 접근성 label/state, loading 시 표시 내용, 터치 확대를 전달할 수 있으면 G1~G8의 기본 터치 UI는 공유 가능하다. 새 onPress를 자동 실행하거나 성공 후 닫기·라우팅·비동기 잠금 정책을 내장하지 않는다.
- 관계 상태 판정·승격 승인·중복 확인·권한 요청·확인창 열기는 지금의 features/호출부에 남긴다. 같은 색이라도 이것까지 합칠 수 있다는 결론은 아니다.
- G9는 배경 없는 TextAction, G10은 HeaderTextAction으로 구분한다. 제스처/부모 폭·상속을 보존해야 하며, '모든 버튼 최소44' 같은 전역 규칙을 넣지 않는다.
- 시트 메뉴·설정 row·본문 더보기·두 줄 고정 푸터·코치마크·카메라 권한은 이번 일반 Button의 요구사항으로 끌어들이지 않는다. 모양 일부를 재사용할 가능성은 있지만 현재 범위에서는 별도 계약을 유지하는 편이 작고 안전하다.

### 분류 이후의 권장 치수와 변화량

**아래는 승인 전 디자인 제안이다.** 색·폭·위치·둥글기·글자 크기·굵기·눌림 값은 그대로 두고 높이 계산만 검토했다. '모든 화면이 실제로 몇 px 바뀐다'는 실측 결과가 아니다.

단위는 RN 논리 px. `L`은 **현재 글자·폰트 배율·가로 제약으로 실제 측정된 텍스트 박스 높이**다(줄바꿈 포함). 대부분 lineHeight가 없어 소스로 L을 숫자로 확정할 수 없다. 제안이 최소높이 M·세로패딩 P이면 `H새 = max(M, L + 2P)`이다. 기본 글자가 이 범위 안에 들어가는 조건에서만 아래 고정 변화량이 성립한다. 부모의 강제 높이/정렬 제약도 실기기에서 확인해야 한다.

| 묶음 | 권장 높이/패딩 | 버튼별 현재 → 제안, 변화량 | 가로·배치 보존 |
|---|---|---|---|
| G1 폼 제출 | minHeight52 + 세로12 | L≤28일 때 로그인52→52 **0**, 비밀번호50→52 **+2**, 온보딩54→52 **−2**. 그 밖에는 각각 max(52,L+24)−현재 높이. | 기존 폼 너비·가로패딩0·margin 유지. 입력 높이는 변경하지 않음. |
| G2 카드 내부 실행 | **한 높이로 통일하지 않음**. 승격 최소42/추천 최소32, 세로4 제안 | 승격: max(42,L+8)−max(42,L). L≤34면 **0**. 추천: max(32,L+8)−32. L≤24면 **0**. | 승격 가로14, 추천 가로0·카드 내부128·marginTop:auto 유지. 카드 전체 높이 증가 여부 별도 검증. |
| G3 행 안 실행 | minHeight40 + 세로6 | L≤28일 때 크루 관리38→40 **+2**, 프로필 관계40→40 **0**, 차단 해제36→40 **+4**. 공유 보내기는 현재 L+18이므로 **max(40,L+12)−(L+18)**. 실측 전에는 숫자 확정 불가. | 가로15/12/16/12와 최소폭58/86을 각각 유지. 사용자를 밀어내도록 fullWidth 금지. 상태 표시 분기는 기존40 유지. |
| G4 프로필 분할 | minHeight42 + 세로6 | 편집·인사이트 각각 max(42,L+12)−42. L≤30이면 **둘 다0**. | 가로0·flex1·gap8 유지. 하나만 있을 때 전체 행. |
| G5 입력 옆 확인 | minHeight52 + 세로8 | max(52,L+16)−52. L≤36이면 **0**. | 가로14·내용 폭·입력 최소52 유지. 큰 글자에서 입력과 버튼의 실제 높이는 함께 확인. |
| G6 채움형 헤더 | minHeight40 + 세로6 | L≤28일 때 취소40→40 **0**, 게시40→40 **0**, 모두 읽음36→40 **+4**. 그 밖에는 max(40,L+12)−현재 높이. | 가로12/12/14, 작성 버튼 최소폭58 유지. 알림은 이미 뒤로 버튼40이라 기본 상태에서 헤더 전체 높이는 늘지 않을 수 있음. |
| G7 중앙 안내 | **높이 미지정, 세로12 유지** | StateView·권한 다시 선택 모두 **0**. 같은 텍스트/폭을 유지하므로 현재의 L+24를 그대로 사용. | 가로18/16, 기존 radius14/12·상단 margin18/16은 그대로. 이 차이를 승인 없이 평준화하지 않음. |
| G8 오류 행 | 기존 minHeight32, 세로0 유지 | **0**. max(32,L) 그대로. | 가로12·내용 폭·오류 문장 flex1 유지. |
| G9 문맥 명령 | 높이 미지정. #27만 세로4, 나머지 세로0 유지 | 5곳 모두 **0**. Text의 margin과 기존 터치 폭을 그대로 보존하는 조건. | #25·27 stretch, 나머지 내용 폭. 검색 hitSlop6 유지. |
| G10 헤더 글자 | #78 고정40×40, #119 minHeight44/minWidth52. 세로/가로패딩0 유지 | 두 곳 모두 **0**. loading 스피너 교체 시에도 기존 슬롯 유지. | #119 hitSlop8; #78 ScreenHeader.rightSlot40×40. |

폼52는 **동일 역할로 분류된 뒤** 기본 정렬 기준으로 제안한 값이며, 52인 닉네임 확인을 G1에 편입하는 근거가 아니다. G2를32/42로 남긴 것도 카드의 밀도·상태 문구가 다르기 때문이다. 억지로 '4가지 높이만' 만드는 것이 이번 결론은 아니다.

**정적 계산 가능한 변경 후보는 5곳**: 비밀번호 +2, 온보딩 −2, 크루 관리 +2, 차단 해제 +4, 알림 모두 읽음 +4. 모두 위 L 조건을 만족할 때의 버튼 박스 변화량이다. 공유 보내기는 패딩형이라 실측 필요. 나머지 최소높이 전환도 큰 글자에서는 더 커질 수 있다. 제외한 10곳과 스토리·채팅·B/C·선택기는 변화0을 원칙으로 한다.

구현을 승인하기 전 Android/iOS 375px 및 글자 확대에서 확인할 것: 기본/로딩 높이, 긴 label 줄바꿈, 프로필 3버튼 행 넘침, 헤더 제목 겹침, 댓글 터치 폭·롱프레스 충돌, 추천 요청의 부모 카드 이동 차단, 채팅 StateView가 바뀌지 않는지. 이번에는 실기기 측정·앱 수정·새 공용 컴포넌트 생성 모두 하지 않았다.
