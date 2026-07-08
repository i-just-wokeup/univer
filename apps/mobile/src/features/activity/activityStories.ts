import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserContext } from "../shared/userContext";
import type {
  ActivityStory,
  ActivityStoryViewer,
  PostLikeRow,
  StoryViewRow,
} from "./activityTypes";

// 내가 올린 스토리 보관함(삭제 제외, 최신순).
export async function getMyStories(): Promise<ActivityStory[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, image_url, type, thumbnail_url, processing_status, views_count, expires_at, is_archived, visibility, created_at",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("스토리 보관함을 불러오지 못했습니다.");
  }

  return data;
}

// 내 스토리 조회자 목록(최신순) + 각자의 좋아요 여부. 본인 스토리만 조회 가능.
export async function getActivityStoryViewers(
  storyId: string,
): Promise<ActivityStoryViewer[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (storyError || !story) {
    throw new Error("스토리 정보를 불러오지 못했습니다.");
  }

  const { data: storyViews, error: viewsError } = await supabase
    .from("story_views")
    .select("user_id, created_at")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (viewsError || !storyViews) {
    throw new Error("스토리 조회자 목록을 불러오지 못했습니다.");
  }

  if (storyViews.length === 0) {
    return [];
  }

  const viewerIds = storyViews.map(
    (view: Pick<StoryViewRow, "user_id">) => view.user_id,
  );
  const [
    { data: users, error: usersError },
    { data: storyLikes, error: likesError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, nickname, avatar_url")
      .in("id", viewerIds),
    supabase
      .from("post_likes")
      .select("user_id")
      .eq("target_type", "story")
      .eq("target_id", storyId)
      .in("user_id", viewerIds),
  ]);

  if (usersError || !users) {
    throw new Error("스토리 조회자 정보를 불러오지 못했습니다.");
  }

  if (likesError || !storyLikes) {
    throw new Error("스토리 좋아요 정보를 불러오지 못했습니다.");
  }

  const usersById = new Map(
    users.map((user) => [
      user.id,
      {
        avatar_url: user.avatar_url,
        id: user.id,
        nickname: user.nickname,
      },
    ]),
  );
  const likedViewerIds = new Set(
    storyLikes.map((like: Pick<PostLikeRow, "user_id">) => like.user_id),
  );

  return storyViews.reduce<ActivityStoryViewer[]>((viewers, view) => {
    const user = usersById.get(view.user_id);

    if (!user) {
      return viewers;
    }

    viewers.push({
      ...user,
      isLiked: likedViewerIds.has(user.id),
      viewed_at: view.created_at,
    });

    return viewers;
  }, []);
}
