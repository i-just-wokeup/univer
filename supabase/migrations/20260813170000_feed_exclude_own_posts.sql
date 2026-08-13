-- 홈피드에서 내 글 제외.
-- 기존 get_feed_post_ids는 삭제글·차단유저만 제외해서, 내가 올린 글이
-- "전교생 안 본 글(band 1)"로 분류돼 핫스코어를 타고 계속 노출되던 문제 수정.
-- visible CTE에 p.user_id <> auth.uid() 조건 추가(인스타식: 홈피드에 내 글 안 띄움).
-- SECURITY INVOKER 유지(posts RLS=같은 학교+공개범위 자동 적용).

create or replace function public.get_feed_post_ids(
  p_seed double precision,
  p_limit integer default 20,
  p_after_band integer default null,
  p_after_rank double precision default null,
  p_half_life_days double precision default 5
)
returns table(post_id uuid, band integer, rank double precision)
language sql
stable
set search_path to 'public'
as $function$
  with me as (
    select auth.uid() as uid
  ),
  crew as (
    select case when uc.requester_id = (select uid from me)
                then uc.receiver_id else uc.requester_id end as crew_id
    from user_connections uc
    where uc.status = 'accepted'
      and (uc.requester_id = (select uid from me) or uc.receiver_id = (select uid from me))
  ),
  blocked as (
    select blocked_id as uid from blocks where blocker_id = (select uid from me)
    union
    select blocker_id as uid from blocks where blocked_id = (select uid from me)
  ),
  visible as (
    select p.id, p.user_id, p.created_at, p.likes_count, p.comments_count,
           exists (select 1 from post_impressions pi
                   where pi.user_id = (select uid from me) and pi.post_id = p.id) as seen,
           (p.user_id in (select crew_id from crew)) as is_crew
    from posts p
    where p.deleted_at is null
      and p.user_id not in (select uid from blocked)
      and p.user_id <> (select uid from me)
  ),
  ranked as (
    select v.id as post_id,
      case
        when not v.seen and v.is_crew then 0
        when not v.seen               then 1
        else 2
      end as band,
      case
        when not v.seen and v.is_crew then extract(epoch from v.created_at)
        when not v.seen then
          (1 + v.likes_count + 2 * v.comments_count)::double precision
          * power(
              0.5,
              (extract(epoch from (now() - v.created_at)) / 86400.0) / p_half_life_days
            )
        else (('x' || substr(md5(v.id::text || p_seed::text), 1, 8))::bit(32)::bigint)::double precision
      end as rank
    from visible v
  )
  select r.post_id, r.band, r.rank
  from ranked r
  where p_after_band is null
     or r.band > p_after_band
     or (r.band = p_after_band and r.rank < p_after_rank)
  order by r.band asc, r.rank desc
  limit p_limit;
$function$;
