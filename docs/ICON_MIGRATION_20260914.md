# Icon 호출부 교체 기록 (2026-09-14)

## 범위

- 앱 54개 파일, 기존 lucide JSX 호출부 89곳을 기존 공용 Icon으로 교체했다. 문서 변경은 별도다.
- 아래 표는 자동 수집한 87곳 중 실제 크기/굵기 또는 white 색이 바뀐 호출부다. 위치는 교체 전 줄 번호이며 링크는 현재 파일이다.
- 추가 2곳: ProfileHeaderBar의 동적 아이콘(22/2.4/text), ScreenHeader의 themed 분기(22/2.4/text). 수치 변경 없음.
- 크기 변경 56곳, 굵기 변경 36곳. 중복 포함한 각각의 개수다.
- white가 포함된 32곳은 배경을 확인해 onMedia로 변경했다. 순백색에서 onMediaGlyph의 흰색 92% 불투명도로 바뀐다. 조건부 색/채우기는 유지했다.

## 실제 값 변경

| 파일 (apps/mobile/src 기준) | 아이콘 / 이전 줄 | 크기 | 굵기 | 색 |
|---|---|---|---|---|
| [components/activity/ActivityFavoriteUserRow.tsx](../apps/mobile/src/components/activity/ActivityFavoriteUserRow.tsx) | star / 47 | 15 → 14 | 유지 | 유지 |
| [components/activity/ActivityPostGrid.tsx](../apps/mobile/src/components/activity/ActivityPostGrid.tsx) | heart / 70 | 13 → 14 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityPostGrid.tsx](../apps/mobile/src/components/activity/ActivityPostGrid.tsx) | messageCircle / 74 | 13 → 14 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityStoryGrid.tsx](../apps/mobile/src/components/activity/ActivityStoryGrid.tsx) | play / 93 | 12 → 14 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityStoryPreviewMeta.tsx](../apps/mobile/src/components/activity/ActivityStoryPreviewMeta.tsx) | eye / 29 | 15 → 14 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityStoryPreviewMeta.tsx](../apps/mobile/src/components/activity/ActivityStoryPreviewMeta.tsx) | heart / 33 | 15 → 14 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityStoryPreviewSheet.tsx](../apps/mobile/src/components/activity/ActivityStoryPreviewSheet.tsx) | x / 72 | 유지 | 2.6 → 2.4 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityStoryViewerList.tsx](../apps/mobile/src/components/activity/ActivityStoryViewerList.tsx) | chevronDown / 38 | 유지 | 2.6 → 2.4 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/activity/ActivityStoryViewerRow.tsx](../apps/mobile/src/components/activity/ActivityStoryViewerRow.tsx) | heart / 29 | 13 → 14 | 유지 | 유지 |
| [components/camera/CameraControls.tsx](../apps/mobile/src/components/camera/CameraControls.tsx) | x / 50 | 27 → 26 | 2.5 → 2.4 | 유지 |
| [components/camera/CameraControls.tsx](../apps/mobile/src/components/camera/CameraControls.tsx) | zap / 66 | 24 → 26 | 유지 | 유지 |
| [components/camera/CameraControls.tsx](../apps/mobile/src/components/camera/CameraControls.tsx) | zapOff / 72 | 24 → 26 | 유지 | 유지 |
| [components/camera/CameraControls.tsx](../apps/mobile/src/components/camera/CameraControls.tsx) | switchCamera / 110 | 28 → 30 | 2.2 → 2.4 | 유지 |
| [components/camera/CameraPermissionView.tsx](../apps/mobile/src/components/camera/CameraPermissionView.tsx) | x / 47 | 27 → 26 | 2.5 → 2.4 | 유지 |
| [components/chat/MessageBubble.tsx](../apps/mobile/src/components/chat/MessageBubble.tsx) | play / 129 | 20 → 22 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/chat/MessageInput.tsx](../apps/mobile/src/components/chat/MessageInput.tsx) | send / 67 | 19 → 18 | 2.6 → 2.4 | 유지 |
| [components/comments/CommentInputBar.tsx](../apps/mobile/src/components/comments/CommentInputBar.tsx) | send / 77 | 유지 | 2.7 → 2.4 | 유지 |
| [components/comments/CommentRow.tsx](../apps/mobile/src/components/comments/CommentRow.tsx) | heart / 112 | 16 → 18 | 유지 | 유지 |
| [components/feed/FeedPostActions.tsx](../apps/mobile/src/components/feed/FeedPostActions.tsx) | messageCircle / 58 | 25 → 26 | 유지 | 유지 |
| [components/feed/FeedPostActions.tsx](../apps/mobile/src/components/feed/FeedPostActions.tsx) | send / 70 | 23 → 22 | 유지 | 유지 |
| [components/feed/FeedPostActions.tsx](../apps/mobile/src/components/feed/FeedPostActions.tsx) | bookmark / 83 | 25 → 26 | 유지 | 유지 |
| [components/feed/FeedPostHeader.tsx](../apps/mobile/src/components/feed/FeedPostHeader.tsx) | more / 49 | 유지 | 2.2 → 2.4 | 유지 |
| [components/feed/FeedVideoPlayer.tsx](../apps/mobile/src/components/feed/FeedVideoPlayer.tsx) | volumeOff / 176 | 16 → 18 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/FeedVideoPlayer.tsx](../apps/mobile/src/components/feed/FeedVideoPlayer.tsx) | volumeOn / 178 | 16 → 18 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/PostShareSheet.tsx](../apps/mobile/src/components/feed/PostShareSheet.tsx) | book / 113 | 20 → 22 | 유지 | 유지 |
| [components/feed/ReelActions.tsx](../apps/mobile/src/components/feed/ReelActions.tsx) | heart / 54 | 28 → 30 | 1.8 → 2 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/ReelActions.tsx](../apps/mobile/src/components/feed/ReelActions.tsx) | messageCircle / 65 | 28 → 30 | 1.8 → 2 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/ReelActions.tsx](../apps/mobile/src/components/feed/ReelActions.tsx) | send / 77 | 28 → 30 | 1.8 → 2 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/ReelActions.tsx](../apps/mobile/src/components/feed/ReelActions.tsx) | bookmark / 82 | 28 → 30 | 1.8 → 2 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/ReelActions.tsx](../apps/mobile/src/components/feed/ReelActions.tsx) | volumeOff / 94 | 28 → 30 | 1.8 → 2 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/ReelActions.tsx](../apps/mobile/src/components/feed/ReelActions.tsx) | volumeOn / 96 | 28 → 30 | 1.8 → 2 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/feed/ReelMoreMenu.tsx](../apps/mobile/src/components/feed/ReelMoreMenu.tsx) | more / 64 | 24 → 26 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/home/HomeHeader.tsx](../apps/mobile/src/components/home/HomeHeader.tsx) | bell / 50 | 23 → 22 | 유지 | 유지 |
| [components/home/HomeHeader.tsx](../apps/mobile/src/components/home/HomeHeader.tsx) | messageCircle / 66 | 24 → 26 | 유지 | 유지 |
| [components/insights/InsightsContentRow.tsx](../apps/mobile/src/components/insights/InsightsContentRow.tsx) | play / 44 | 12 → 14 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/insights/InsightsPeriodPicker.tsx](../apps/mobile/src/components/insights/InsightsPeriodPicker.tsx) | chevronDown / 53 | 17 → 18 | 유지 | 유지 |
| [components/insights/PostInsightPreview.tsx](../apps/mobile/src/components/insights/PostInsightPreview.tsx) | play / 40 | 16 → 18 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/profile/ProfileEditLinksEditor.tsx](../apps/mobile/src/components/profile/ProfileEditLinksEditor.tsx) | plus / 42 | 16 → 18 | 2.6 → 2.4 | 유지 |
| [components/profile/ProfileEditLinksEditor.tsx](../apps/mobile/src/components/profile/ProfileEditLinksEditor.tsx) | trash / 68 | 17 → 18 | 유지 | 유지 |
| [components/search/RecentSearchList.tsx](../apps/mobile/src/components/search/RecentSearchList.tsx) | x / 59 | 16 → 18 | 2.6 → 2.4 | 유지 |
| [components/search/RecommendedCrewCard.tsx](../apps/mobile/src/components/search/RecommendedCrewCard.tsx) | x / 49 | 17 → 18 | 유지 | 유지 |
| [components/search/SearchInput.tsx](../apps/mobile/src/components/search/SearchInput.tsx) | x / 45 | 16 → 18 | 유지 | 유지 |
| [components/stories/StoryBar.tsx](../apps/mobile/src/components/stories/StoryBar.tsx) | plus / 118 | 유지 | 3 → 2.8 | 유지 |
| [components/stories/StoryBar.tsx](../apps/mobile/src/components/stories/StoryBar.tsx) | plus / 135 | 유지 | 2.6 → 2.4 | 유지 |
| [components/stories/StoryCamera.tsx](../apps/mobile/src/components/stories/StoryCamera.tsx) | images / 107 | 28 → 30 | 2.2 → 2.4 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/stories/StoryHeader.tsx](../apps/mobile/src/components/stories/StoryHeader.tsx) | pause / 34 | 20 → 22 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/stories/StoryHeader.tsx](../apps/mobile/src/components/stories/StoryHeader.tsx) | more / 42 | 유지 | 2.6 → 2.4 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/stories/StoryHeader.tsx](../apps/mobile/src/components/stories/StoryHeader.tsx) | x / 50 | 유지 | 2.6 → 2.4 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/stories/StoryPlayer.tsx](../apps/mobile/src/components/stories/StoryPlayer.tsx) | eye / 240 | 유지 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/stories/StoryPlayer.tsx](../apps/mobile/src/components/stories/StoryPlayer.tsx) | heart / 255 | 유지 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/stories/StorySharedPostMedia.tsx](../apps/mobile/src/components/stories/StorySharedPostMedia.tsx) | play / 54 | 유지 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/write/PostImageUploader.tsx](../apps/mobile/src/components/write/PostImageUploader.tsx) | plus / 78 | 28 → 30 | 유지 | 유지 |
| [components/write/PostImageUploader.tsx](../apps/mobile/src/components/write/PostImageUploader.tsx) | x / 115 | 유지 | 3 → 2.8 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/write/PostMediaAlbumCard.tsx](../apps/mobile/src/components/write/PostMediaAlbumCard.tsx) | check / 49 | 16 → 18 | 유지 | 유지 |
| [components/write/PostMediaAlbumPicker.tsx](../apps/mobile/src/components/write/PostMediaAlbumPicker.tsx) | arrowLeft / 101 | 24 → 26 | 2.2 → 2.4 | 유지 |
| [components/write/PostMediaAlbumPicker.tsx](../apps/mobile/src/components/write/PostMediaAlbumPicker.tsx) | x / 127 | 24 → 26 | 2.2 → 2.4 | 유지 |
| [components/write/PostMediaPickerToolbar.tsx](../apps/mobile/src/components/write/PostMediaPickerToolbar.tsx) | image / 68 | 유지 | 2.2 → 2.4 | 유지 |
| [components/write/PostMediaPickerToolbar.tsx](../apps/mobile/src/components/write/PostMediaPickerToolbar.tsx) | film / 70 | 유지 | 2.2 → 2.4 | 유지 |
| [components/write/PostMediaPickerToolbar.tsx](../apps/mobile/src/components/write/PostMediaPickerToolbar.tsx) | images / 90 | 유지 | 2.2 → 2.4 | 유지 |
| [components/write/PostMediaPreview.tsx](../apps/mobile/src/components/write/PostMediaPreview.tsx) | scaling / 61 | 21 → 22 | 2.2 → 2.4 | 유지 |
| [components/write/PostVideoGalleryItem.tsx](../apps/mobile/src/components/write/PostVideoGalleryItem.tsx) | play / 60 | 13 → 14 | 유지 | 유지 |
| [components/write/PostVideoGalleryItem.tsx](../apps/mobile/src/components/write/PostVideoGalleryItem.tsx) | film / 63 | 12 → 14 | 2.2 → 2.4 | 유지 |
| [components/write/PostVideoPickerPreview.tsx](../apps/mobile/src/components/write/PostVideoPickerPreview.tsx) | volumeOff / 64 | 20 → 22 | 2.3 → 2.4 | 유지 |
| [components/write/PostVideoPickerPreview.tsx](../apps/mobile/src/components/write/PostVideoPickerPreview.tsx) | volumeOn / 66 | 20 → 22 | 2.3 → 2.4 | 유지 |
| [components/write/WriteMediaSection.tsx](../apps/mobile/src/components/write/WriteMediaSection.tsx) | film / 72 | 20 → 22 | 2.5 → 2.4 | 유지 |
| [components/write/WriteVideoPreview.tsx](../apps/mobile/src/components/write/WriteVideoPreview.tsx) | x / 50 | 유지 | 3 → 2.8 | white → onMedia (조건부인 경우 해당 분기만) |
| [components/write/WriteVideoPreview.tsx](../apps/mobile/src/components/write/WriteVideoPreview.tsx) | volumeOff / 67 | 19 → 18 | 유지 | 유지 |
| [components/write/WriteVideoPreview.tsx](../apps/mobile/src/components/write/WriteVideoPreview.tsx) | volumeOn / 69 | 19 → 18 | 유지 | 유지 |
| [screens/auth/OnboardingScreen.tsx](../apps/mobile/src/screens/auth/OnboardingScreen.tsx) | check / 196 | 13 → 14 | 3.2 → 2.8 | 유지 |
| [screens/explore/ExploreScreen.tsx](../apps/mobile/src/screens/explore/ExploreScreen.tsx) | play / 212 | 유지 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [screens/explore/ExploreScreen.tsx](../apps/mobile/src/screens/explore/ExploreScreen.tsx) | heart / 216 | 13 → 14 | 유지 | 유지 |
| [screens/feed/ReelsScreen.tsx](../apps/mobile/src/screens/feed/ReelsScreen.tsx) | chevronLeft / 346 | 28 → 30 | 2.6 → 2.4 | white → onMedia (조건부인 경우 해당 분기만) |
| [screens/messages/ChatRoomScreen.tsx](../apps/mobile/src/screens/messages/ChatRoomScreen.tsx) | more / 229 | 유지 | 2.5 → 2.4 | 유지 |
| [screens/stories/StoryCreateScreen.tsx](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx) | chevronLeft / 135 | 유지 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |
| [screens/stories/StoryCreateScreen.tsx](../apps/mobile/src/screens/stories/StoryCreateScreen.tsx) | palette / 150 | 24 → 26 | 유지 | white → onMedia (조건부인 경우 해당 분기만) |

