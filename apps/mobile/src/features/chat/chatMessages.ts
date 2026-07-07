import { getConversationAccessContext } from "./chatAccess";
import { toMessage } from "./chatMessageMapper";
import { hydrateMessagesWithSharedPosts } from "./chatSharedPosts";
import type { Message, MessageInsert, MessageRow } from "./types";

// 대화 메시지 목록. 최신 limit개를 받아 오래된→최신 순으로 뒤집어 반환한다.
export async function getMessages(
  conversationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<Message[]> {
  const { supabase } = await getConversationAccessContext(conversationId);
  const limit = options.limit ?? 50;

  let query = supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, message_type, content, shared_post_id, read_at, deleted_at, created_at",
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.before) {
    query = query.lt("created_at", options.before);
  }

  const { data: messages, error } = await query;

  if (error || !messages) {
    throw new Error("메시지를 불러오지 못했습니다.");
  }

  return hydrateMessagesWithSharedPosts(
    (messages as MessageRow[]).map(toMessage).reverse(),
  );
}

// 일반 텍스트 메시지 전송. 빈 내용은 DB에 보내기 전에 차단한다.
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message> {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("메시지를 입력해주세요.");
  }

  const { supabase, userId } = await getConversationAccessContext(
    conversationId,
    "차단 관계에서는 메시지를 보낼 수 없습니다.",
  );

  const messageInsert: MessageInsert = {
    content: trimmedContent,
    conversation_id: conversationId,
    message_type: "text",
    sender_id: userId,
  };

  const { data: createdMessage, error: messageError } = await supabase
    .from("messages")
    .insert(messageInsert)
    .select(
      "id, conversation_id, sender_id, message_type, content, shared_post_id, read_at, deleted_at, created_at",
    )
    .single();

  if (messageError || !createdMessage) {
    throw new Error("메시지를 보내지 못했습니다.");
  }

  return toMessage(createdMessage as MessageRow);
}

// 대화방의 안읽은 상대 메시지를 읽음 처리한다.
export async function markMessagesRead(conversationId: string): Promise<void> {
  const { supabase } = await getConversationAccessContext(conversationId);

  const { error } = await supabase.rpc("mark_messages_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw new Error("메시지 읽음 처리에 실패했습니다.");
  }
}
