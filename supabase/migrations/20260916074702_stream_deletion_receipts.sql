-- Observation only: no HTTP, executor, cron or Cloudflare deletion.
-- Covers app/web/admin/account soft deletion, restore, cascade DELETE and UID/provider changes.
-- Cannot cover uploads without DB rows, TRUNCATE or disabled triggers. Fail-open can lose receipts.
CREATE TABLE public.stream_deletion_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider = 'cloudflare_stream'),
  provider_account_id text,
  provider_asset_id text NOT NULL CHECK (length(btrim(provider_asset_id)) > 0),
  source_table text NOT NULL CHECK (source_table IN ('post_media', 'stories')),
  source_id uuid NOT NULL,
  post_id uuid,
  owner_id uuid,
  generation integer NOT NULL CHECK (generation > 0),
  reason text NOT NULL CHECK (reason IN ('content_soft_delete', 'source_hard_delete', 'reference_changed')),
  source_deleted_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  hard_deleted_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'held')),
  cancelled_at timestamptz,
  hold_reason text,
  last_checked_at timestamptz,
  -- 의도: 계정 탈퇴의 30일을 개별 콘텐츠에 적용하지 않는다. NULL은 실행 불가다.
  eligible_after timestamptz DEFAULT NULL CHECK (eligible_after IS NULL),
  policy_version text NOT NULL DEFAULT 'observation-v1',
  UNIQUE (source_table, source_id, generation),
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL)),
  CHECK (status <> 'held' OR hold_reason IS NOT NULL)
);
-- 의도: 원본/사용자 FK 없음. CASCADE 후에도 최소 식별자만 보존한다.
CREATE UNIQUE INDEX stream_receipts_active_source_asset
  ON public.stream_deletion_receipts (source_table, source_id, provider, provider_asset_id)
  WHERE status IN ('pending', 'held');
CREATE INDEX stream_receipts_status_recorded
  ON public.stream_deletion_receipts (status, recorded_at);
ALTER TABLE public.stream_deletion_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stream_deletion_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.stream_deletion_receipts TO authenticated;
CREATE POLICY stream_receipts_admin_read ON public.stream_deletion_receipts
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin' AND u.deleted_at IS NULL AND u.is_active
  ));
COMMENT ON TABLE public.stream_deletion_receipts IS
  'Observation only. No executor. Unknown provider account remains NULL. Cancelled receipts: retain 90 days after cancellation; unresolved: review every 90 days, do not discard sole deletion evidence. Manual retention review only; no cleanup job.';

-- Private-in-practice helper: EXECUTE revoked below, never a client enqueue API.
CREATE OR REPLACE FUNCTION public.record_stream_deletion_observation(
  p_source text, p_id uuid, p_provider text, p_uid text,
  p_post uuid, p_owner uuid, p_deleted timestamptz, p_action text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_generation integer;
BEGIN
  -- Only receipt bookkeeping is isolated, never the original source mutation.
  BEGIN
    -- 의도: 같은 원본의 generation을 직렬화하되 관찰 때문에 잠금 대기하지 않는다.
    IF NOT pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended(
      'stream_receipt:' || p_source || ':' || p_id::text, 0)) THEN
      RAISE EXCEPTION USING ERRCODE = '55P03', MESSAGE = 'receipt lock busy';
    END IF;
    IF p_action = 'source_hard_delete' THEN
      UPDATE public.stream_deletion_receipts
      SET hard_deleted_at = coalesce(hard_deleted_at, now())
      WHERE source_table = p_source AND source_id = p_id AND status IN ('pending', 'held');
    END IF;
    IF p_provider IS DISTINCT FROM 'cloudflare_stream' OR nullif(btrim(p_uid), '') IS NULL THEN
      RETURN;
    END IF;
    IF p_action = 'restore' THEN
      -- Only a currently restored reference cancels its episode; detached old UIDs stay pending.
      UPDATE public.stream_deletion_receipts SET status = 'cancelled', cancelled_at = now(),
        eligible_after = NULL, hold_reason = NULL, last_checked_at = now()
      WHERE source_table = p_source AND source_id = p_id
        AND provider = p_provider AND provider_asset_id = p_uid
        AND status IN ('pending', 'held') AND hard_deleted_at IS NULL;
      RETURN;
    END IF;
    UPDATE public.stream_deletion_receipts
    SET source_deleted_at = coalesce(source_deleted_at, p_deleted),
        owner_id = coalesce(owner_id, p_owner), post_id = coalesce(post_id, p_post)
    WHERE source_table = p_source AND source_id = p_id
      AND provider = p_provider AND provider_asset_id = p_uid AND status IN ('pending', 'held');
    IF FOUND THEN RETURN; END IF;
    SELECT coalesce(max(generation), 0) + 1 INTO v_generation
      FROM public.stream_deletion_receipts WHERE source_table = p_source AND source_id = p_id;
    INSERT INTO public.stream_deletion_receipts (
      provider, provider_asset_id, source_table, source_id, post_id, owner_id,
      generation, reason, source_deleted_at, hard_deleted_at
    ) VALUES (
      p_provider, p_uid, p_source, p_id, p_post, p_owner, v_generation, p_action,
      p_deleted, CASE WHEN p_action = 'source_hard_delete' THEN now() END
    );
  EXCEPTION WHEN OTHERS THEN
    -- No SQLERRM: constraint details could leak source payloads into logs.
    RAISE WARNING 'stream_receipt_failed source=% id=% action=% sqlstate=%',
      p_source, p_id, p_action, SQLSTATE;
  END;
