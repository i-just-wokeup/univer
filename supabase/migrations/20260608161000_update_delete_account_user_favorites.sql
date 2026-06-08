-- ============================================================
-- Clean user favorites on account deletion
-- ============================================================

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
  DELETE FROM public.user_favorites WHERE user_id = v_uid OR favorite_user_id = v_uid;
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
