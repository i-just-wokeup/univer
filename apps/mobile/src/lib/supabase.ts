import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { secureStorageAdapter } from "./secureStorage";
import type { Database } from "../types/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let mobileClient: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseMobileClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Expo Supabase 환경변수가 설정되지 않았습니다.");
  }

  if (!mobileClient) {
    mobileClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: secureStorageAdapter,
      },
    });
  }

  return mobileClient;
}
