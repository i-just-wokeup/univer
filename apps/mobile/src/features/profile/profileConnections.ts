import type { Json } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { clearProfilePageCache } from "./page-cache";
import type { ConnectionStatus } from "./types";
import { isConnectionStatus } from "./profileInternal";

// 대상과의 크루 상태(get_connection_status RPC)를 화면 모델로 검증해 반환한다.
export async function getConnectionStatus(
  userId: string,
): Promise<ConnectionStatus> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_connection_status", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("크루 연결 상태를 불러오지 못했습니다.");
  }

  const normalizedData = (data ?? null) as Json | null;

  if (!isConnectionStatus(normalizedData)) {
    throw new Error("크루 연결 상태 응답 형식이 올바르지 않습니다.");
  }

  return normalizedData;
}

export async function sendFriendRequest(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("send_friend_request", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("크루 신청에 실패했습니다.");
  }

  clearProfilePageCache();
}

export async function acceptFriendRequest(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("accept_friend_request", {
    requester_user_id: userId,
  });

  if (error) {
    throw new Error("크루 신청 수락에 실패했습니다.");
  }

  clearProfilePageCache();
}

export async function rejectFriendRequest(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("reject_friend_request", {
    requester_user_id: userId,
  });

  if (error) {
    throw new Error("크루 신청 거절에 실패했습니다.");
  }

  clearProfilePageCache();
}

export async function removeFriend(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("remove_friend", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("크루 연결 해제에 실패했습니다.");
  }

  clearProfilePageCache();
}
