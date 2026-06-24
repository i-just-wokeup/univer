import { Redirect } from "expo-router";

import { useSession } from "../../src/lib/session";
import { ProfileEditScreen } from "../../src/screens/profile/ProfileEditScreen";

export default function ProfileEditRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <ProfileEditScreen />;
}
