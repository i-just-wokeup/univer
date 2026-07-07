import { getPost } from "../feed/api";
import type { FeedPost } from "../feed/types";
import { getConversationAccessContext } from "./chatAccess";
import { toMessage } from "./chatMessageMapper";
import type {
  Message,
  MessageInsert,
  MessageRow,
  SharedPostPreview,
} from "./types";

function toSharedPostPreview(post: FeedPost): SharedPostPreview {
  const firstMedia = post.media[0] ?? null;

  return {
    aspect_ratio: post.aspect_ratio,
    authorAvatarUrl: post.user.avatar_url,
    authorNickname: post.user.nickname,
    content: post.content,
    id: post.id,
    mediaType: firstMedia?.type ?? null,
    thumbnailUrl: firstMedia?.thumbnail_url ?? firstMedia?.url ?? null,
  };
}

function getPostMessageContent(post: FeedPost) {
  const trimmedContent = post.content?.trim();

  if (trimmedContent) {
    return trimmedContent.slice(0, 80);
  }

  return "[게시물]";
}

// post 메시지에 게시물 미리보기를 붙인다.
// 접근 불가/삭제/차단이면 sharedPost=null로 내려 화면에서 폴백 문구를 보여준다.
export async function hydrateMessagesWithSharedPosts(
  messages: Message[],
): Promise<Message[]> {
  const postIds = Array.from(
    new Set(
      messages
        .filter((message) => message.message_type === "post")
        .map((message) => message.shared_post_id)
        .filter((postId): postId is string => Boolean(postId)),
    ),
  );

  if (postIds.length === 0) {
    return messages;
  }

  const postEntries = await Promise.all(
    postIds.map(async (postId) => {
      try {
        return [postId, toSharedPostPreview(await getPost(postId))] as const;
      } catch {
        return [postId, null] as const;
      }
    }),
  );
  const postsById = new Map<string, SharedPostPreview | null>(postEntries);

  return messages.map((message) => {
    if (message.message_type !== "post" || !message.shared_post_id) {
      return message;
    }

    return {
      ...message,
      sharedPost: postsById.get(message.shared_post_id) ?? null,
    };
  });
}

// 게시물 공유 메시지 전송. content CHECK와 대화 미리보기를 위해 content는 항상 채운다.
export async function sendPostMessage(
  conversationId: string,
  postId: string,
): Promise<Message> {
  const post = await getPost(postId);
  const { supabase, userId } = await getConversationAccessContext(
    conversationId,
    "차단 관계에서는 게시물을 보낼 수 없습니다.",
  );

  const messageInsert: MessageInsert = {
    content: getPostMessageContent(post),
    conversation_id: conversationId,
    message_type: "post",
    sender_id: userId,
    shared_post_id: postId,
  };

  const { data: createdMessage, error: messageError } = await supabase
    .from("messages")
    .insert(messageInsert)
    .select(
      "id, conversation_id, sender_id, message_type, content, shared_post_id, read_at, deleted_at, created_at",
    )
    .single();

  if (messageError || !createdMessage) {
    throw new Error("게시물을 보내지 못했습니다.");
  }

  return {
    ...toMessage(createdMessage as MessageRow),
    sharedPost: toSharedPostPreview(post),
  };
}
