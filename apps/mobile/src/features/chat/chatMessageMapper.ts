import type { Message, MessageRow } from "./types";

// DB 메시지 행 → 화면용 Message로 변환한다.
export function toMessage(row: MessageRow): Message {
  return {
    content: row.content,
    conversation_id: row.conversation_id,
    created_at: row.created_at,
    id: row.id,
    message_type: row.message_type,
    read_at: row.read_at,
    sender_id: row.sender_id,
    shared_post_id: row.shared_post_id,
  };
}
