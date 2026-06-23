import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { NotificationsScreen } from "../src/screens/notifications/NotificationsScreen";

export default function NotificationsRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <NotificationsScreen />;
}
