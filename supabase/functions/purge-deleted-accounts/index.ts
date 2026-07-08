// 탈퇴(soft delete) 후 보존기간(기본 30일)이 지난 계정을 영구 삭제한다.
// - storage.objects.owner = uid 파일 삭제(avatars/post-images/story-images)
// - comments 명시 삭제(users FK가 SET NULL이라 auth 삭제만으론 안 지워짐)
// - auth.admin.deleteUser(uid) → public.users FK가 CASCADE라 posts/stories/messages 등 나머지 연쇄 삭제
// 인증: Authorization: Bearer <SERVICE_ROLE_KEY> (cron이 pg_net으로 호출). 사용자 JWT 아님.
// 호출 옵션(JSON body): { dryRun?: boolean, retentionDays?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const DEFAULT_RETENTION_DAYS = 30;
const MIN_RETENTION_DAYS = 30;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

  // 내부(cron)만 호출 가능하게 service_role 키를 공유 시크릿으로 사용.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = (await req.json().catch(() => ({}))) as {
    dryRun?: boolean;
    retentionDays?: number;
  };
  const dryRun = body.dryRun === true;
  const retentionDays = body.retentionDays ?? DEFAULT_RETENTION_DAYS;
  if (
    !Number.isInteger(retentionDays) ||
    retentionDays < MIN_RETENTION_DAYS
  ) {
    return json(
      { error: `retentionDays must be an integer >= ${MIN_RETENTION_DAYS}` },
      400,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  if (usersError) {
    return json({ error: `users query: ${usersError.message}` }, 500);
  }

  const results: Array<{
    uid: string;
    storageFiles: number;
    comments: number;
    authDeleted: boolean;
    errors: string[];
  }> = [];

  for (const user of users ?? []) {
    const uid = user.id as string;
    const report = {
      uid,
      storageFiles: 0,
      comments: 0,
      authDeleted: false,
      errors: [] as string[],
    };

    // 1) Storage 파일 (owner = uid)
    const { data: objects, error: objErr } = await supabase
      .schema("storage")
      .from("objects")
      .select("bucket_id, name")
      .eq("owner", uid);

    if (objErr) {
      report.errors.push(`storage query: ${objErr.message}`);
    } else {
      report.storageFiles = objects?.length ?? 0;
      if (!dryRun && objects && objects.length > 0) {
        const byBucket = new Map<string, string[]>();
        for (const obj of objects) {
          const names = byBucket.get(obj.bucket_id) ?? [];
          names.push(obj.name);
          byBucket.set(obj.bucket_id, names);
        }
        for (const [bucket, names] of byBucket) {
          const { error: rmErr } = await supabase.storage
            .from(bucket)
            .remove(names);
          if (rmErr) {
            report.errors.push(`storage ${bucket}: ${rmErr.message}`);
          }
        }
      }
    }

    // 2) comments 명시 삭제 (users FK가 SET NULL이라 auth 삭제로는 안 지워짐)
    if (dryRun) {
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid);
      report.comments = count ?? 0;
    } else {
      const { error: cErr, count } = await supabase
        .from("comments")
        .delete({ count: "exact" })
        .eq("user_id", uid);
      if (cErr) {
        report.errors.push(`comments: ${cErr.message}`);
      }
      report.comments = count ?? 0;
    }

    // 3) auth 유저 삭제 → public.users CASCADE로 나머지 연쇄 삭제
    if (!dryRun) {
      const { error: aErr } = await supabase.auth.admin.deleteUser(uid);
      if (aErr) {
        report.errors.push(`auth delete: ${aErr.message}`);
      } else {
        report.authDeleted = true;
      }
    }

    results.push(report);
  }

  return json({
    dryRun,
    retentionDays,
    cutoff,
    candidates: results.length,
    results,
  });
});
