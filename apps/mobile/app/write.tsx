import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { WriteScreen } from "../src/screens/write/WriteScreen";

export default function WriteRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <WriteScreen />;
}
