import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type {
  NotificationItem,
  NotificationTarget,
} from "./types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type CommentLikeRow = Database["public"]["Tables"]["comment_likes"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

type NotificationMeta = {
  actorUserId: string | null;
  postId: string | null;
  storyId: string | null;
};

function getLatestRowsByTargetId<T extends { created_at: string }>(
  rows: T[],
  getTargetId: (row: T) => string,
) {
  const latestRowsByTargetId = new Map<string, T>();

  rows.forEach((row) => {
    const targetId = getTargetId(row);
    const currentRow = latestRowsByTargetId.get(targetId);

    if (!currentRow || currentRow.created_at < row.created_at) {
      latestRowsByTargetId.set(targetId, row);
    }
  });

  return latestRowsByTargetId;
}

async function getCurrentUserId() {
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

function getFallbackMeta(notification: NotificationRow): NotificationMeta {
  if (notification.reference_type === "post" && notification.reference_id) {
    return {
      actorUserId: null,
      postId: notification.reference_id,
      storyId: null,
    };
  }

  if (notification.reference_type === "story" && notification.reference_id) {
    return {
      actorUserId: null,
      postId: null,
      storyId: notification.reference_id,
    };
  }

  return { actorUserId: null, postId: null, storyId: null };
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = getSupabaseMobileClient();
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

  const postLikeTargetIds = notifications
    .filter(
      (notification) =>
        notification.type === "post_like" && Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (postLikeTargetIds.length > 0) {
    const { data: postLikes, error: postLikesError } = await supabase
      .from("post_likes")
      .select("id, user_id, target_type, target_id, created_at")
      .eq("target_type", "post")
      .neq("user_id", userId)
      .in("target_id", postLikeTargetIds);

    if (postLikesError || !postLikes) {
      throw new Error("좋아요 알림 정보를 불러오지 못했습니다.");
    }

    const latestPostLikesByPostId = getLatestRowsByTargetId(
      postLikes as PostLikeRow[],
      (postLike) => postLike.target_id,
    );

    notifications.forEach((notification: NotificationRow) => {
      if (notification.type !== "post_like" || !notification.reference_id) {
        return;
      }

      const postLike = latestPostLikesByPostId.get(notification.reference_id);

      if (!postLike) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: postLike.user_id,
        postId: postLike.target_id,
        storyId: null,
      });
    });
  }

  const storyLikeTargetIds = notifications
    .filter(
      (notification) =>
        notification.type === "story_like" && Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (storyLikeTargetIds.length > 0) {
    const { data: storyLikes, error: storyLikesError } = await supabase
      .from("post_likes")
      .select("id, user_id, target_type, target_id, created_at")
      .eq("target_type", "story")
      .neq("user_id", userId)
      .in("target_id", storyLikeTargetIds);

    if (storyLikesError || !storyLikes) {
      throw new Error("스토리 좋아요 알림 정보를 불러오지 못했습니다.");
    }

    const latestStoryLikesByStoryId = getLatestRowsByTargetId(
      storyLikes as PostLikeRow[],
      (storyLike) => storyLike.target_id,
    );

    notifications.forEach((notification: NotificationRow) => {
      if (notification.type !== "story_like" || !notification.reference_id) {
        return;
      }

      const storyLike = latestStoryLikesByStoryId.get(notification.reference_id);

      if (!storyLike) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: storyLike.user_id,
        postId: null,
        storyId: storyLike.target_id,
      });
    });
  }

  const commentLikeReferenceIds = notifications
    .filter(
      (notification) =>
        notification.type === "comment_like" &&
        Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (commentLikeReferenceIds.length > 0) {
    const { data: commentLikes, error: commentLikesError } = await supabase
      .from("comment_likes")
      .select("id, user_id, comment_id, created_at")
      .neq("user_id", userId)
      .in("comment_id", commentLikeReferenceIds);

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

    const latestCommentLikesByCommentId = getLatestRowsByTargetId(
      commentLikes as CommentLikeRow[],
      (commentLike) => commentLike.comment_id,
    );
    const commentsById = new Map<string, CommentRow>(
      comments.map((comment: CommentRow) => [comment.id, comment]),
    );

    notifications.forEach((notification: NotificationRow) => {
      if (notification.type !== "comment_like") {
        return;
      }

      const commentLike = notification.reference_id
        ? latestCommentLikesByCommentId.get(notification.reference_id)
        : null;
      const comment = commentLike
        ? commentsById.get(commentLike.comment_id)
        : null;

      if (!commentLike || !comment) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: commentLike.user_id,
        postId: comment.post_id,
        storyId: null,
      });
    });
  }

  const commentReferenceIds = notifications
    .filter(
      (notification) =>
        notification.type === "post_comment" &&
        Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));

  if (commentReferenceIds.length > 0) {
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
      .neq("user_id", userId)
      .in("post_id", commentReferenceIds);

    if (commentsError || !comments) {
      throw new Error("댓글 알림 정보를 불러오지 못했습니다.");
    }

    const latestCommentsByPostId = getLatestRowsByTargetId(
      comments as CommentRow[],
      (comment) => comment.post_id,
    );

    notifications.forEach((notification: NotificationRow) => {
      if (notification.type !== "post_comment") {
        return;
      }

      const comment = notification.reference_id
        ? latestCommentsByPostId.get(notification.reference_id)
        : null;

      if (!comment) {
        return;
      }

      metaByNotificationId.set(notification.id, {
        actorUserId: comment.user_id,
        postId: comment.post_id,
        storyId: null,
      });
    });
  }

  notifications.forEach((notification: NotificationRow) => {
    if (
      (notification.type !== "friend_request" &&
        notification.type !== "friend_accepted") ||
      !notification.reference_id
    ) {
      return;
    }

    metaByNotificationId.set(notification.id, {
      actorUserId: notification.reference_id,
      postId: null,
      storyId: null,
    });
  });

  const storyIds = Array.from(
    new Set(
      Array.from(metaByNotificationId.values())
        .map((meta) => meta.storyId)
        .filter((storyId): storyId is string => Boolean(storyId)),
    ),
  );
  const storiesById = new Map<
    string,
    Pick<StoryRow, "id" | "image_url" | "user_id">
  >();

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

    postMedia.forEach(
      (media: Pick<PostMediaRow, "post_id" | "thumbnail_url" | "url">) => {
        thumbnailByPostId.set(media.post_id, media.thumbnail_url ?? media.url);
      },
    );
  }

  const actorUserIds = Array.from(
    new Set(
      Array.from(metaByNotificationId.values())
        .map((meta) => meta.actorUserId)
        .filter((actorUserId): actorUserId is string => Boolean(actorUserId)),
    ),
  );
  const usersById = new Map<
    string,
    Pick<UserRow, "avatar_url" | "id" | "nickname">
  >();

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

  return notifications.map((notification: NotificationRow): NotificationItem => {
    const meta =
      metaByNotificationId.get(notification.id) ?? getFallbackMeta(notification);
    const actorUser = meta.actorUserId ? usersById.get(meta.actorUserId) : null;
    const story = meta.storyId ? storiesById.get(meta.storyId) : null;

    let target: NotificationTarget = null;

    if (
      (notification.type === "friend_request" ||
        notification.type === "friend_accepted") &&
      actorUser
    ) {
      target = { nickname: actorUser.nickname, type: "profile" };
    } else if (meta.postId) {
      target = { id: meta.postId, type: "post" };
    } else if (story) {
      target = { type: "story", userId: story.user_id };
    }

    return {
      actor: actorUser
        ? { avatar_url: actorUser.avatar_url, nickname: actorUser.nickname }
        : null,
      created_at: notification.created_at,
      id: notification.id,
      is_read: notification.is_read,
      message: notification.message,
      reference_type: notification.reference_type,
      target,
      thumbnail_url: meta.postId
        ? thumbnailByPostId.get(meta.postId) ?? null
        : story?.image_url ?? null,
      type: notification.type,
    };
  });
}

export async function getUnreadCount(): Promise<number> {
  const supabase = getSupabaseMobileClient();
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
  const supabase = getSupabaseMobileClient();
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
  const supabase = getSupabaseMobileClient();
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
