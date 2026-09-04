-- 본 글 재노출 창을 3일에서 7일로 넓힌다.
--
-- 3일치로는 재노출 대상이 20개뿐이라, 활동적인 사용자는 첫 글부터 이미 본 글이 되어
-- 피드 맨 위에 "모두 열람했습니다"가 붙는다(실기기 확인).
-- 7일로 넓히면 47개가 되어 첫 화면 20개를 채우고도 두 배 이상 남는다.
-- 14일까지 가도 51개라 4개밖에 안 늘어 7일이 적정선이다.

DROP FUNCTION IF EXISTS public.get_feed_post_ids(
  double precision, integer, integer, double precision, double precision, double precision
);

CREATE FUNCTION public.get_feed_post_ids(
  p_seed double precision,
  p_limit integer DEFAULT 20,
  p_after_band integer DEFAULT NULL,
  p_after_rank double precision DEFAULT NULL,
  p_half_life_days double precision DEFAULT 5,
  p_fresh_hours double precision DEFAULT 6,
  p_recent_days double precision DEFAULT 30,
  p_reshow_days double precision DEFAULT 7
)
RETURNS TABLE(post_id uuid, band integer, rank double precision)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  with params as (
    select
      coalesce(p_seed, 0)::double precision as seed,
      least(greatest(coalesce(p_limit, 20), 1), 100)::integer as result_limit,
      case
        when p_half_life_days > 0 and p_half_life_days <= 365
          then p_half_life_days
        else 5
      end::double precision as half_life_days,
      case
        when p_fresh_hours >= 0 and p_fresh_hours <= 168
          then p_fresh_hours
        else 6
      end::double precision as fresh_hours,
      case when p_recent_days > 0 and p_recent_days <= 3650
           then p_recent_days else 30 end::double precision as recent_days,
      case when p_reshow_days >= 0 and p_reshow_days <= 365
           then p_reshow_days else 7 end::double precision as reshow_days
  ),
  me as (
    select auth.uid() as uid
  ),
  crew as (
    select case
      when connection.requester_id = (select uid from me) then connection.receiver_id
      else connection.requester_id
    end as crew_id
    from public.user_connections connection
    where connection.status = 'accepted'
      and (
        connection.requester_id = (select uid from me)
        or connection.receiver_id = (select uid from me)
      )
  ),
  blocked as (
    select relation.blocked_id as uid
    from public.blocks relation
    where relation.blocker_id = (select uid from me)
    union
    select relation.blocker_id as uid
    from public.blocks relation
    where relation.blocked_id = (select uid from me)
  ),
  visible as (
    select
      post.id,
      post.user_id,
      post.created_at,
      post.likes_count,
      post.comments_count,
      exists (
        select 1
        from public.post_impressions impression
        where impression.user_id = (select uid from me)
          and impression.post_id = post.id
      ) as seen,
      post.user_id in (select crew_id from crew) as is_crew,
      post.created_at >= now() - make_interval(
        secs => (select fresh_hours from params) * 3600
      ) as is_fresh,
      post.created_at >= now() - make_interval(
        secs => (select recent_days from params) * 86400
      ) as is_recent,
      post.created_at >= now() - make_interval(
        secs => (select reshow_days from params) * 86400
      ) as is_reshowable
    from public.posts post
    where post.deleted_at is null
      and post.user_id not in (select uid from blocked)
      and post.user_id <> (select uid from me)
  ),
  ranked as (
    select
      visible_post.id as post_id,
      case
        when not visible_post.seen and visible_post.is_crew then 0
        when not visible_post.seen and visible_post.is_fresh then 1
        when not visible_post.seen and visible_post.is_recent then 2
        when visible_post.seen and visible_post.is_reshowable then 3
        else 4
      end as band,
      case
        when not visible_post.seen
             and (visible_post.is_crew or visible_post.is_fresh)
          then extract(epoch from visible_post.created_at)
        when not visible_post.seen and visible_post.is_recent then
          (1 + visible_post.likes_count + 2 * visible_post.comments_count)::double precision
          * power(
              0.5,
              (extract(epoch from (now() - visible_post.created_at)) / 86400.0)
              / (select half_life_days from params)
            )
        else (
          ('x' || substr(
            md5(visible_post.id::text || (select seed from params)::text),
            1,
            8
          ))::bit(32)::bigint
        )::double precision
      end as rank
    from visible visible_post
  )
  select ranked_post.post_id, ranked_post.band, ranked_post.rank
  from ranked ranked_post
  where p_after_band is null
     or ranked_post.band > p_after_band
     or (ranked_post.band = p_after_band and ranked_post.rank < p_after_rank)
  order by ranked_post.band asc, ranked_post.rank desc
  limit (select result_limit from params);
$function$;

-- DROP으로 사라진 실행 권한 복원(SECURITY INVOKER라 posts RLS가 그대로 적용된다).
GRANT EXECUTE ON FUNCTION public.get_feed_post_ids(
  double precision, integer, integer, double precision,
  double precision, double precision, double precision, double precision
) TO anon, authenticated;
