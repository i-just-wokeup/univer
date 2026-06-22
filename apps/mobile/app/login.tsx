import { Redirect } from "expo-router";

import { useSession } from "../src/lib/session";
import { LoginScreen } from "../src/screens/auth/LoginScreen";

export default function LoginRoute() {
  const { session } = useSession();

  if (session) {
    return <Redirect href="/" />;
  }

  return <LoginScreen />;
}
