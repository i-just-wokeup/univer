import type { Database } from "../../types/database.types";
import type { StoryVisibility } from "./types";

export type PostLikeInsert =
  Database["public"]["Tables"]["post_likes"]["Insert"];
export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

export type CreateVideoStoryParams = {
  assetId: string;
  backgroundColor?: string | null;
  durationSeconds?: number | null;
  provider: "cloudflare_stream";
  status: "processing";
  thumbnailUrl?: string | null;
  videoUrl: string;
  visibility?: StoryVisibility;
};
