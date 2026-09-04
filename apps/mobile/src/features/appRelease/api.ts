import { getSupabaseMobileClient } from "../../lib/supabase";
import type { Database } from "../../types/database.types";

export type AppReleasePlatform = "android" | "ios";

type AppReleaseRow = Database["public"]["Tables"]["app_release"]["Row"];

export type AppRelease = Pick<
  AppReleaseRow,
  "latest_version" | "min_version" | "platform" | "store_url"
>;

export async function getAppRelease(
  platform: AppReleasePlatform,
): Promise<AppRelease | null> {
  try {
    const supabase = getSupabaseMobileClient();
    const { data, error } = await supabase
      .from("app_release")
      .select("platform, latest_version, min_version, store_url")
      .eq("platform", platform)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
