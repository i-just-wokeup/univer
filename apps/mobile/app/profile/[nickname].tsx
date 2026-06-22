import { Redirect, useLocalSearchParams } from "expo-router";

import { ProfileScreen } from "../../src/screens/profile/ProfileScreen";
import { useSession } from "../../src/lib/session";

export default function UserProfileRoute() {
  const { session } = useSession();
  const { nickname } = useLocalSearchParams<{ nickname?: string | string[] }>();
  const profileNickname = Array.isArray(nickname) ? nickname[0] : nickname;

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!profileNickname) {
    return <Redirect href="/profile" />;
  }

  return <ProfileScreen nickname={profileNickname} />;
}
