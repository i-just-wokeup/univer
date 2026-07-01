import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

type CloudflareDirectUploadResponse = {
  errors?: Array<{ message?: string }>;
  result?: {
    uid?: string;
    uploadURL?: string;
  };
  success?: boolean;
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
    const cloudflareAccountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
    const cloudflareStreamToken = getRequiredEnv("CLOUDFLARE_STREAM_TOKEN");
    const authorization = request.headers.get("Authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream/direct_upload`,
      {
        body: JSON.stringify({
          maxDurationSeconds: 600,
          meta: {
            source: "univer-mobile",
            userId: user.id,
          },
          requireSignedURLs: false,
        }),
        headers: {
          Authorization: `Bearer ${cloudflareStreamToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );
    const cloudflareJson =
      (await cloudflareResponse.json()) as CloudflareDirectUploadResponse;

    if (!cloudflareResponse.ok || !cloudflareJson.success) {
      const message =
        cloudflareJson.errors?.[0]?.message ?? "Cloudflare 업로드 URL 생성에 실패했습니다.";
      return jsonResponse({ error: message }, 502);
    }

    const uid = cloudflareJson.result?.uid;
    const uploadURL = cloudflareJson.result?.uploadURL;

    if (!uid || !uploadURL) {
      return jsonResponse({ error: "Cloudflare 응답이 올바르지 않습니다." }, 502);
    }

    return jsonResponse({
      playbackUrl: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
      provider: "cloudflare_stream",
      status: "processing",
      thumbnailUrl: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
      uid,
      uploadURL,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Cloudflare 업로드 URL 생성에 실패했습니다.",
      },
      500,
    );
  }
});
