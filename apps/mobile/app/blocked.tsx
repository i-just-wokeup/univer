import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { BlockedAccountsScreen } from "../src/screens/settings/BlockedAccountsScreen";

export default function BlockedAccountsRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <BlockedAccountsScreen />;
}
