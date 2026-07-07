import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserId,
} from "../shared/userContext";
import type { ConversationRow, ConversationWithUser } from "./types";

// 내 대화 목록을 active/pending으로 분리한다.
// 차단 관계 대화는 제외하고, 상대 정보와 안읽은 수를 합쳐 반환한다.
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

  const conversationIds = conversationRows.map(
    (conversation) => conversation.id,
  );
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
