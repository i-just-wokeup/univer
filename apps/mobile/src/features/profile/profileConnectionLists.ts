import { getSupabaseMobileClient } from "../../lib/supabase";
import type { ConnectionUser } from "./types";
import { normalizeConnectionUsers } from "./profileInternal";

export async function getFriends(): Promise<ConnectionUser[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_friends");

  if (error || !data) {
    throw new Error("크루 목록을 불러오지 못했습니다.");
  }

  return normalizeConnectionUsers(data);
}

export async function getPendingRequests(): Promise<ConnectionUser[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_pending_requests");

  if (error || !data) {
    throw new Error("받은 신청 목록을 불러오지 못했습니다.");
  }

  return normalizeConnectionUsers(data);
}

export async function getSentRequests(): Promise<ConnectionUser[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_sent_requests");

  if (error || !data) {
    throw new Error("보낸 신청 목록을 불러오지 못했습니다.");
  }

  return normalizeConnectionUsers(data);
}
