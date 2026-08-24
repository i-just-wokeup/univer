import { Redirect } from "expo-router";

import { isEmailPasswordUser } from "../src/features/auth/password";
import { useSession } from "../src/lib/session";
import { ChangePasswordScreen } from "../src/screens/settings/ChangePasswordScreen";

export default function ChangePasswordRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!isEmailPasswordUser(session.user)) {
    return <Redirect href="/settings" />;
  }

  return <ChangePasswordScreen />;
}
