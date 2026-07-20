import { clearExplorePageCache } from "../explore/page-cache";
import { clearFeedPageCache } from "../feed/page-cache";
import { clearProfilePageCache } from "../profile/page-cache";

export function clearAllPageCaches() {
  clearFeedPageCache();
  clearExplorePageCache();
  clearProfilePageCache();
}
