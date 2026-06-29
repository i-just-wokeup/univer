// 스토리 데이터 계층 — 스토리 생성/삭제·이미지 업로드·조회 기록·좋아요·조회자 목록.
// 스토리 좋아요는 post_likes 테이블에 target_type='story'로 저장(게시물과 공용).
import type { Database } from "../../types/database.types";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "../../lib/constants/storage";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { uploadImagesToBucket } from "../shared/imageUpload";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import type { Story, StoryGroup, StoryViewer, StoryVisibility } from "./types";

type PostLikeInsert = Database["public"]["Tables"]["post_likes"]["Insert"];

// PostgREST `in` 필터용 문자열: ["a","b"] → "(a,b)".
function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 현재 로그인 유저 id(없으면 에러). 이 파일 내부 공용.
async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user.id;
}

// 로컬 이미지 한 장을 story-images 버킷에 올리고 공개 URL을 반환한다.
export async function uploadStoryImage(uri: string): Promise<string> {
  const [url] = await uploadImagesToBucket(
    STORAGE_BUCKETS.storyImages,
    STORAGE_FOLDERS.stories,
    [uri],
    1080,
  );

  if (!url) {
    throw new Error("스토리 이미지 업로드에 실패했습니다.");
  }

  return url;
}

// 스토리 생성(24시간 후 만료). 같은 학교/작성자/공개범위와 함께 insert.
export async function createStory(
  imageUrl: string,
  visibility: StoryVisibility = "public",
): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("stories").insert({
    expires_at: expiresAt,
    image_url: imageUrl,
    university_id: universityId,
    user_id: userId,
    visibility,
  });

  if (error) {
    throw new Error("스토리 저장에 실패했습니다.");
  }
}

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
      "id, user_id, image_url, university_id, views_count, expires_at, is_archived, visibility, deleted_at, created_at",
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

  const userIds = Array.from(new Set(stories.map((story) => story.user_id)));
  const storyIds = stories.map((story) => story.id);

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

  stories.forEach((story) => {
    const storyUser = usersById.get(story.user_id);

    if (!storyUser) {
      return;
    }

    const storyItem: Story = {
      created_at: story.created_at,
      expires_at: story.expires_at,
      id: story.id,
      image_url: story.image_url,
      isMine: story.user_id === userId,
      user: storyUser,
      user_id: story.user_id,
      views_count: story.views_count,
    };

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

  // created_at 내림차순으로 받았으므로 그룹 내부는 오래된 → 최신 순으로 뒤집어 뷰어가 순서대로 재생하게 한다.
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

// 스토리 조회 기록(중복 무시 upsert). 새로 기록된 경우에만 recount_story_views RPC로 조회수 갱신.
export async function recordStoryView(storyId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: insertedViews, error: viewError } = await supabase
    .from("story_views")
    .upsert(
      {
        story_id: storyId,
        user_id: userId,
      },
      {
        ignoreDuplicates: true,
        onConflict: "story_id,user_id",
      },
    )
    .select("id");

  if (viewError) {
    throw new Error("스토리 조회 기록 저장에 실패했습니다.");
  }

  if (!insertedViews || insertedViews.length === 0) {
    return;
  }

  const { error: recountError } = await supabase.rpc("recount_story_views", {
    p_story_id: storyId,
  });

  if (recountError) {
    throw new Error("스토리 조회수 업데이트에 실패했습니다.");
  }
}

// 스토리 좋아요 토글 → { liked }. post_likes(target_type='story')에 insert/delete.
export async function toggleStoryLike(
  storyId: string,
): Promise<{ liked: boolean }> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: existingLike, error: likeSelectError } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .maybeSingle();

  if (likeSelectError) {
    throw new Error("스토리 좋아요 상태를 확인하지 못했습니다.");
  }

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) {
      throw new Error("스토리 좋아요 취소에 실패했습니다.");
    }

    return { liked: false };
  }

  const storyLikeInsert: PostLikeInsert = {
    target_id: storyId,
    target_type: "story",
    user_id: userId,
  };

  const { error: insertError } = await supabase
    .from("post_likes")
    .insert(storyLikeInsert);

  if (insertError) {
    throw new Error("스토리 좋아요에 실패했습니다.");
  }

  return { liked: true };
}

// 현재 유저가 이 스토리에 좋아요했는지 여부.
export async function getMyStoryLikedStatus(storyId: string): Promise<boolean> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .maybeSingle();

  if (error) {
    throw new Error("스토리 좋아요 상태를 불러오지 못했습니다.");
  }

  return Boolean(data);
}

// 본인 스토리 soft delete(deleted_at). user_id 일치만, 결과 없으면 실패.
export async function deleteStory(storyId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("stories")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", storyId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("스토리 삭제에 실패했습니다.");
  }
}

// 스토리 조회자 목록(최신순) + 각자의 좋아요 여부. 조회 순서를 유지해 반환.
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
