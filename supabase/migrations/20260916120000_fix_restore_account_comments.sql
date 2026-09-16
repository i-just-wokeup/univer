-- 계정 복구가 항상 실패하던 문제 수정.
--
-- 증상: restore_account() 를 부르면 아무것도 복구되지 않고 오류만 난다.
--
-- 원인: 함수가 `UPDATE public.comments SET deleted_at = NULL` 을 실행하는데
--       comments 테이블에는 deleted_at 칸이 아예 없다
--       (칸: id, user_id, post_id, parent_id, content, created_at, likes_count).
--       PostgreSQL 은 함수를 만들 때 본문을 검사하지 않고 실행할 때 검사하므로
--       생성 시에는 아무 경고 없이 만들어졌다.
--       다섯 UPDATE 가 한 트랜잭션이라 여기서 터지면 앞서 성공한
--       posts·stories 복구까지 전부 롤백된다. 결과적으로 복구가 0건이 된다.
--
-- 왜 댓글은 복구 대상이 아닌가: delete_account() 는 댓글을 표시만 하는 게 아니라
--       `DELETE FROM public.comments` 로 완전히 지운다. 되돌릴 행 자체가 없다.
--       따라서 이 블록을 빼는 것은 동작 변경이 아니라 잘못 들어간 문장의 제거다.
--
-- 나머지 UPDATE 는 정상이다. posts·stories·messages·users 에는 deleted_at 이 있고
-- (public 스키마에서 deleted_at 을 가진 테이블은 이 넷뿐), messages 의 sender_id 도 존재한다.
--
-- 의도: `AND deleted_at = v_deleted_at` 는 이번 탈퇴로 지워진 것만 되살리기 위한 조건이다.
-- 사용자가 예전에 직접 지운 글은 deleted_at 이 달라 복구되지 않는다.
-- delete_account() 쪽도 `AND deleted_at IS NULL` 로 이미 지워진 것을 건드리지 않아 짝이 맞는다.
--
-- 시그니처가 그대로라 CREATE OR REPLACE 를 쓴다. DROP 하지 않으므로
-- authenticated 실행 권한이 사라지지 않는다(2026-09-03 DROP 후 권한 복원 전례).
--
-- ⚠️ 이 수정만으로는 사용자가 복구를 할 수 없다. restore_account 를 호출하는 화면이
--    앱·웹 어디에도 없고, 탈퇴 계정은 로그인 직후 세션 프로바이더가 로그아웃시킨다
--    (apps/mobile/src/lib/session.tsx:236). 복구 화면 연결은 별도 작업이다.
--
-- search_path 는 기존 값(public)을 그대로 둔다. 본문이 이미 public. 접두사를 쓰고 있어
-- 동작에 영향이 없고, 이번 변경 범위를 버그 수정으로만 한정하기 위함이다.

CREATE OR REPLACE FUNCTION public.restore_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- 의도: comments 는 복구하지 않는다. delete_account() 가 완전 삭제하므로 되돌릴 행이 없다.
  -- 여기에 UPDATE public.comments 를 다시 넣지 말 것 — 그 칸이 없어 함수 전체가 실패한다.

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
$function$;
