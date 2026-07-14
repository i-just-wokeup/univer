import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { InsightsScreen } from "../src/screens/insights/InsightsScreen";

export default function InsightsRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <InsightsScreen />;
}
