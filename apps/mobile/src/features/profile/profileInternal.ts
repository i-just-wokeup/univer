import type { Database, Json } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type {
  ConnectionStatus,
  ConnectionUser,
  ProfileLink,
} from "./types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
export type ProfileLinkRow =
  Database["public"]["Tables"]["profile_links"]["Row"];

// get_connection_status RPC는 Json으로 내려오므로 화면 타입으로 쓰기 전에 한 번 검증한다.
export function isConnectionStatus(
  value: Json | null,
): value is ConnectionStatus {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "status" in value &&
    typeof value.status === "string" &&
    (value.status === "none" ||
      value.status === "pending" ||
      value.status === "accepted" ||
      value.status === "rejected") &&
    "is_requester" in value &&
    typeof value.is_requester === "boolean" &&
    "friends_count" in value &&
    typeof value.friends_count === "number"
  );
}

// 크루 목록 RPC는 필요한 필드만 화면 모델로 정리해서 외부에 넘긴다.
export function normalizeConnectionUsers(
  users: ConnectionUser[],
): ConnectionUser[] {
  return users.map(({ avatar_url, department, id, nickname }) => ({
    avatar_url,
    department,
    id,
    nickname,
  }));
}

// 실명은 본인이거나 크루(accepted)일 때만 RPC가 값을 반환한다.
export async function getRealName(userId: string): Promise<string | null> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_user_real_name", {
    p_user_id: userId,
  });

  if (error || typeof data !== "string") {
    return null;
  }

  return data;
}

// 프로필 대표 링크는 부가 정보라 실패해도 프로필 조회 자체는 막지 않는다.
export async function getProfileLinks(
  userId: string,
): Promise<ProfileLink[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase
    .from("profile_links")
    .select("id, label, url, order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (
    data as Pick<ProfileLinkRow, "id" | "label" | "order_index" | "url">[]
  ).map((link) => ({ id: link.id, label: link.label, url: link.url }));
}
