-- ============================================================
-- Account deletion/restore soft delete policy
-- ============================================================
-- 탈퇴 시 작성 콘텐츠를 hard delete하지 않고 deleted_at으로 숨긴다.
-- 30일 내 복구 시 탈퇴 처리 시각과 같은 deleted_at을 가진 콘텐츠만 되돌린다.

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.posts
  SET deleted_at = v_deleted_at
  WHERE user_id = v_uid
    AND deleted_at IS NULL;

  UPDATE public.stories
  SET deleted_at = v_deleted_at
  WHERE user_id = v_uid
    AND deleted_at IS NULL;

  UPDATE public.comments
  SET deleted_at = v_deleted_at
  WHERE user_id = v_uid
    AND deleted_at IS NULL;

  UPDATE public.messages
  SET deleted_at = v_deleted_at
  WHERE sender_id = v_uid
    AND deleted_at IS NULL;

  -- 복구해도 의미가 작거나 개인 상태에 가까운 데이터는 즉시 정리한다.
  DELETE FROM public.notifications WHERE user_id = v_uid;
  DELETE FROM public.bookmarks WHERE user_id = v_uid;
  DELETE FROM public.story_views WHERE user_id = v_uid;
  DELETE FROM public.close_friends WHERE user_id = v_uid OR friend_id = v_uid;
  DELETE FROM public.blocks WHERE blocker_id = v_uid OR blocked_id = v_uid;
  DELETE FROM public.user_likes WHERE from_user_id = v_uid OR to_user_id = v_uid;
  DELETE FROM public.comment_likes WHERE user_id = v_uid;
  DELETE FROM public.post_likes WHERE user_id = v_uid;

  UPDATE public.users
  SET
    deleted_at = v_deleted_at,
    fcm_token = NULL
  WHERE id = v_uid
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION '이미 탈퇴 처리된 계정입니다.';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT deleted_at
  INTO v_deleted_at
  FROM public.users
  WHERE id = v_uid;

  IF v_deleted_at IS NULL OR v_deleted_at <= now() - interval '30 days' THEN
    RAISE EXCEPTION '복구 가능한 계정이 없거나 30일이 지났습니다.';
  END IF;

  UPDATE public.posts
  SET deleted_at = NULL
  WHERE user_id = v_uid
    AND deleted_at = v_deleted_at;

  UPDATE public.stories
  SET deleted_at = NULL
  WHERE user_id = v_uid
    AND deleted_at = v_deleted_at;

  UPDATE public.comments
  SET deleted_at = NULL
  WHERE user_id = v_uid
    AND deleted_at = v_deleted_at;

  UPDATE public.messages
  SET deleted_at = NULL
  WHERE sender_id = v_uid
    AND deleted_at = v_deleted_at;

  UPDATE public.users
  SET deleted_at = NULL
  WHERE id = v_uid
    AND deleted_at = v_deleted_at;

  RETURN json_build_object('success', true);
END;
$$;
