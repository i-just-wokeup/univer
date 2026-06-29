// 현재 열려 있는 채팅방 id를 들고 있는 작은 모듈.
// 채팅방 화면이 포커스 시 설정/블러 시 해제하고, 푸시 핸들러가 이 값을 보고
// "지금 보고 있는 방"의 새 메시지 알림은 배너로 띄우지 않는다.
let activeConversationId: string | null = null;

export function setActiveConversationId(conversationId: string | null) {
  activeConversationId = conversationId;
}

export function getActiveConversationId(): string | null {
  return activeConversationId;
}
