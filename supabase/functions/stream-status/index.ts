import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

// 영상 상태 복구 경로. webhook(stream-webhook)이 주 경로이지만 놓칠 수 있어,
// 클라 폴링이 이 함수를 호출하면 Cloudflare에 직접 상태를 물어보고 DB(post_media/stories)를 갱신한다.
// → webhook이 실패해도 영상이 영원히 processing으로 남지 않음.

type StatusRequest = { assetIds?: string[] };

type CloudflareStreamGetResponse = {
  result?: {
    uid?: string;
    readyToStream?: boolean;
    status?: { state?: string };
    thumbnail?: string;
  };
  success?: boolean;
};

type VideoStatus = {
  processingStatus: "processing" | "ready" | "failed";
  providerAssetId: string;
  thumbnailUrl: string;
  url: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

function normalizeStatus(
  result: CloudflareStreamGetResponse["result"],
): VideoStatus["processingStatus"] {
  if (!result) {
    return "processing";
  }
  if (result.readyToStream || result.status?.state === "ready") {
    return "ready";
  }
  if (result.status?.state === "error" || result.status?.state === "failed") {
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
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const cloudflareAccountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
    const cloudflareStreamToken = getRequiredEnv("CLOUDFLARE_STREAM_TOKEN");

    // 로그인 유저만 호출 가능(남용 방지).
    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { assetIds } = (await request.json()) as StatusRequest;
    if (!assetIds || assetIds.length === 0) {
      return jsonResponse({ statuses: [] });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // uid별로 Cloudflare에 직접 상태 조회 → DB 갱신 → 결과 반환.
    const statuses: VideoStatus[] = await Promise.all(
      assetIds.slice(0, 50).map(async (uid) => {
        const url = `https://videodelivery.net/${uid}/manifest/video.m3u8`;
        const fallbackThumb = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
        try {
          const res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream/${uid}`,
            { headers: { Authorization: `Bearer ${cloudflareStreamToken}` } },
          );
          const json = (await res.json()) as CloudflareStreamGetResponse;
          const processingStatus = normalizeStatus(json.result);
          const thumbnailUrl = json.result?.thumbnail ?? fallbackThumb;

          // ready로 확정됐을 때만 상태/썸네일 갱신(processing 중엔 기존 값 보존).
          if (processingStatus !== "processing") {
            const update: Record<string, unknown> = { processing_status: processingStatus };
            if (processingStatus === "ready") {
              update.thumbnail_url = thumbnailUrl;
            }
            await Promise.all([
              admin
                .from("post_media")
                .update(update)
                .eq("provider", "cloudflare_stream")
                .eq("provider_asset_id", uid),
              admin
                .from("stories")
                .update(update)
                .eq("provider", "cloudflare_stream")
                .eq("provider_asset_id", uid),
            ]);
          }

          return { processingStatus, providerAssetId: uid, thumbnailUrl, url };
        } catch {
          // 개별 조회 실패는 processing으로 두고 다음 폴링에서 재시도.
          return {
            processingStatus: "processing" as const,
            providerAssetId: uid,
            thumbnailUrl: fallbackThumb,
            url,
          };
        }
      }),
    );

    return jsonResponse({ statuses });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Cloudflare 영상 상태 조회에 실패했습니다.",
      },
      500,
    );
  }
});
