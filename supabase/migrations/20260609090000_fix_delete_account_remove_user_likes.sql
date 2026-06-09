-- ============================================================
-- Fix delete_account: remove deleted user_likes table reference
-- ============================================================
-- user_likes 테이블은 2026-06-05 보안 패치에서 삭제됐으나
-- delete_account() 함수에 참조가 남아 탈퇴 시 오류 발생하던 버그 수정.
-- follows 테이블은 팔로우 기능 구현 시 별도 추가 예정.

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

  DELETE FROM public.notifications WHERE user_id = v_uid;
  DELETE FROM public.bookmarks WHERE user_id = v_uid;
  DELETE FROM public.story_views WHERE user_id = v_uid;
  DELETE FROM public.close_friends WHERE user_id = v_uid OR friend_id = v_uid;
  DELETE FROM public.blocks WHERE blocker_id = v_uid OR blocked_id = v_uid;
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
