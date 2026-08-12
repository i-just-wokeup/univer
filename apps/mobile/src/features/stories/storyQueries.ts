import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import { toStory } from "./storyHydration";
import { toPostgrestInFilter } from "./storyPostgrest";
import { getStorySharedPosts } from "./storySharedPosts";
import type { StoryRow } from "./storyTypes";
import type { StoryGroup } from "./types";

// 같은 학교의 만료 전 스토리를 유저별로 묶고, 본인 → 크루 → 그 외 순으로 정렬한다.
// 차단 관계(내가 차단 + 나를 차단)인 유저의 스토리는 제외한다.
export async function getStories(): Promise<StoryGroup[]> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const now = new Date().toISOString();

  let storiesQuery = supabase
    .from("stories")
    .select(
      "id, user_id, image_url, shared_post_id, type, thumbnail_url, duration, background_color, provider, provider_asset_id, processing_status, university_id, views_count, expires_at, is_archived, visibility, deleted_at, created_at",
    )
    .eq("university_id", universityId)
    .gt("expires_at", now)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (blockRelatedUserIds.length > 0) {
    storiesQuery = storiesQuery.not(
      "user_id",
      "in",
      toPostgrestInFilter(blockRelatedUserIds),
    );
  }

  const { data: stories, error: storiesError } = await storiesQuery;

  if (storiesError) {
    throw new Error("스토리 목록을 불러오지 못했습니다.");
  }

  if (!stories || stories.length === 0) {
    return [];
  }

  const storyRows = stories as StoryRow[];
  const sharedPostsById = await getStorySharedPosts(
    storyRows.flatMap((story) =>
      story.shared_post_id ? [story.shared_post_id] : [],
    ),
  );
  const visibleStoryRows = storyRows.filter(
    (story) =>
      !story.shared_post_id || sharedPostsById.has(story.shared_post_id),
  );

  if (visibleStoryRows.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(visibleStoryRows.map((story) => story.user_id)),
  );
  const storyIds = visibleStoryRows.map((story) => story.id);

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nickname, avatar_url")
    .in("id", userIds);

  if (usersError) {
    throw new Error("스토리 작성자 정보를 불러오지 못했습니다.");
  }

  const { data: views, error: viewsError } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("user_id", userId)
    .in("story_id", storyIds);

  if (viewsError) {
    throw new Error("스토리 조회 여부를 불러오지 못했습니다.");
  }

  const { data: connections } = await supabase
    .from("user_connections")
    .select("requester_id, receiver_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

  const friendIds = new Set(
    (connections ?? []).map((connection) =>
      connection.requester_id === userId
        ? connection.receiver_id
        : connection.requester_id,
    ),
  );

  const usersById = new Map(
    (users ?? []).map((user) => [
      user.id,
      {
        avatar_url: user.avatar_url,
        id: user.id,
        nickname: user.id === userId ? "나" : user.nickname,
      },
    ]),
  );
  const viewedStoryIds = new Set((views ?? []).map((view) => view.story_id));
  const groupsByUserId = new Map<string, StoryGroup>();

  visibleStoryRows.forEach((story) => {
    const storyUser = usersById.get(story.user_id);

    if (!storyUser) {
      return;
    }

    const storyItem = toStory(
      story,
      storyUser,
      userId,
      story.shared_post_id
        ? sharedPostsById.get(story.shared_post_id) ?? null
        : null,
    );
    const group = groupsByUserId.get(story.user_id);

    if (group) {
      group.stories.push(storyItem);
      group.hasUnviewed = group.hasUnviewed || !viewedStoryIds.has(story.id);
      return;
    }

    groupsByUserId.set(story.user_id, {
      hasUnviewed: !viewedStoryIds.has(story.id),
      stories: [storyItem],
      user: storyUser,
    });
  });

  // created_at 내림차순으로 받았으므로 그룹 내부는 오래된 → 최신 순으로 뒤집어 재생한다.
  const groups = Array.from(groupsByUserId.values()).map((group) => ({
    ...group,
    stories: [...group.stories].reverse(),
  }));

  return groups.sort((left, right) => {
    if (left.user.id === userId) {
      return -1;
    }

    if (right.user.id === userId) {
      return 1;
    }

    const leftIsFriend = friendIds.has(left.user.id);
    const rightIsFriend = friendIds.has(right.user.id);

    if (leftIsFriend && !rightIsFriend) {
      return -1;
    }

    if (!leftIsFriend && rightIsFriend) {
      return 1;
    }

    return 0;
  });
}
