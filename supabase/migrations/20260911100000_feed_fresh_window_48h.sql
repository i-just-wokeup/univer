-- 신규 글 밴드(밴드 1)의 기준을 6시간 → 48시간으로 넓힌다.
--
-- 배경: 밴드 1을 벗어난 글은 밴드 2의 핫스코어 경쟁으로 떨어지는데,
-- 핫스코어는 (1 + 좋아요 + 댓글×2) × 0.5^(나이/5일) 이라 좋아요 하나가 점수를 배로 만든다.
-- 아직 아무 반응이 없는 새 글은 6시간이 지나는 순간 옛날 인기 글에 밀려 묻힌다.
-- 새벽에 올린 글이 대표적이다 — 아무도 안 보는 6시간이 지나면 그대로 끝난다.
--
-- 밴드 1 조건에 이미 "안 봤음"이 들어 있어, 내가 본 글은 자동으로 이 밴드에서 빠진다.
-- 따라서 창을 넓혀도 같은 글이 나한테 계속 쌓이지 않는다. 별도 도달 수 계산이나
-- 설정 테이블 없이, 이미 있는 구조가 "안 본 사람에게만 계속 보인다"를 해준다.
--
-- 실측(2026-09-11): 활동 상위 5명 기준 밴드 1 글 수가 2개 → 3~7개로 늘어난다.
-- 하루 게시물이 약 5개뿐이라 이 정도가 이틀치에 해당한다.
--
-- 시그니처가 그대로라 CREATE OR REPLACE 를 쓴다. DROP 하지 않으므로
-- anon/authenticated 실행 권한이 사라지지 않는다(2026-09-03 DROP 후 권한 복원 전례).
-- 앱 수정 불필요 — 앱은 p_fresh_hours 를 넘기지 않고 기본값을 쓴다. OTA도 불필요하며
-- 1.0.1·1.0.2·개발 빌드 전부에 다음 피드 조회부터 동시에 적용된다.
--
-- 되돌리려면 아래 두 곳의 48 을 6 으로 되돌리고 다시 실행하면 된다.

CREATE OR REPLACE FUNCTION public.get_feed_post_ids(
  p_seed double precision,
  p_limit integer DEFAULT 20,
  p_after_band integer DEFAULT NULL,
  p_after_rank double precision DEFAULT NULL,
  p_half_life_days double precision DEFAULT 5,
  p_fresh_hours double precision DEFAULT 48,
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
        else 48
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
