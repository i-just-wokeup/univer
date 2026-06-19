import { clearExplorePageCache } from "@/features/explore/page-cache";
import { clearFeedPageCache } from "@/features/feed/page-cache";
import { clearProfilePageCache } from "@/features/profile/page-cache";

export function clearAllPageCaches() {
  clearFeedPageCache();
  clearExplorePageCache();
  clearProfilePageCache();
}