## 보존한 의도와 예외

- 시작 전 `grep -rn "의도:" apps/mobile/src`와 DECISIONS의 해당 절을 확인했다.
- BottomTabBar: 아이콘 25는 의도된 값이고 토큰에 없으므로 파일 전체를 보존했다. + 버튼/바 크기 46/54와 동적 아이콘도 그대로다.
- FeedPostActions와 HomeHeader: 의도된 strokeWidth 2를 thin(2)으로 보존했다. 피드 숫자 13/700, 헤더 버튼 44, 스토리 카드 100x140도 그대로다.
- ReelActions의 1.8은 이번 명시적 결정대로 thin(2)으로 변경했다. 과거 1.8 주석은 현재 결정에 맞게 정정했다.
- DoubleTapLike: 하트 96, strokeWidth 0 유지. ReelItem의 Play 62 유지.
- PostMediaPreview의 Image 34, PostVideoPickerPreview의 Film 36, TabPlaceholderScreen의 동적 아이콘 34는 매핑이 없어 유지했다.
- ScreenHeader의 themed=false는 테마와 무관한 라이트 배경/라이트 글자를 사용하므로 기존 ChevronLeft를 유지했다. themed=true만 공용 Icon을 쓴다.
- SocialIcon(브랜드 자산과 내부 Globe 포함), 직접 작성한 SVG, Icon.tsx와 theme.ts는 수정하지 않았다.
- 카메라 제스처/줌/저장, 피드 열람·정렬, 권한/계정 정책 등 다른 의도 주석의 동작은 변경하지 않았다.
- white 색의 배경이 모호해 보류한 호출부는 없다. BottomTabBar와 DoubleTapLike의 white는 위 보호 대상이라 남겼다.

## 실기기 확인

- 정적 검증: `cd apps/mobile && node node_modules/typescript/bin/tsc --noEmit` 통과. 변경한 파일 대상으로 `git diff --check` 통과.
- ESLint 지적은 변경 전후 모두 19건이다. 기존 훅/이미지 접근성 등의 오류·경고가 남아 전체 통과는 아니며, 아이콘 교체 후 생긴 미사용 변수는 제거했다.

- 라이트/다크에서 홈 액션·헤더, 댓글, 검색, 프로필, 설정, 채팅, 탐색, 인사이트의 아이콘 크기와 클릭 영역을 확인한다.
- 사진/영상 위 흰 아이콘 32곳의 대비, 릴스 thin(2), 카메라 전환 xl(30), 선택/좋아요/저장/별의 채우기를 확인한다.
- BottomTabBar 고정 25, ScreenHeader 비테마 화면, 큰 빈 상태/애니메이션은 기존 외형을 유지하는지 확인한다.
- 실기기 검증과 커밋·OTA 배포는 수행하지 않았다.
