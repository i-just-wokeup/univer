import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

// Cloudflare Stream webhook 서명 검증.
// 위조 방지: Webhook-Signature 헤더(time=…,sig1=…)를 webhook secret으로 HMAC-SHA256 검증.
// ⚠️ ENFORCE_SIGNATURE=false(모니터 모드): 검증하고 로그만 남기고 처리는 그대로.
//    실영상 업로드 로그로 "signature valid" 확인 후 true로 바꿔 배포하면 위조 요청을 차단한다.
//    (webhook을 잘못 막으면 영상이 처리중에 갇히므로 2단계로 안전하게 켠다.)
const ENFORCE_SIGNATURE = false;
const REPLAY_TOLERANCE_SEC = 300; // 서명 시각이 5분 이상 어긋나면 재전송 공격으로 간주

type CloudflareStreamWebhookPayload = {
  readyToStream?: boolean;
  status?: {
    state?: string;
  };
  thumbnail?: string;
  uid?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

function normalizeStatus(payload: CloudflareStreamWebhookPayload) {
  if (payload.readyToStream || payload.status?.state === "ready") {
    return "ready";
  }

  if (payload.status?.state === "error" || payload.status?.state === "failed") {
    return "failed";
  }

  return "processing";
}

// Webhook-Signature: "time=1620000000,sig1=abc123…" 파싱.
function parseSignatureHeader(
  header: string | null,
): { time: number; sig1: string } | null {
  if (!header) {
    return null;
  }

  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const [key, value] = segment.split("=");
    if (key && value) {
      parts[key.trim()] = value.trim();
    }
  }

  const time = Number(parts.time);
  const sig1 = parts.sig1;

  if (!Number.isFinite(time) || !sig1) {
    return null;
  }

  return { time, sig1 };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// webhook secret: env 우선, 없으면 Cloudflare API로 조회(등록 시 발급된 secret). 인스턴스 캐시.
let cachedWebhookSecret: string | null = null;
async function getWebhookSecret(): Promise<string> {
  const envSecret = Deno.env.get("CLOUDFLARE_STREAM_WEBHOOK_SECRET");
  if (envSecret) {
    return envSecret;
  }
  if (cachedWebhookSecret) {
    return cachedWebhookSecret;
  }

  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = getRequiredEnv("CLOUDFLARE_STREAM_TOKEN");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/webhook`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await response.json();
  const secret: string | undefined = data?.result?.secret;
  if (!secret) {
    throw new Error("Cloudflare webhook secret을 가져오지 못했습니다.");
  }
  cachedWebhookSecret = secret;
  return secret;
}

// 서명 검증 결과 — { ok, reason }. 시크릿 조회 실패 등 설정 오류는 ok=null(판단 불가)로 반환.
async function verifySignature(
  request: Request,
  bodyText: string,
): Promise<{ ok: boolean | null; reason: string }> {
  const parsed = parseSignatureHeader(request.headers.get("Webhook-Signature"));
  if (!parsed) {
    return { ok: false, reason: "missing or malformed Webhook-Signature" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parsed.time) > REPLAY_TOLERANCE_SEC) {
    return { ok: false, reason: "stale signature timestamp" };
  }

  try {
    const secret = await getWebhookSecret();
    const expected = await hmacSha256Hex(secret, `${parsed.time}.${bodyText}`);
    if (timingSafeEqual(expected, parsed.sig1)) {
      return { ok: true, reason: "valid" };
    }
    return { ok: false, reason: "signature mismatch" };
  } catch (error) {
    // 시크릿을 못 가져오면(우리 설정 문제) 판단 불가 — 처리를 끊지 않는다.
    return {
      ok: null,
      reason: `secret unavailable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const bodyText = await request.text();

    const verdict = await verifySignature(request, bodyText);
    console.log(
      `[stream-webhook] signature ${verdict.ok === true ? "valid" : verdict.ok === false ? "INVALID" : "unknown"} (${verdict.reason}) enforce=${ENFORCE_SIGNATURE}`,
    );
    if (ENFORCE_SIGNATURE && verdict.ok === false) {
      return jsonResponse({ error: "Invalid webhook signature" }, 401);
    }

    const payload = JSON.parse(bodyText) as CloudflareStreamWebhookPayload;
    const uid = payload.uid;

    if (!uid) {
      return jsonResponse({ error: "Missing Cloudflare Stream uid" }, 400);
    }

    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const processingStatus = normalizeStatus(payload);
    const update = {
      processing_status: processingStatus,
      thumbnail_url: payload.thumbnail ?? undefined,
    };

    await Promise.all([
      supabase
        .from("post_media")
        .update(update)
        .eq("provider", "cloudflare_stream")
        .eq("provider_asset_id", uid),
      supabase
        .from("stories")
        .update(update)
        .eq("provider", "cloudflare_stream")
        .eq("provider_asset_id", uid),
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Cloudflare webhook 처리에 실패했습니다.",
      },
      500,
    );
  }
});
