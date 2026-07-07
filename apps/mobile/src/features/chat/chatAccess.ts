import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getCurrentUserId,
  isBlockRelatedUser,
} from "../shared/userContext";

// 두 유저 id를 정렬해 participant_1/2로 만든다.
// 같은 쌍이 항상 같은 순서가 되어 대화방 유일성을 보장한다.
export function getParticipantIds(userId: string, targetUserId: string) {
  const [participant1Id, participant2Id] = [userId, targetUserId].sort();
  return { participant1Id, participant2Id };
}

// 대화방 접근 권한 확인: 참가자 본인인지 + 상대와 차단 관계가 아닌지 검사한다.
// 통과하면 이후 쿼리에 필요한 supabase/userId/otherUserId를 한 번에 반환한다.
export async function getConversationAccessContext(
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
