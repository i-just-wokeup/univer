import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";

import { getBlockRelatedUserIds } from "../shared/userContext";
import {
  getBookmarkedPostIds,
  getLikedPostIds,
  getPostCounts,
} from "./api";
import type { FeedPost } from "./types";

type UseHomeFeedSyncParams = {
  posts: FeedPost[];
  setBookmarkedPostIds: Dispatch<SetStateAction<Set<string>>>;
  setLikedPostIds: Dispatch<SetStateAction<Set<string>>>;
  setPosts: Dispatch<SetStateAction<FeedPost[]>>;
};

export function useHomeFeedSync({
  posts,
  setBookmarkedPostIds,
  setLikedPostIds,
  setPosts,
}: UseHomeFeedSyncParams) {
  // 포커스 갱신 콜백을 안정적으로 유지하면서 최신 게시물 목록만 참조한다.
  const postsRef = useRef<FeedPost[]>([]);
  postsRef.current = posts;

  // 릴스/상세/프로필 복귀 시 좋아요·저장 여부와 카운트, 차단/삭제 상태만 다시 맞춘다.
  const refreshInteractions = useCallback(async () => {
    const ids = postsRef.current.map((post) => post.id);
    if (ids.length === 0) {
      return;
    }
    try {
      const [likedIds, bookmarkedIds, counts, blockRelatedUserIds] =
        await Promise.all([
          getLikedPostIds(ids),
          getBookmarkedPostIds(ids),
          getPostCounts(ids),
          getBlockRelatedUserIds(),
        ]);
      const countsById = new Map(counts.map((count) => [count.id, count]));
      const blockedUserIds = new Set(blockRelatedUserIds);
      const queriedIds = new Set(ids);
      setLikedPostIds(new Set(likedIds));
      setBookmarkedPostIds(new Set(bookmarkedIds));
      setPosts((current) =>
        current
          // 이번 동기화 조회 대상이 아닌 글(업로드 직후 새로 얹은 내 글 등)은 그대로 유지한다.
          // 조회 대상이었던 글만 삭제(카운트 없음)·차단 유저 글을 목록에서 제거한다.
          .filter(
            (post) =>
              !queriedIds.has(post.id) ||
              (countsById.has(post.id) && !blockedUserIds.has(post.user.id)),
          )
          .map((post) => {
            const count = countsById.get(post.id);
            return count
              ? {
                  ...post,
                  comments_count: count.comments_count,
                  likes_count: count.likes_count,
                }
              : post;
          }),
      );
    } catch {
      // 갱신 실패는 조용히 무시(다음 포커스에서 재시도).
    }
  }, [setBookmarkedPostIds, setLikedPostIds, setPosts]);

  return {
    refreshInteractions,
  };
}
