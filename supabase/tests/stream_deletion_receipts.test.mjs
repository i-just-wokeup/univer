// Isolated PostgreSQL (PGlite) fixture; never connects to production.
// PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node supabase/tests/stream_deletion_receipts.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const warnings = [];
const db = new PGlite();
const sql = (query) => db.exec(query, { onNotice: (notice) => warnings.push(notice.message) });
const rows = async (query) => (await db.query(query)).rows;
const scalar = async (query) => Object.values((await rows(query))[0])[0];
const file = (name) => readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8');
const owner = '10000000-0000-0000-0000-000000000001';
const admin = '10000000-0000-0000-0000-000000000002';
const post = '20000000-0000-0000-0000-000000000001';
const media = '30000000-0000-0000-0000-000000000001';
const story = '40000000-0000-0000-0000-000000000001';
await sql(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  CREATE TABLE public.users(id uuid PRIMARY KEY, role text DEFAULT 'user', deleted_at timestamptz,
    is_active boolean DEFAULT true, fcm_token text);
  CREATE TABLE public.posts(id uuid PRIMARY KEY, user_id uuid REFERENCES public.users ON DELETE CASCADE,
    deleted_at timestamptz);
  CREATE TABLE public.post_media(id uuid PRIMARY KEY, post_id uuid REFERENCES public.posts ON DELETE CASCADE,
    provider text, provider_asset_id text);
  CREATE TABLE public.stories(id uuid PRIMARY KEY, user_id uuid REFERENCES public.users ON DELETE CASCADE,
    provider text, provider_asset_id text, deleted_at timestamptz, expires_at timestamptz);
  CREATE TABLE public.comments(id uuid, user_id uuid, post_id uuid);
  CREATE TABLE public.messages(sender_id uuid, deleted_at timestamptz);
  CREATE TABLE public.close_friends(user_id uuid, friend_id uuid);
  CREATE TABLE public.blocks(blocker_id uuid, blocked_id uuid);
  CREATE TABLE public.user_favorites(user_id uuid, favorite_user_id uuid);
  CREATE TABLE public.reports(id uuid, target_type text, target_id uuid, status text);
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.users TO authenticated;
`);
for (const name of ['notifications', 'bookmarks', 'story_views', 'comment_likes', 'post_likes']) {
  await sql(`CREATE TABLE public.${name}(user_id uuid)`);
}
await sql(`INSERT INTO public.users(id,role) VALUES ('${owner}','user'), ('${admin}','admin');
  INSERT INTO public.posts VALUES ('${post}','${owner}',now()-interval '3 days');
  INSERT INTO public.post_media VALUES ('${media}','${post}','cloudflare_stream','video-a');
  INSERT INTO public.stories VALUES ('${story}','${owner}','cloudflare_stream','video-s',now()-interval '2 days',now());`);
await sql(await file('20260916074702_stream_deletion_receipts.sql'));
await sql(await file('20260706140000_fix_delete_account_comments_hard_delete.sql'));
await sql(await file('20260916120000_fix_restore_account_comments.sql'));
const reportSql = await file('20260706120000_admin_reports_comment_support.sql');
await sql(reportSql.slice(reportSql.indexOf('CREATE OR REPLACE FUNCTION public.handle_admin_report')));
assert.equal(await scalar('SELECT count(*)::int FROM public.stream_deletion_receipts'), 2);
assert.equal(await scalar('SELECT bool_and(source_deleted_at < recorded_at AND eligible_after IS NULL) FROM public.stream_deletion_receipts'), true);
await sql(`UPDATE public.posts SET deleted_at=NULL; UPDATE public.stories SET deleted_at=NULL;`);
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE status='cancelled'"), 2);
await sql(`SELECT set_config('request.jwt.claim.sub','${owner}',false); SELECT public.delete_account();`);
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE status='pending' AND generation=2"), 2);
await sql('SELECT public.restore_account()');
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE status='pending'"), 0);
for (const [kind, id] of [['post', post], ['story', story]]) {
  await sql(`INSERT INTO public.reports VALUES (gen_random_uuid(),'${kind}','${id}','pending');
    SELECT set_config('request.jwt.claim.sub','${admin}',false);
    SELECT public.handle_admin_report(id,'delete') FROM public.reports WHERE target_id='${id}';`);
  assert.equal(await scalar(`SELECT count(*)::int FROM public.stream_deletion_receipts WHERE status='pending' AND generation=3 AND ${kind === 'post' ? 'post_id' : 'source_id'}='${id}'`), 1);
  await sql(`SELECT public.handle_admin_report(id,'restore') FROM public.reports WHERE target_id='${id}'`);
}
await sql(`UPDATE public.post_media SET provider_asset_id='video-b' WHERE id='${media}';
  UPDATE public.post_media SET provider_asset_id=NULL WHERE id='${media}';`);
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE reason='reference_changed' AND status='pending'"), 2);
await sql(`UPDATE public.post_media SET provider_asset_id='video-a' WHERE id='${media}'`);
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE provider_asset_id='video-a' AND status='pending'"), 0);
await sql(`UPDATE public.posts SET deleted_at=now();
  INSERT INTO public.post_media VALUES ('30000000-0000-0000-0000-000000000002','${post}','cloudflare_stream','video-a');`);
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE provider_asset_id='video-a' AND status='pending'"), 2);
const beforeExpiry = await scalar('SELECT count(*)::int FROM public.stream_deletion_receipts');
await sql("UPDATE public.stories SET expires_at=now()-interval '10 days'");
assert.equal(await scalar('SELECT count(*)::int FROM public.stream_deletion_receipts'), beforeExpiry);
await sql(`DELETE FROM public.users WHERE id='${owner}'`);
assert.equal(await scalar('SELECT count(*)::int FROM public.post_media'), 0);
assert.equal(await scalar("SELECT bool_and(hard_deleted_at IS NOT NULL) FROM public.stream_deletion_receipts WHERE status='pending'"), true);
// CASCADE without prior soft delete: parent is gone; OLD is sufficient.
await sql(`INSERT INTO public.posts VALUES ('${post}','${admin}',NULL);
  INSERT INTO public.post_media VALUES ('${media}','${post}','cloudflare_stream','video-c');
  DELETE FROM public.posts WHERE id='${post}';`);
assert.equal(await scalar("SELECT count(*)::int FROM public.stream_deletion_receipts WHERE provider_asset_id='video-c' AND owner_id IS NULL AND hard_deleted_at IS NOT NULL"), 1);
// Real insertion failure: receipt subtransaction rolls back but source DELETE succeeds.
await sql(`CREATE FUNCTION public.fail_receipt_test() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN RAISE EXCEPTION 'injected receipt failure'; END; $$;
  CREATE TRIGGER fail_receipt_test BEFORE INSERT ON public.stream_deletion_receipts
    FOR EACH ROW EXECUTE FUNCTION public.fail_receipt_test();
  INSERT INTO public.stories VALUES ('${story}','${admin}','cloudflare_stream','fail-delete',NULL,now());
  DELETE FROM public.stories WHERE id='${story}';`);
assert.equal(await scalar('SELECT count(*)::int FROM public.stories'), 0);
assert(warnings.some((message) => message?.includes('stream_receipt_failed')));
await sql(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${admin}',false)`);
assert((await scalar('SELECT count(*)::int FROM public.stream_deletion_receipts')) > 0);
await sql(`SELECT set_config('request.jwt.claim.sub','${owner}',false)`);
assert.equal(await scalar('SELECT count(*)::int FROM public.stream_deletion_receipts'), 0);
for (const query of ['DELETE FROM public.stream_deletion_receipts',
  `SELECT public.record_stream_deletion_observation('stories','${story}','cloudflare_stream','arbitrary',NULL,NULL,NULL,'content_soft_delete')`]) {
  await assert.rejects(() => sql(query), /permission denied/);
}
await sql('RESET ROLE; SET ROLE anon');
await assert.rejects(() => sql('SELECT * FROM public.stream_deletion_receipts'), /permission denied/);
await sql('RESET ROLE');
assert.equal(await scalar("SELECT count(*)::int FROM pg_constraint WHERE conrelid='public.stream_deletion_receipts'::regclass AND contype='f'"), 0);
console.log('PASS: backfill, timestamps, account/admin restore, generations, UID replacement/null/reattach, late attachment, shared UID, expiry exclusion, CASCADE, fail-open warning, RLS and helper ACL.');
await db.close();
