-- 팔로우한 계정의 글을 크루와 같은 밴드 0에 합치고, 한 사람이 상단을 도배하지 못하게 막는다.
--
-- 배경: 승격 계정만 팔로우를 받을 수 있는데(20260827), 팔로우해도 그 사람 글이
-- 피드에서 위로 오지 않아 크리에이터가 팔로워를 모을 이유가 없었다.
--
-- 밴드를 따로 만들지 않고 크루와 합치는 이유: 같은 밴드 안에서 최신순으로 섞이면
-- 크루 글과 팔로우 글이 시간 순으로 자연스럽게 배치된다. 팔로우를 위에 따로 두면
-- 실제로 아는 사람(크루)보다 항상 먼저 뜨게 된다.
--
-- 작성자 상한: 밴드 0에는 한 사람당 최신 2개까지만 넣는다. 셋째 글부터는 밴드에서
-- 빠져 원래 자리(신규 6시간 → 밴드 1, 최근 30일 → 밴드 2)로 내려간다. 사라지는 게
-- 아니라 아래로 밀리는 것이라, 글을 몰아 올린 크리에이터도 노출을 잃지 않는다.
--
-- 시그니처가 그대로라 CREATE OR REPLACE를 쓴다. DROP하지 않으므로 실행 권한도 유지된다.

CREATE OR REPLACE FUNCTION public.get_feed_post_ids(
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
  followed as (
    select relation.following_id as followed_id
    from public.follows relation
    where relation.follower_id = (select uid from me)
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
      (
        post.user_id in (select crew_id from crew)
        or post.user_id in (select followed_id from followed)
      ) as is_close,
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
  -- 밴드 0 후보 안에서 작성자별 최신 순번. 3번째부터는 밴드 0에서 뺀다.
  capped as (
    select
      visible_post.*,
      case
        when visible_post.seen or not visible_post.is_close then null
        else row_number() over (
          partition by visible_post.user_id
          order by visible_post.created_at desc
        )
      end as author_seq
    from visible visible_post
  ),
  ranked as (
    select
      candidate.id as post_id,
      case
        when not candidate.seen and candidate.is_close and candidate.author_seq <= 2 then 0
        when not candidate.seen and candidate.is_fresh then 1
        when not candidate.seen and candidate.is_recent then 2
        when candidate.seen and candidate.is_reshowable then 3
        else 4
      end as band,
      case
        when not candidate.seen
             and (
               (candidate.is_close and candidate.author_seq <= 2)
               or candidate.is_fresh
             )
          then extract(epoch from candidate.created_at)
        when not candidate.seen and candidate.is_recent then
          (1 + candidate.likes_count + 2 * candidate.comments_count)::double precision
          * power(
              0.5,
              (extract(epoch from (now() - candidate.created_at)) / 86400.0)
              / (select half_life_days from params)
            )
        else (
          ('x' || substr(
            md5(candidate.id::text || (select seed from params)::text),
            1,
            8
          ))::bit(32)::bigint
        )::double precision
      end as rank
    from capped candidate
  )
  select ranked_post.post_id, ranked_post.band, ranked_post.rank
  from ranked ranked_post
  where p_after_band is null
     or ranked_post.band > p_after_band
     or (ranked_post.band = p_after_band and ranked_post.rank < p_after_rank)
  order by ranked_post.band asc, ranked_post.rank desc
  limit (select result_limit from params);
$function$;
