import { Redirect } from "expo-router";

import { useSession } from "../../src/lib/session";
import { MessagesScreen } from "../../src/screens/messages/MessagesScreen";

export default function MessagesRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <MessagesScreen />;
}
