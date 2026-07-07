import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId, isBlockRelatedUser } from "../shared/userContext";
import { getParticipantIds } from "./chatAccess";
import type { ConversationInsert } from "./types";

// 상대와의 대화방을 찾거나 새로 만든다.
// 크루(accepted)면 active, 아니면 pending 요청 대화로 생성한다.
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

// 받은 메시지 요청 수락 → 대화 active로 전환한다.
export async function acceptChatRequest(conversationId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const { error } = await supabase.rpc("accept_chat_request", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw new Error("메시지 요청 수락에 실패했습니다.");
  }
}
