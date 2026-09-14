// 의도: 면적 80% + 2초를 "봤다" 기준으로 쓴다. 이미 충분히 엄해 조정 효과가 작다고 판단했다.
// HomeFeedList 의 itemVisiblePercentThreshold 60 은 영상 자동재생용이라 이것과 다른 값이다.
export const FEED_IMPRESSION_VIEW_AREA_PERCENT = 80;
export const FEED_IMPRESSION_MINIMUM_VIEW_TIME_MS = 2000;
export const FEED_IMPRESSION_FLUSH_DELAY_MS = 3000;
export const FEED_IMPRESSION_BATCH_SIZE = 10;
