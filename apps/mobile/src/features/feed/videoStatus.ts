import { getSupabaseMobileClient } from "../../lib/supabase";
import type { VideoProcessingStatus } from "./internalTypes";

// stream-status 엣지 함수가 Cloudflare에 직접 물어 DB를 갱신한다.
// webhook을 놓쳐도 앱 폴링만으로 processing 상태에서 복구되게 하는 안전장치다.
export async function getVideoStatuses(
  assetIds: string[],
): Promise<VideoProcessingStatus[]> {
  if (assetIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.functions.invoke("stream-status", {
    body: { assetIds },
  });

  if (error) {
    return [];
  }

  const statuses = (data as { statuses?: VideoProcessingStatus[] } | null)
    ?.statuses;
  return Array.isArray(statuses) ? statuses : [];
}
