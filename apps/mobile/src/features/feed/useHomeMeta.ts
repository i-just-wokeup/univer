import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { getChatUnreadCount } from "../chat/api";
import { getUnreadCount } from "../notifications/api";
import { getStories } from "../stories/api";
import type { StoryGroup } from "../stories/types";

// 홈 상단 메타(스토리바 + 안읽은 알림/메시지 뱃지). 화면 진입마다 갱신.
export function useHomeMeta() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadHomeMeta = useCallback(async () => {
    try {
      setStoryGroups(await getStories());
    } catch {
      // 스토리바 로딩 실패는 피드 사용을 막지 않는다.
    }

    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      // 안읽은 알림 수 로딩 실패는 무시한다.
    }

    try {
      setUnreadChatCount(await getChatUnreadCount());
    } catch {
      // 안읽은 메시지 수 로딩 실패는 무시한다.
    }
  }, []);

  // 화면에 다시 진입할 때마다(작성/뷰어/알림에서 복귀 포함) 스토리바·뱃지를 갱신한다.
  useFocusEffect(
    useCallback(() => {
      void loadHomeMeta();
    }, [loadHomeMeta]),
  );

  return {
    storyGroups,
    unreadChatCount,
    unreadCount,
  };
}
