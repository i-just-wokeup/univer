// 채팅 데이터 계층 — 대화방 조회/생성, 메시지 송수신/읽음, 요청 수락, 안읽은 수.
// 모든 조회는 차단 관계 대화를 제외하고, 메시지 접근은 참가자 본인인지 확인한다.
// Realtime/낙관적 전송은 features/chat/hooks.ts.
import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserId,
  isBlockRelatedUser,
} from "../shared/userContext";

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
  other_user: Pick<UserRow, "avatar_url" | "id" | "nickname">;
  unread_count: number;
};

export type Message = Pick<
  MessageRow,
  | "content"
  | "conversation_id"
  | "created_at"
  | "id"
  | "message_type"
  | "read_at"
  | "sender_id"
>;

// 두 유저 id를 정렬해 participant_1/2로 — 같은 쌍이 항상 같은 순서가 되게(대화방 유일성 보장).
function getParticipantIds(userId: string, targetUserId: string) {
  const [participant1Id, participant2Id] = [userId, targetUserId].sort();
  return { participant1Id, participant2Id };
}

// DB 메시지 행 → 화면용 Message로 변환.
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

// 대화방 접근 권한 확인 — 참가자 본인인지 + 상대와 차단 관계 아닌지. 통과 시 {상대id, supabase, userId}.
async function getConversationAccessContext(
  conversationId: string,
  blockedMessage = "차단 관계인 대화는 볼 수 없습니다.",
) {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, participant_1_id, participant_2_id")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) {
    throw new Error("대화방을 찾을 수 없습니다.");
  }

  if (
    conversation.participant_1_id !== userId &&
    conversation.participant_2_id !== userId
  ) {
    throw new Error("대화방을 찾을 수 없습니다.");
  }

  const otherUserId =
    conversation.participant_1_id === userId
      ? conversation.participant_2_id
      : conversation.participant_1_id;

  const isBlocked = await isBlockRelatedUser(otherUserId);

  if (isBlocked) {
    throw new Error(blockedMessage);
  }

  return { otherUserId, supabase, userId };
}

// 상대와의 대화방을 찾거나 새로 만든다. 크루(accepted)면 active, 아니면 pending(요청)으로 생성.
// 본인/차단 상대는 거부. → conversationId 반환.
export async function getOrCreateConversation(
  targetUserId: string,
): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  if (userId === targetUserId) {
    throw new Error("본인과는 메시지를 시작할 수 없습니다.");
  }

  const isBlocked = await isBlockRelatedUser(targetUserId);

  if (isBlocked) {
    throw new Error("차단 관계에서는 메시지를 시작할 수 없습니다.");
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

// 내 대화 목록을 active/pending으로 분리. 차단 관계 대화 제외, 상대 정보·안읽은 수를 합쳐 반환.
export async function getConversations(): Promise<{
  active: ConversationWithUser[];
  pending: ConversationWithUser[];
}> {
  const supabase = getSupabaseMobileClient();
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

  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const blockRelatedUserIdSet = new Set(blockRelatedUserIds);

  const conversationRows = (conversations as ConversationRow[]).filter(
    (conversation) => {
      const otherUserId =
        conversation.participant_1_id === userId
          ? conversation.participant_2_id
          : conversation.participant_1_id;
      return !blockRelatedUserIdSet.has(otherUserId);
    },
  );

  if (conversationRows.length === 0) {
    return { active: [], pending: [] };
  }

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

// 대화 메시지 목록(접근 권한 체크). 최신 limit개를 받아 오래된→최신 순으로 뒤집어 반환. before로 이전 페이지.
export async function getMessages(
  conversationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<Message[]> {
  const { supabase } = await getConversationAccessContext(conversationId);
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

// 메시지 전송(접근 권한 체크 + 빈 내용 거부) → 생성된 Message.
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
      "id, conversation_id, sender_id, message_type, content, read_at, deleted_at, created_at",
    )
    .single();

  if (messageError || !createdMessage) {
    throw new Error("메시지를 보내지 못했습니다.");
  }

  return toMessage(createdMessage as MessageRow);
}

// 대화방의 안읽은(상대가 보낸) 메시지를 읽음 처리(mark_messages_read RPC).
export async function markMessagesRead(conversationId: string): Promise<void> {
  const { supabase } = await getConversationAccessContext(conversationId);

  const { error } = await supabase.rpc("mark_messages_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw new Error("메시지 읽음 처리에 실패했습니다.");
  }
}

// 받은 메시지 요청 수락 → 대화 active로 전환(accept_chat_request RPC).
export async function acceptChatRequest(conversationId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const { error } = await supabase.rpc("accept_chat_request", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw new Error("메시지 요청 수락에 실패했습니다.");
  }
}

// 안읽은 메시지 총 개수(하단 탭/홈 뱃지용). 차단 관계 대화는 제외.
export async function getChatUnreadCount(): Promise<number> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, participant_1_id, participant_2_id")
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

  if (conversationsError || !conversations) {
    throw new Error("대화 목록을 불러오지 못했습니다.");
  }

  if (conversations.length === 0) {
    return 0;
  }

  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const blockRelatedUserIdSet = new Set(blockRelatedUserIds);
  const conversationIds = (conversations as Pick<
    ConversationRow,
    "id" | "participant_1_id" | "participant_2_id"
  >[])
    .filter((conversation) => {
      const otherUserId =
        conversation.participant_1_id === userId
          ? conversation.participant_2_id
          : conversation.participant_1_id;

      return !blockRelatedUserIdSet.has(otherUserId);
    })
    .map((conversation) => conversation.id);

  if (conversationIds.length === 0) {
    return 0;
  }

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
