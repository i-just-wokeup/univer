import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type CommentLikeRow = Database["public"]["Tables"]["comment_likes"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

export type NotificationType = NotificationRow["type"];

export type NotificationActor = {
  avatar_url: string | null;
  nickname: string;
} | null;

export type NotificationItem = {
  actor: NotificationActor;
  created_at: string;
  href: string | null;
  id: string;
  is_read: boolean;
  message: string | null;
  reference_id: string | null;
  reference_type: NotificationRow["reference_type"];
  thumbnail_url: string | null;
  type: NotificationType;
};

type NotificationMeta = {
  actorUserId: string | null;
  href: string | null;
  postId: string | null;
  storyId: string | null;
};

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
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

function getFallbackMeta(notification: NotificationRow): NotificationMeta {
  if (notification.reference_type === "post" && notification.reference_id) {
    return {
      actorUserId: null,
      href: `/posts/${notification.reference_id}`,
      postId: notification.reference_id,
      storyId: null,
    };
  }

  if (notification.reference_type === "story" && notification.reference_id) {
    return {
      actorUserId: null,
      href: `/story/${notification.reference_id}`,
      postId: null,
      storyId: notification.reference_id,
    };
  }

  return {
    actorUserId: null,
    href: null,
    postId: null,
    storyId: null,
  };
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, reference_type, reference_id, message, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !notifications) {
    throw new Error("알림을 불러오지 못했습니다.");
  }

  if (notifications.length === 0) {
    return [];
  }

  const metaByNotificationId = new Map<string, NotificationMeta>();

  notifications.forEach((notification: NotificationRow) => {
    metaByNotificationId.set(notification.id, getFallbackMeta(notification));
  });

  const postLikeReferenceIds = notifications
    .filter(
      (notification) =>
        (notification.type === "post_like" || notification.type === "story_like") &&
        Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (postLikeReferenceIds.length > 0) {
    const { data: postLikes, error: postLikesError } = await supabase
      .from("post_likes")
      .select("id, user_id, target_type, target_id, created_at")
      .in("id", postLikeReferenceIds);

    if (postLikesError || !postLikes) {
      throw new Error("좋아요 알림 정보를 불러오지 못했습니다.");
    }

    const postLikesById = new Map<string, PostLikeRow>(
      postLikes.map((postLike: PostLikeRow) => [postLike.id, postLike]),
    );

    notifications.forEach((notification: NotificationRow) => {
      if (
        notification.type !== "post_like" &&
        notification.type !== "story_like"
      ) {
        return;
      }

      const postLike = notification.reference_id
        ? postLikesById.get(notification.reference_id)
        : null;

      if (!postLike) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: postLike.user_id,
        href:
          postLike.target_type === "post"
            ? `/posts/${postLike.target_id}`
            : null,
        postId: postLike.target_type === "post" ? postLike.target_id : null,
        storyId: postLike.target_type === "story" ? postLike.target_id : null,
      });
    });
  }

  const commentLikeReferenceIds = notifications
    .filter(
      (notification) =>
        notification.type === "comment_like" && Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (commentLikeReferenceIds.length > 0) {
    const { data: commentLikes, error: commentLikesError } = await supabase
      .from("comment_likes")
      .select("id, user_id, comment_id, created_at")
      .in("id", commentLikeReferenceIds);

    if (commentLikesError || !commentLikes) {
      throw new Error("댓글 좋아요 알림 정보를 불러오지 못했습니다.");
    }

    const commentIds = commentLikes.map(
      (commentLike: Pick<CommentLikeRow, "comment_id">) => commentLike.comment_id,
    );
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
      .in("id", commentIds);

    if (commentsError || !comments) {
      throw new Error("댓글 알림 정보를 불러오지 못했습니다.");
    }

    const commentLikesById = new Map<string, CommentLikeRow>(
      commentLikes.map((commentLike: CommentLikeRow) => [
        commentLike.id,
        commentLike,
      ]),
    );
    const commentsById = new Map<string, CommentRow>(
      comments.map((comment: CommentRow) => [comment.id, comment]),
    );

    notifications.forEach((notification: NotificationRow) => {
      if (notification.type !== "comment_like") {
        return;
      }

      const commentLike = notification.reference_id
        ? commentLikesById.get(notification.reference_id)
        : null;
      const comment = commentLike
        ? commentsById.get(commentLike.comment_id)
        : null;

      if (!commentLike || !comment) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: commentLike.user_id,
        href: `/posts/${comment.post_id}`,
        postId: comment.post_id,
        storyId: null,
      });
    });
  }

  const commentReferenceIds = notifications
    .filter(
      (notification) =>
        notification.type === "post_comment" && Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (commentReferenceIds.length > 0) {
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
      .in("id", commentReferenceIds);

    if (commentsError || !comments) {
      throw new Error("댓글 알림 정보를 불러오지 못했습니다.");
    }

    const commentsById = new Map<string, CommentRow>(
      comments.map((comment: CommentRow) => [comment.id, comment]),
    );

    notifications.forEach((notification: NotificationRow) => {
      if (notification.type !== "post_comment") {
        return;
      }

      const comment = notification.reference_id
        ? commentsById.get(notification.reference_id)
        : null;

      if (!comment) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: comment.user_id,
        href: `/posts/${comment.post_id}`,
        postId: comment.post_id,
        storyId: null,
      });
    });
  }

  const storyIds = Array.from(
    new Set(
      Array.from(metaByNotificationId.values())
        .map((meta) => meta.storyId)
        .filter((storyId): storyId is string => Boolean(storyId)),
    ),
  );
  const storiesById = new Map<string, Pick<StoryRow, "id" | "image_url" | "user_id">>();

  if (storyIds.length > 0) {
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, image_url, user_id")
      .in("id", storyIds);

    if (storiesError || !stories) {
      throw new Error("스토리 알림 정보를 불러오지 못했습니다.");
    }

    stories.forEach((story: Pick<StoryRow, "id" | "image_url" | "user_id">) => {
      storiesById.set(story.id, story);
    });

    notifications.forEach((notification: NotificationRow) => {
      const meta = metaByNotificationId.get(notification.id);
      const story = meta?.storyId ? storiesById.get(meta.storyId) : null;

      if (!meta || !story) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        ...meta,
        href: `/story/${story.user_id}`,
      });
    });
  }

  const postIds = Array.from(
    new Set(
      Array.from(metaByNotificationId.values())
        .map((meta) => meta.postId)
        .filter((postId): postId is string => Boolean(postId)),
    ),
  );
  const thumbnailByPostId = new Map<string, string>();

  if (postIds.length > 0) {
    const { data: postMedia, error: postMediaError } = await supabase
      .from("post_media")
      .select("post_id, url, thumbnail_url, order_index")
      .in("post_id", postIds)
      .eq("order_index", 0);

    if (postMediaError || !postMedia) {
      throw new Error("게시물 썸네일을 불러오지 못했습니다.");
    }

    postMedia.forEach((media: Pick<PostMediaRow, "post_id" | "thumbnail_url" | "url">) => {
      thumbnailByPostId.set(media.post_id, media.thumbnail_url ?? media.url);
    });
  }

  const actorUserIds = Array.from(
    new Set(
      Array.from(metaByNotificationId.values())
        .map((meta) => meta.actorUserId)
        .filter((actorUserId): actorUserId is string => Boolean(actorUserId)),
    ),
  );
  const usersById = new Map<string, Pick<UserRow, "avatar_url" | "id" | "nickname">>();

  if (actorUserIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, nickname, avatar_url")
      .in("id", actorUserIds);

    if (usersError || !users) {
      throw new Error("알림 사용자 정보를 불러오지 못했습니다.");
    }

    users.forEach((user: Pick<UserRow, "avatar_url" | "id" | "nickname">) => {
      usersById.set(user.id, user);
    });
  }

  return notifications.map((notification: NotificationRow) => {
    const meta = metaByNotificationId.get(notification.id) ?? getFallbackMeta(notification);
    const actorUser = meta.actorUserId ? usersById.get(meta.actorUserId) : null;
    const story = meta.storyId ? storiesById.get(meta.storyId) : null;

    return {
      actor: actorUser
        ? {
            avatar_url: actorUser.avatar_url,
            nickname: actorUser.nickname,
          }
        : null,
      created_at: notification.created_at,
      href: meta.href,
      id: notification.id,
      is_read: notification.is_read,
      message: notification.message,
      reference_id: notification.reference_id,
      reference_type: notification.reference_type,
      thumbnail_url: meta.postId
        ? thumbnailByPostId.get(meta.postId) ?? null
        : story?.image_url ?? null,
      type: notification.type,
    };
  });
}

export async function getUnreadCount(): Promise<number> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error("읽지 않은 알림 수를 불러오지 못했습니다.");
  }

  return count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("알림 읽음 처리에 실패했습니다.");
  }
}

export async function markAllAsRead(): Promise<void> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error("전체 알림 읽음 처리에 실패했습니다.");
  }
}
