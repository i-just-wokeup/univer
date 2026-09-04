-- 홈피드에 "신규 글" 밴드를 신설한다.
--
-- 문제: 전교생 밴드가 (1 + 좋아요 + 댓글×2) × 0.5^(경과일/반감기) 로만 정렬돼,
--       좋아요 하나가 점수를 배로 만드는 반면 시간은 5일이 지나야 절반이 된다.
--       새 글은 좋아요가 0이라 항상 아래에 깔리고 → 아무도 못 보고 → 반응도 못 받는
--       악순환이 생긴다. 실측: 5시간 전 글(좋아요 2)=2.907 vs 1시간 전 글(좋아요 1)=1.987.
--
-- 해결: 최근 p_fresh_hours 이내의 안 본 글을 점수 경쟁에서 빼내 별도 밴드로 올린다.
--
--   0: 안 본 크루 글        최신순      (기존)
--   1: 안 본 + 최근 N시간   최신순      (신설)
--   2: 안 본 그 외          핫스코어    (기존 band 1)
--   3: 이미 본 글           seed 셔플   (기존 band 2)
--
-- 인자를 추가하면 같은 이름 함수가 둘이 되어 PostgREST가 어느 쪽을 부를지 헷갈리므로
-- 기존 함수를 DROP한 뒤 새로 만든다(2026-08-12에 같은 이유로 4인자 버전을 제거한 전례).
-- 앱 수정은 불필요하다. 클라이언트는 band 값을 받아 커서로 되돌려줄 뿐 숫자를 판단하지 않는다.

DROP FUNCTION IF EXISTS public.get_feed_post_ids(
  double precision, integer, integer, double precision, double precision
);

CREATE FUNCTION public.get_feed_post_ids(
  p_seed double precision,
  p_limit integer DEFAULT 20,
  p_after_band integer DEFAULT NULL,
  p_after_rank double precision DEFAULT NULL,
  p_half_life_days double precision DEFAULT 5,
  p_fresh_hours double precision DEFAULT 6
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
      end::double precision as fresh_hours
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
      ) as is_fresh
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
        when not visible_post.seen then 2
        else 3
      end as band,
      case
        when not visible_post.seen
             and (visible_post.is_crew or visible_post.is_fresh)
          then extract(epoch from visible_post.created_at)
        when not visible_post.seen then
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
  double precision, integer, integer, double precision, double precision, double precision
) TO anon, authenticated;
