import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserId,
} from "../shared/userContext";
import type { ConversationRow } from "./types";

// 안읽은 메시지 총 개수. 홈/탭 뱃지용이라 차단 관계 대화는 제외한다.
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
