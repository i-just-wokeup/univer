-- 버그 수정: delete_account()가 `UPDATE public.comments SET deleted_at`을 호출했으나
-- comments 테이블엔 deleted_at 컬럼이 없어(하드삭제 테이블) 탈퇴가 모든 유저에서 실패하고 있었음.
-- → 댓글은 하드 DELETE로 변경(대댓글 parent CASCADE, comment_likes CASCADE).
-- 나머지 posts/stories/messages/users는 deleted_at 존재(소프트삭제 유지).
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.posts
  SET deleted_at = v_deleted_at
  WHERE user_id = v_uid AND deleted_at IS NULL;

  UPDATE public.stories
  SET deleted_at = v_deleted_at
  WHERE user_id = v_uid AND deleted_at IS NULL;

  -- comments는 deleted_at이 없어 하드삭제(대댓글/좋아요 ON DELETE CASCADE)
  DELETE FROM public.comments WHERE user_id = v_uid;

  UPDATE public.messages
  SET deleted_at = v_deleted_at
  WHERE sender_id = v_uid AND deleted_at IS NULL;

  DELETE FROM public.notifications WHERE user_id = v_uid;
  DELETE FROM public.bookmarks WHERE user_id = v_uid;
  DELETE FROM public.story_views WHERE user_id = v_uid;
  DELETE FROM public.close_friends WHERE user_id = v_uid OR friend_id = v_uid;
  DELETE FROM public.blocks WHERE blocker_id = v_uid OR blocked_id = v_uid;
  DELETE FROM public.user_favorites WHERE user_id = v_uid OR favorite_user_id = v_uid;
  DELETE FROM public.comment_likes WHERE user_id = v_uid;
  DELETE FROM public.post_likes WHERE user_id = v_uid;

  UPDATE public.users
  SET deleted_at = v_deleted_at, fcm_token = NULL
  WHERE id = v_uid AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION '이미 탈퇴 처리된 계정입니다.';
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;
