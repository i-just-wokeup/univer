import { getSupabaseMobileClient } from "../../lib/supabase";
import type { StoryViewer } from "./types";

// 스토리 조회자 목록(최신순) + 각자의 좋아요 여부. 조회 순서를 유지해 반환한다.
export async function getStoryViewers(storyId: string): Promise<StoryViewer[]> {
  const supabase = getSupabaseMobileClient();

  const { data: storyViews, error: viewsError } = await supabase
    .from("story_views")
    .select("user_id, created_at")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (viewsError) {
    throw new Error("스토리 조회자 목록을 불러오지 못했습니다.");
  }

  if (!storyViews || storyViews.length === 0) {
    return [];
  }

  const viewerIds = storyViews.map((view) => view.user_id);
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nickname, avatar_url")
    .in("id", viewerIds);

  if (usersError) {
    throw new Error("스토리 조회자 정보를 불러오지 못했습니다.");
  }

  const { data: storyLikes, error: likesError } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .in("user_id", viewerIds);

  if (likesError) {
    throw new Error("스토리 좋아요 정보를 불러오지 못했습니다.");
  }

  const usersById = new Map((users ?? []).map((user) => [user.id, user]));
  const likedViewerIds = new Set(
    (storyLikes ?? []).map((like) => like.user_id),
  );

  return viewerIds.reduce<StoryViewer[]>((viewers, viewerId) => {
    const user = usersById.get(viewerId);

    if (user) {
      viewers.push({
        avatar_url: user.avatar_url,
        id: user.id,
        isLiked: likedViewerIds.has(user.id),
        nickname: user.nickname,
      });
    }

    return viewers;
  }, []);
}
