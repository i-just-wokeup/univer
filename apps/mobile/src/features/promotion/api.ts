import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";

export type PromotionRequestStatus = "approved" | "pending" | "rejected";

export type PromotionRequestState = {
  reviewedAt: string | null;
  status: PromotionRequestStatus;
};

export type PromotionRequestResult = {
  id: string;
  status: "pending";
};

function isPromotionRequestResult(
  value: unknown,
): value is PromotionRequestResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;
  return typeof result.id === "string" && result.status === "pending";
}

export async function getMyPromotionStatus(): Promise<PromotionRequestState | null> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("promotion_requests")
    .select("status, reviewed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("프로 계정 신청 상태를 불러오지 못했습니다.");
  }

  if (!data) {
    return null;
  }

  return {
    reviewedAt: data.reviewed_at,
    status: data.status,
  };
}

export async function requestPromotion(): Promise<PromotionRequestResult> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("request_promotion");

  if (error) {
    throw new Error(error.message);
  }

  if (!isPromotionRequestResult(data)) {
    throw new Error("프로 계정 신청 결과를 확인하지 못했습니다.");
  }

  return data;
}
