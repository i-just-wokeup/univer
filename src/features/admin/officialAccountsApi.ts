import { FunctionsHttpError } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type OfficialAccountType = "official" | "club";

export type OfficialAccount = {
  createdAt: string;
  email: string;
  nickname: string;
  orgName: string;
  type: OfficialAccountType;
  userId: string;
  verifiedAt: string | null;
};

export type CreateOfficialAccountInput = {
  email: string;
  nickname: string;
  orgName: string;
  type: OfficialAccountType;
};

export type CreatedOfficialAccount = {
  nickname: string;
  tempPassword: string;
  userId: string;
};

type UnknownRecord = Record<string, unknown>;

type OfficialAccountRpcClient = {
  rpc: (
    functionName: string,
    args?: Record<string, string>,
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeOfficialAccount(value: unknown): OfficialAccount | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = readString(value, "type");
  const userId = readString(value, "user_id");
  const nickname = readString(value, "nickname");
  const orgName = readString(value, "org_name");
  const email = readString(value, "email");
  const createdAt = readString(value, "created_at");

  if (
    (type !== "official" && type !== "club") ||
    !userId ||
    !nickname ||
    !orgName ||
    !email ||
    !createdAt
  ) {
    return null;
  }

  return {
    createdAt,
    email,
    nickname,
    orgName,
    type,
    userId,
    verifiedAt: readString(value, "verified_at"),
  };
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const context: unknown = error.context;

    if (
      typeof context === "object" &&
      context !== null &&
      "json" in context &&
      typeof context.json === "function"
    ) {
      try {
        const payload: unknown = await context.json();

        if (isRecord(payload)) {
          const message = readString(payload, "error");
          if (message) {
            return message;
          }
        }
      } catch {
        // 응답 본문을 읽지 못하면 SDK 오류 메시지로 폴백한다.
      }
    }
  }

  return error instanceof Error
    ? error.message
    : "공식 계정 생성에 실패했습니다.";
}

async function callOfficialAccountRpc(
  functionName: string,
  args?: Record<string, string>,
): Promise<unknown> {
  const supabase = requireSupabaseClient() as unknown as OfficialAccountRpcClient;
  const { data, error } = await supabase.rpc(functionName, args);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createOfficialAccount(
  input: CreateOfficialAccountInput,
): Promise<CreatedOfficialAccount> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.functions.invoke<unknown>(
    "create-official-account",
    { body: input },
  );

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!isRecord(data)) {
    throw new Error("공식 계정 생성 결과를 확인하지 못했습니다.");
  }

  const userId = readString(data, "userId");
  const tempPassword = readString(data, "tempPassword");
  const nickname = readString(data, "nickname");

  if (!userId || !tempPassword || !nickname) {
    throw new Error("공식 계정 생성 결과가 올바르지 않습니다.");
  }

  return { nickname, tempPassword, userId };
}

export async function listOfficialAccounts(): Promise<OfficialAccount[]> {
  const data = await callOfficialAccountRpc("list_official_accounts");

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizeOfficialAccount)
    .filter((account): account is OfficialAccount => account !== null);
}

export async function setOfficialType(
  userId: string,
  type: OfficialAccountType,
): Promise<void> {
  await callOfficialAccountRpc("set_official_type", {
    p_type: type,
    p_user_id: userId,
  });
}

export async function revokeOfficial(userId: string): Promise<void> {
  await callOfficialAccountRpc("revoke_official", {
    p_user_id: userId,
  });
}
