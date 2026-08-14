-- 현재 원격 comments는 댓글 삭제를 hard delete로 처리해 deleted_at 컬럼이 없다.
-- 관리자 댓글 조회 함수가 실제 원격 스키마와 생성 타입을 따르도록 보정한다.

create or replace function public.get_post_comments_for_admin(p_post_id uuid)
returns table (
  comment_id uuid,
  user_id uuid,
  parent_id uuid,
  nickname text,
  avatar_url text,
  content text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.is_active = true
      and admin_user.deleted_at is null
  ) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if p_post_id is null or not exists (
    select 1
    from public.posts post
    where post.id = p_post_id
      and post.deleted_at is null
  ) then
    raise exception '게시물을 찾을 수 없습니다.';
  end if;

  return query
  select
    comment.id as comment_id,
    comment.user_id,
    comment.parent_id,
    coalesce(comment_user.nickname, '탈퇴한 사용자') as nickname,
    comment_user.avatar_url,
    comment.content,
    comment.created_at
  from public.comments comment
  left join public.users comment_user on comment_user.id = comment.user_id
  where comment.post_id = p_post_id
  order by comment.created_at;
end;
$function$;

revoke all on function public.get_post_comments_for_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.get_post_comments_for_admin(uuid)
  to authenticated;