END;
$$;
REVOKE ALL ON FUNCTION public.record_stream_deletion_observation(text,uuid,text,text,uuid,uuid,timestamptz,text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.observe_stream_post_deletion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE m record;
BEGIN
  BEGIN
    IF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN
      FOR m IN SELECT id, provider, provider_asset_id FROM public.post_media WHERE post_id = NEW.id LOOP
        PERFORM public.record_stream_deletion_observation('post_media', m.id, m.provider,
          m.provider_asset_id, NEW.id, NEW.user_id, NEW.deleted_at,
          CASE WHEN NEW.deleted_at IS NULL THEN 'restore' ELSE 'content_soft_delete' END);
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'stream_receipt_failed source=posts id=% action=% sqlstate=%', NEW.id, TG_OP, SQLSTATE;
  END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.observe_stream_post_deletion() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER stream_receipts_post_state AFTER UPDATE OF deleted_at ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.observe_stream_post_deletion();

CREATE OR REPLACE FUNCTION public.observe_stream_media_reference()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_owner uuid;
  v_post uuid;
  v_deleted timestamptz;
BEGIN
  BEGIN
    IF TG_OP <> 'INSERT' THEN
      v_old := to_jsonb(OLD);
      IF TG_OP = 'DELETE' THEN
        -- 의도: CASCADE 중 부모 재조회 금지. post_media에는 owner가 없으므로 NULL 허용.
        PERFORM public.record_stream_deletion_observation(TG_TABLE_NAME, OLD.id,
          v_old->>'provider', v_old->>'provider_asset_id', (v_old->>'post_id')::uuid,
          (v_old->>'user_id')::uuid, (v_old->>'deleted_at')::timestamptz, 'source_hard_delete');
        RETURN OLD;
      END IF;
    END IF;
    v_new := to_jsonb(NEW);
    IF TG_OP = 'UPDATE' AND (
      v_old->>'provider' IS DISTINCT FROM v_new->>'provider' OR
      v_old->>'provider_asset_id' IS DISTINCT FROM v_new->>'provider_asset_id'
    ) THEN
      PERFORM public.record_stream_deletion_observation(TG_TABLE_NAME, OLD.id,
        v_old->>'provider', v_old->>'provider_asset_id', (v_old->>'post_id')::uuid,
        (v_old->>'user_id')::uuid, (v_old->>'deleted_at')::timestamptz, 'reference_changed');
    END IF;
    IF TG_TABLE_NAME = 'post_media' THEN
      v_post := (v_new->>'post_id')::uuid;
      -- Late attachment to a deleted post is observable too. Serialize with its state change.
      SELECT user_id, deleted_at INTO v_owner, v_deleted FROM public.posts WHERE id = v_post FOR SHARE;
    ELSE
      v_owner := (v_new->>'user_id')::uuid;
      v_deleted := (v_new->>'deleted_at')::timestamptz;
    END IF;
    PERFORM public.record_stream_deletion_observation(TG_TABLE_NAME, NEW.id,
      v_new->>'provider', v_new->>'provider_asset_id', v_post, v_owner, v_deleted,
      CASE WHEN v_deleted IS NULL THEN 'restore' ELSE 'content_soft_delete' END);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'stream_receipt_failed source=% id=% action=% sqlstate=%',
      TG_TABLE_NAME, coalesce(v_new->>'id', v_old->>'id'), TG_OP, SQLSTATE;
  END;
  -- BEFORE DELETE must not suppress deletion even after a bookkeeping error.
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.observe_stream_media_reference() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER stream_receipts_media_delete BEFORE DELETE ON public.post_media
  FOR EACH ROW EXECUTE FUNCTION public.observe_stream_media_reference();
CREATE TRIGGER stream_receipts_media_state AFTER INSERT OR UPDATE OF provider, provider_asset_id, post_id ON public.post_media
  FOR EACH ROW EXECUTE FUNCTION public.observe_stream_media_reference();
CREATE TRIGGER stream_receipts_story_delete BEFORE DELETE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.observe_stream_media_reference();
CREATE TRIGGER stream_receipts_story_state AFTER INSERT OR UPDATE OF provider, provider_asset_id, deleted_at ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.observe_stream_media_reference();

-- Backfill uses the original deletion time, not the observation timestamp.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'post_media'::text AS source_table, m.id, m.provider, m.provider_asset_id,
      p.id AS post_id, p.user_id, p.deleted_at
    FROM public.post_media m JOIN public.posts p ON p.id = m.post_id
    WHERE p.deleted_at IS NOT NULL AND m.provider = 'cloudflare_stream' AND m.provider_asset_id IS NOT NULL
    UNION ALL
    SELECT 'stories', s.id, s.provider, s.provider_asset_id, NULL::uuid, s.user_id, s.deleted_at
    FROM public.stories s WHERE s.deleted_at IS NOT NULL
      AND s.provider = 'cloudflare_stream' AND s.provider_asset_id IS NOT NULL
  LOOP
    PERFORM public.record_stream_deletion_observation(r.source_table, r.id, r.provider,
      r.provider_asset_id, r.post_id, r.user_id, r.deleted_at, 'content_soft_delete');
  END LOOP;
END;
$$;
