// 검색 데이터 계층 — 유저 검색(search_users RPC + 차단 제외). 최근 검색은 ./history.ts.
import { getSupabaseMobileClient } from "../../lib/supabase";
import { getBlockRelatedUserIds } from "../shared/userContext";

export type SearchUser = {
  avatar_url: string | null;
  department: string;
  id: string;
  nickname: string;
};

// 같은 학교 유저를 닉네임/실명으로 검색(search_users RPC). 차단 관계 유저는 결과에서 제외한다.
export async function searchUsers(query: string): Promise<SearchUser[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("search_users", {
    search_query: trimmedQuery,
  });

  if (error) {
    throw new Error("유저 검색에 실패했습니다.");
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const blockRelatedUserIdSet = new Set(blockRelatedUserIds);

  return (data as SearchUser[]).filter(
    (user) => !blockRelatedUserIdSet.has(user.id),
  );
}
