import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

// 공식 계정(학생회/동아리) 생성 전용 Edge Function.
// - 호출자는 반드시 admin(users.role='admin')이어야 한다.
// - auth.admin.createUser(service_role)로 계정을 발급하고, 임시 비번을 반환한다.
//   단체는 이 임시 비번으로 로그인 후 앱 설정에서 비밀번호를 직접 변경한다.

type CreateBody = {
  email?: string;
  orgName?: string;
  nickname?: string;
  type?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 8자 이상, 영문+숫자 조합(우리 비번 정책). 혼동 문자 제외.
function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = letters + digits;
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);

  const chars = Array.from(bytes, (byte) => all[byte % all.length]);
  // 최소 1개의 영문/숫자 보장
  chars[0] = letters[bytes[0] % letters.length];
  chars[1] = digits[bytes[1] % digits.length];

  return chars.join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // 1. 호출자 확인 (유저 스코프 클라이언트)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // 2. admin 검증 + 특권 작업용 service_role 클라이언트
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: caller, error: callerError } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerError || caller?.role !== "admin") {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // 3. 입력 검증
    const body = (await request.json()) as CreateBody;
    const email = (body.email ?? "").trim().toLowerCase();
    const orgName = (body.orgName ?? "").trim();
    const nickname = (body.nickname ?? "").trim();
    const type = body.type;

    if (!EMAIL_PATTERN.test(email)) {
      return jsonResponse({ error: "이메일 형식이 올바르지 않습니다." }, 400);
    }
    if (!orgName) {
      return jsonResponse({ error: "단체명을 입력하세요." }, 400);
    }
    if (!nickname) {
      return jsonResponse({ error: "닉네임을 입력하세요." }, 400);
    }
    if (type !== "official" && type !== "club") {
      return jsonResponse({ error: "유형이 올바르지 않습니다." }, 400);
    }

    const tempPassword = generateTempPassword();

    // 4. 가입 게이트 통과용 allowlist 등록 (단체 자가 가입이 아니라 관리자가 서버에서 발급)
    const { error: allowError } = await admin
      .from("signup_allowlist")
      .upsert({ email, note: `official:${orgName}` }, { onConflict: "email" });

    if (allowError) {
      return jsonResponse({ error: "가입 허용 등록에 실패했습니다." }, 500);
    }

    const cleanupAllowlist = async () => {
      await admin.from("signup_allowlist").delete().eq("email", email);
    };

    // 5. 계정 생성 (이메일 자동 확인)
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { real_name: orgName },
      });

    if (createError || !created?.user) {
      await cleanupAllowlist();
      const message =
        createError?.message === "A user with this email address has already been registered"
          ? "이미 등록된 이메일입니다."
          : createError?.message ?? "계정 생성에 실패했습니다.";
      return jsonResponse({ error: message }, 400);
    }

    const newUserId = created.user.id;

    const rollback = async () => {
      await admin.auth.admin.deleteUser(newUserId).catch(() => undefined);
      await cleanupAllowlist();
    };

    // 6. 닉네임 지정 (trigger가 만든 기본 닉네임 대체)
    const { error: nicknameError } = await admin
      .from("users")
      .update({ nickname })
      .eq("id", newUserId);

    if (nicknameError) {
      await rollback();
      return jsonResponse(
        { error: "닉네임이 이미 사용 중이거나 사용할 수 없습니다." },
        400,
      );
    }

    // 7. 공식 지정 (배지/스토리 권한 부여)
    const { error: officialError } = await admin
      .from("official_accounts")
      .insert({
        user_id: newUserId,
        type,
        scope: "school",
        verified_at: new Date().toISOString(),
      });

    if (officialError) {
      await rollback();
      return jsonResponse({ error: "공식 계정 등록에 실패했습니다." }, 500);
    }

    // 8. allowlist 정리 (이미 가입됐으므로 재사용 방지)
    await cleanupAllowlist();

    return jsonResponse({ userId: newUserId, tempPassword, nickname });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "공식 계정 생성에 실패했습니다.",
      },
      500,
    );
  }
});
