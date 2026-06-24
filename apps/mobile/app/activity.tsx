import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { MyActivityScreen } from "../src/screens/activity/MyActivityScreen";

export default function MyActivityRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <MyActivityScreen />;
}
