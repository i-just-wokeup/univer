-- 본 글 재노출 밴드(3)를 핫스코어에서 seed 셔플로 바꾼다.
--
-- 문제: 새로고침해도 화면이 그대로라 "반응이 없네" 싶다. seed는 매 새로고침마다
--       새로 생성되는데(useHomeFeedPagination.handleRefresh), 정작 seed를 쓰는
--       밴드가 4(한 달 넘은 글)뿐이라 화면에 안 나온다. 나머지 밴드는 최신순·
--       핫스코어라 새 글이 올라오지 않는 한 순서가 고정된다.
--
-- 해결: 이미 본 글은 순서에 의미가 없으므로 밴드 3도 셔플로 바꾼다.
--       같은 글이라도 배치가 달라져 새로고침에 반응이 생긴다.
--       확인: seed 0.7 -> 0.2 로 바꾸면 8개 중 7개가 자리를 옮긴다.
--
-- 셔플은 콘텐츠가 적을 때의 임시방편이다. 게시물이 늘면 밴드 3까지
-- 내려갈 일이 없어져 저절로 안 쓰이게 된다.

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
  p_reshow_days double precision DEFAULT 3
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
           then p_reshow_days else 3 end::double precision as reshow_days
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
