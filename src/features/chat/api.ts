import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type ConversationWithUser = {
  id: string;
  status: "pending" | "active";
  initiated_by: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  other_user: Pick<UserRow, "id" | "nickname" | "avatar_url">;
  unread_count: number;
};

export type Message = Pick<
  MessageRow,
  | "id"
  | "conversation_id"
  | "sender_id"
  | "message_type"
  | "content"
  | "read_at"
  | "created_at"
>;

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

function getParticipantIds(userId: string, targetUserId: string) {
  const [participant1Id, participant2Id] = [userId, targetUserId].sort();
  return { participant1Id, participant2Id };
}

function toMessage(row: MessageRow): Message {
  return {
    content: row.content,
    conversation_id: row.conversation_id,
    created_at: row.created_at,
    id: row.id,
    message_type: row.message_type,
    read_at: row.read_at,
    sender_id: row.sender_id,
  };
}

export async function getOrCreateConversation(
  targetUserId: string,
): Promise<string> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  if (userId === targetUserId) {
    throw new Error("본인과는 메시지를 시작할 수 없습니다.");
  }

  const { participant1Id, participant2Id } = getParticipantIds(
    userId,
    targetUserId,
  );

  const { data: existingConversation, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_1_id", participant1Id)
    .eq("participant_2_id", participant2Id)
    .maybeSingle();

  if (existingError) {
    throw new Error("대화방을 확인하지 못했습니다.");
  }

  if (existingConversation) {
    return existingConversation.id;
  }

  const { data: acceptedConnection, error: connectionError } = await supabase
    .from("user_connections")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${userId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${userId})`,
    )
    .maybeSingle();

  if (connectionError) {
    throw new Error("크루 연결 상태를 확인하지 못했습니다.");
  }

  const conversationInsert: ConversationInsert = {
    initiated_by: userId,
    participant_1_id: participant1Id,
    participant_2_id: participant2Id,
    status: acceptedConnection ? "active" : "pending",
  };

  const { data: createdConversation, error: createError } = await supabase
    .from("conversations")
    .insert(conversationInsert)
    .select("id")
    .single();

  if (createError || !createdConversation) {
    throw new Error("대화방을 만들지 못했습니다.");
  }

  return createdConversation.id;
}

export async function getConversations(): Promise<{
  active: ConversationWithUser[];
  pending: ConversationWithUser[];
}> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      "id, participant_1_id, participant_2_id, status, initiated_by, last_message_at, last_message_preview, last_message_sender_id, hidden_at_1, hidden_at_2, created_at, updated_at",
    )
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !conversations) {
    throw new Error("대화 목록을 불러오지 못했습니다.");
  }

  if (conversations.length === 0) {
    return { active: [], pending: [] };
  }

  const conversationRows = conversations as ConversationRow[];
  const otherUserIds = Array.from(
    new Set(
      conversationRows.map((conversation) =>
        conversation.participant_1_id === userId
          ? conversation.participant_2_id
          : conversation.participant_1_id,
      ),
    ),
  );

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nickname, avatar_url")
    .in("id", otherUserIds);

  if (usersError || !users) {
    throw new Error("대화 상대 정보를 불러오지 못했습니다.");
  }

  const conversationIds = conversationRows.map((conversation) => conversation.id);
  const { data: unreadMessages, error: unreadError } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null)
    .is("deleted_at", null);

  if (unreadError || !unreadMessages) {
    throw new Error("읽지 않은 메시지 수를 불러오지 못했습니다.");
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
  const unreadCountsByConversationId = new Map<string, number>();

  unreadMessages.forEach((message) => {
    unreadCountsByConversationId.set(
      message.conversation_id,
      (unreadCountsByConversationId.get(message.conversation_id) ?? 0) + 1,
    );
  });

  const normalizedConversations = conversationRows.reduce<
    ConversationWithUser[]
  >((items, conversation) => {
    const otherUserId =
      conversation.participant_1_id === userId
        ? conversation.participant_2_id
        : conversation.participant_1_id;
    const otherUser = usersById.get(otherUserId);

    if (!otherUser) {
      return items;
    }

    items.push({
      id: conversation.id,
      initiated_by: conversation.initiated_by,
      last_message_at: conversation.last_message_at,
      last_message_preview: conversation.last_message_preview,
      last_message_sender_id: conversation.last_message_sender_id,
      other_user: otherUser,
      status: conversation.status,
      unread_count: unreadCountsByConversationId.get(conversation.id) ?? 0,
    });

    return items;
  }, []);

  return {
    active: normalizedConversations.filter(
      (conversation) => conversation.status === "active",
    ),
    pending: normalizedConversations.filter(
      (conversation) => conversation.status === "pending",
    ),
  };
}

export async function getMessages(
  conversationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<Message[]> {
  const supabase = requireSupabaseClient();
  const limit = options.limit ?? 50;

  let query = supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, message_type, content, read_at, deleted_at, created_at",
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

  return (messages as MessageRow[]).map(toMessage).reverse();
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("메시지를 입력해주세요.");
  }

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
      "id, conversation_id, sender_id, message_type, content, read_at, deleted_at, created_at",
    )
    .single();

  if (messageError || !createdMessage) {
    throw new Error("메시지를 보내지 못했습니다.");
  }

  window.dispatchEvent(new Event("chat:refresh"));

  return toMessage(createdMessage as MessageRow);
}

export async function markMessagesRead(conversationId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("mark_messages_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw new Error("메시지 읽음 처리에 실패했습니다.");
  }

  window.dispatchEvent(new Event("chat:refresh"));
}

export async function acceptChatRequest(conversationId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("accept_chat_request", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw new Error("메시지 요청 수락에 실패했습니다.");
  }

  window.dispatchEvent(new Event("chat:refresh"));
}

export async function getChatUnreadCount(): Promise<number> {
  const supabase = requireSupabaseClient();
  const userId = await getCurrentUserId();

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

  if (conversationsError || !conversations) {
    throw new Error("대화 목록을 불러오지 못했습니다.");
  }

  if (conversations.length === 0) {
    return 0;
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null)
    .is("deleted_at", null);

  if (error) {
    throw new Error("읽지 않은 메시지 수를 불러오지 못했습니다.");
  }

  return count ?? 0;
}
