// 채팅 API public 진입점.
// 호출부는 계속 "./api"만 import하고, 실제 책임은 역할별 파일에서 관리한다.
export {
  acceptChatRequest,
  getOrCreateConversation,
} from "./chatConversationMutations";
export { getConversations } from "./chatConversationList";
export {
  getMessages,
  markMessagesRead,
  sendMessage,
} from "./chatMessages";
export {
  hydrateMessagesWithSharedPosts,
  sendPostMessage,
} from "./chatSharedPosts";
export { getChatUnreadCount } from "./chatUnread";
export type {
  ConversationWithUser,
  Message,
  SharedPostPreview,
} from "./types";
