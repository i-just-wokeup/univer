import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

import { getRequiredEnv } from "./config.ts";

export function createOpsClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export type OpsSupabaseClient = ReturnType<typeof createOpsClient>;
