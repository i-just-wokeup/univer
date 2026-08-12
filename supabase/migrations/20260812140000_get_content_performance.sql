-- 승격(크리에이터) 인사이트 A — 콘텐츠 성과.
-- 본인 게시물별 좋아요·댓글·저장(bookmarks)·공유(DM shared + 스토리 리셰어) 집계.
-- 좋아요/댓글은 유지되는 카운터 컬럼 사용, 저장/공유는 출처 테이블에서 count.
-- SECURITY DEFINER + 본인 글만(user_id = auth.uid()). authenticated만 실행.

create or replace function public.get_content_performance()
returns table(
  post_id uuid,
  created_at timestamptz,
  thumbnail_url text,
  is_video boolean,
  likes integer,
  comments integer,
  saves integer,
  shares integer
)
language sql stable security definer set search_path to 'public'
as $function$
  select
    p.id,
    p.created_at,
    (select coalesce(pm.thumbnail_url, pm.url)
       from post_media pm where pm.post_id = p.id order by pm.order_index limit 1) as thumbnail_url,
    exists(select 1 from post_media pm where pm.post_id = p.id and pm.type = 'video') as is_video,
    p.likes_count,
    p.comments_count,
    (select count(*) from bookmarks b where b.post_id = p.id)::int as saves,
    ( (select count(*) from messages m where m.shared_post_id = p.id and m.deleted_at is null)
    + (select count(*) from stories  s where s.shared_post_id = p.id and s.deleted_at is null) )::int as shares
  from posts p
  where p.user_id = auth.uid()
    and p.deleted_at is null
  order by p.created_at desc;
$function$;

revoke all on function public.get_content_performance() from public, anon;
grant execute on function public.get_content_performance() to authenticated;
