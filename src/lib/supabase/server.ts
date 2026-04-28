import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Server Component와 Route Handler에서 쓰는 서버용 Supabase 클라이언트 생성기.
export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Next App Router의 쿠키 스토어를 그대로 연결해 서버에서도 세션을 읽는다.
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options as CookieOptions);
          } catch {
            // Server Component 문맥에서는 쿠키 쓰기가 실패할 수 있으므로 조용히 무시한다.
          }
        });
      },
    },
  }) satisfies SupabaseClient<Database>;
}
