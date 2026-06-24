import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../../src/lib/session";
import { ChatRoomScreen } from "../../src/screens/messages/ChatRoomScreen";

export default function ChatRoomRoute() {
  const { session } = useSession();
  const { conversationId: rawConversationId } = useLocalSearchParams<{
    conversationId?: string | string[];
  }>();
  const conversationId = Array.isArray(rawConversationId)
    ? rawConversationId[0]
    : rawConversationId;

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!conversationId) {
    return <Redirect href="/messages" />;
  }

  return <ChatRoomScreen conversationId={conversationId} />;
}
