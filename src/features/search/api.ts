import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getBlockRelatedUserIds } from "@/features/blocks/api";

export type SearchUser = {
  avatar_url: string | null;
  department: string | null; // 학과 비공개 시 서버(search_users)가 null 반환
  id: string;
  nickname: string;
};

export async function searchUsers(query: string): Promise<SearchUser[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

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
