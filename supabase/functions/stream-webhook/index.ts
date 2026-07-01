import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = (await request.json()) as CloudflareStreamWebhookPayload;
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
