import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { SettingsScreen } from "../src/screens/settings/SettingsScreen";

export default function SettingsRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <SettingsScreen />;
}
