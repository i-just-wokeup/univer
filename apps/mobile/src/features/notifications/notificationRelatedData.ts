import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.types";
import type {
  NotificationMeta,
  PostMediaRow,
  StoryRow,
  UserRow,
} from "./notificationDbTypes";

type MobileSupabaseClient = SupabaseClient<Database>;

export type NotificationRelatedData = {
  storiesById: Map<string, Pick<StoryRow, "id" | "image_url" | "user_id">>;
  thumbnailByPostId: Map<string, string>;
  usersById: Map<string, Pick<UserRow, "avatar_url" | "id" | "nickname">>;
};

export async function loadNotificationRelatedData(
  supabase: MobileSupabaseClient,
  metaByNotificationId: Map<string, NotificationMeta>,
): Promise<NotificationRelatedData> {
  const metaItems = Array.from(metaByNotificationId.values());
  const storyIds = Array.from(
    new Set(
      metaItems
        .map((meta) => meta.storyId)
        .filter((storyId): storyId is string => Boolean(storyId)),
    ),
  );
  const storiesById = new Map<
    string,
    Pick<StoryRow, "id" | "image_url" | "user_id">
  >();

  if (storyIds.length > 0) {
    const { data: stories, error } = await supabase
      .from("stories")
      .select("id, image_url, user_id")
      .in("id", storyIds);

    if (error || !stories) {
      throw new Error("스토리 알림 정보를 불러오지 못했습니다.");
    }

    stories.forEach((story: Pick<StoryRow, "id" | "image_url" | "user_id">) => {
      storiesById.set(story.id, story);
    });
  }

  const postIds = Array.from(
    new Set(
      metaItems
        .map((meta) => meta.postId)
        .filter((postId): postId is string => Boolean(postId)),
    ),
  );
  const thumbnailByPostId = new Map<string, string>();

  if (postIds.length > 0) {
    const { data: postMedia, error } = await supabase
      .from("post_media")
      .select("post_id, url, thumbnail_url, order_index")
      .in("post_id", postIds)
      .eq("order_index", 0);

    if (error || !postMedia) {
      throw new Error("게시물 썸네일을 불러오지 못했습니다.");
    }

    postMedia.forEach(
      (media: Pick<PostMediaRow, "post_id" | "thumbnail_url" | "url">) => {
        thumbnailByPostId.set(media.post_id, media.thumbnail_url ?? media.url);
      },
    );
  }

  const actorUserIds = Array.from(
    new Set(
      metaItems
        .map((meta) => meta.actorUserId)
        .filter((actorUserId): actorUserId is string => Boolean(actorUserId)),
    ),
  );
  const usersById = new Map<
    string,
    Pick<UserRow, "avatar_url" | "id" | "nickname">
  >();

  if (actorUserIds.length > 0) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, nickname, avatar_url")
      .in("id", actorUserIds);

    if (error || !users) {
      throw new Error("알림 사용자 정보를 불러오지 못했습니다.");
    }

    users.forEach((user: Pick<UserRow, "avatar_url" | "id" | "nickname">) => {
      usersById.set(user.id, user);
    });
  }

  return { storiesById, thumbnailByPostId, usersById };
}
