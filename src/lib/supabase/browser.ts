import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// 브라우저에서는 클라이언트를 한 번만 만들고 재사용한다.
let browserClient: SupabaseClient<Database> | null = null;

// 클라이언트 컴포넌트/브라우저 API에서 공용으로 쓰는 Supabase 인스턴스 팩토리.
export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // 싱글턴으로 유지해 세션/캐시 동작을 안정적으로 맞춘다.
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
