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
