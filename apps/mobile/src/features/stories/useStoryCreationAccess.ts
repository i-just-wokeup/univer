import { useSession } from "../../lib/session";
import { useVerifiedUsers } from "../../lib/verifiedUsers";

export function useStoryCreationAccess() {
  const { session } = useSession();
  const { getBadge, isBadgeDataReady } = useVerifiedUsers();
  const userId = session?.user.id ?? null;
  const badge = userId ? getBadge(userId) : null;
  const canCreateStory =
    isBadgeDataReady &&
    badge !== null &&
    (badge.affiliation !== null || badge.promoted);

  return {
    canCreateStory,
    isStoryCreationAccessReady: Boolean(userId) && isBadgeDataReady,
  };
}
