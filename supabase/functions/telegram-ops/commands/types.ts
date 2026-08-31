import type { OpsSupabaseClient } from "../supabase.ts";

export type CommandContext = {
  supabase: OpsSupabaseClient;
};

export type CommandHandler = (
  context: CommandContext,
) => Promise<string> | string;
