import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostLikeInsert = Database["public"]["Tables"]["post_likes"]["Insert"];

export type Story = Pick<
  StoryRow,
  "created_at" | "expires_at" | "id" | "image_url" | "user_id" | "views_count"
> & {
  isMine: boolean;
  user: Pick<UserRow, "avatar_url" | "id" | "nickname">;
};

export type StoryGroup = {
  hasUnviewed: boolean;
  stories: Story[];
  user: Pick<UserRow, "avatar_url" | "id" | "nickname">;
};

export type Viewer = Pick<UserRow, "avatar_url" | "id" | "nickname"> & {
  isLiked: boolean;
};

// 브라우저 환경변수가 없을 때 각 API가 동일한 에러로 빠지도록 통일한다.
function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? "jpg" : "jpg";
}

async function getCurrentUserUniversityId() {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userError || !userRow?.university_id) {
    throw new Error("현재 로그인 유저의 학교 정보를 찾을 수 없습니다.");
  }

  return {
    universityId: userRow.university_id,
    userId: user.id,
  };
}

async function getCurrentUserId() {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user.id;
}

export async function uploadStoryImage(file: File): Promise<string> {
  const supabase = requireSupabaseClient();
  const fileExtension = getFileExtension(file.name);
  const filePath = `stories/${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("story-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error("스토리 이미지 업로드에 실패했습니다.");
  }

  const { data } = supabase.storage.from("story-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createStory(imageUrl: string): Promise<void> {
  const supabase = requireSupabaseClient();
  const { universityId, userId } = await getCurrentUserUniversityId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("stories").insert({
    expires_at: expiresAt,
    image_url: imageUrl,
    university_id: universityId,
    user_id: userId,
    visibility: "public",
  });

  if (error) {
    throw new Error("스토리 저장에 실패했습니다.");
  }
}

export async function getStories(): Promise<StoryGroup[]> {
  const supabase = requireSupabaseClient();
  const { universityId, userId } = await getCurrentUserUniversityId();
  const now = new Date().toISOString();

  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select(
      "id, user_id, image_url, university_id, views_count, expires_at, is_archived, visibility, deleted_at, created_at",
    )
    .eq("university_id", universityId)
    .gt("expires_at", now)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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

    const group = groupsByUserId.get(story.user_id);
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

  return Array.from(groupsByUserId.values()).sort((left, right) => {
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

export async function getUserStories(userId: string): Promise<Story[]> {
  const supabase = requireSupabaseClient();
  const currentUserId = await getCurrentUserId();
  const now = new Date().toISOString();

  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select(
      "id, user_id, image_url, university_id, views_count, expires_at, is_archived, visibility, deleted_at, created_at",
    )
    .eq("user_id", userId)
    .gt("expires_at", now)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (storiesError) {
    throw new Error("사용자 스토리를 불러오지 못했습니다.");
  }

  if (!stories || stories.length === 0) {
    return [];
  }

  const { data: storyUser, error: userError } = await supabase
    .from("users")
    .select("id, nickname, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !storyUser) {
    throw new Error("스토리 작성자 정보를 불러오지 못했습니다.");
  }

  const user = {
    avatar_url: storyUser.avatar_url,
    id: storyUser.id,
    nickname: storyUser.id === currentUserId ? "나" : storyUser.nickname,
  };

  return stories.map((story) => ({
    created_at: story.created_at,
    expires_at: story.expires_at,
    id: story.id,
    image_url: story.image_url,
    isMine: story.user_id === currentUserId,
    user,
    user_id: story.user_id,
    views_count: story.views_count,
  }));
}

export async function recordStoryView(storyId: string): Promise<void> {
  const supabase = requireSupabaseClient();
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

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("views_count")
    .eq("id", storyId)
    .maybeSingle();

  if (storyError || !story) {
    throw new Error("스토리 조회수를 불러오지 못했습니다.");
  }

  const { error: updateError } = await supabase
    .from("stories")
    .update({
      views_count: story.views_count + 1,
    })
    .eq("id", storyId);

  if (updateError) {
    throw new Error("스토리 조회수 업데이트에 실패했습니다.");
  }
}

export async function toggleStoryLike(storyId: string): Promise<{ liked: boolean }> {
  const supabase = requireSupabaseClient();
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

export async function getMyStoryLikedStatus(storyId: string): Promise<boolean> {
  const supabase = requireSupabaseClient();
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

export async function deleteStory(storyId: string): Promise<void> {
  const supabase = requireSupabaseClient();
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

export async function getStoryViewers(storyId: string): Promise<Viewer[]> {
  const supabase = requireSupabaseClient();

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
  const likedViewerIds = new Set((storyLikes ?? []).map((like) => like.user_id));

  return viewerIds.reduce<Viewer[]>((viewers, viewerId) => {
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

export type StoryPreview = {
  imageUrl: string;
  user: Pick<UserRow, "avatar_url" | "id" | "nickname">;
};

export async function getStoryPreview(
  userId: string,
): Promise<StoryPreview | null> {
  const supabase = requireSupabaseClient();
  const now = new Date().toISOString();

  try {
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("image_url")
      .eq("user_id", userId)
      .gt("expires_at", now)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (storyError || !story) {
      return null;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, nickname, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) {
      return null;
    }

    return {
      imageUrl: story.image_url,
      user: {
        avatar_url: user.avatar_url,
        id: user.id,
        nickname: user.nickname,
      },
    };
  } catch {
    return null;
  }
}
