import { Redirect } from "expo-router";

import { useSession } from "../../src/lib/session";
import { ConnectionsScreen } from "../../src/screens/profile/ConnectionsScreen";

export default function ProfileConnectionsRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <ConnectionsScreen />;
}
