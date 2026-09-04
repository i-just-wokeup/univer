-- 탐색 정렬에 두 가지를 넣는다.
--
-- 1) 기본 점수 1 — 기존 식은 (좋아요 + 댓글×2)라 반응이 하나도 없는 글은 점수가 0이다.
--    갓 올라온 글이 무조건 맨 아래로 가고, 배수를 곱해도 0이라 살아나지 않는다.
--    홈 피드(get_feed_post_ids)는 이미 1을 더하고 있어 탐색만 빠져 있었다.
--
-- 2) 크리에이터 가산점 — 탐색은 "모르는 사람을 발견하는 자리"라 승격·기관 계정을
--    밀어줘도 홈의 "내 사람들 소식" 감각을 해치지 않는다. 크리에이터에게 줄 수 있는
--    실질적 이점이 거의 없어(팔로우는 아직 피드에 반영조차 안 됨) 포섭 근거가 약했다.
--
--    배수 결정 근거(실측): 유일한 승격 계정 s2j_3의 최고점 글이 7위(3.894)였는데
--    1.5배로 1위(6.675)가 된다. 2~8위는 여전히 일반 학생이라 화면을 지배하지 않는다.
--    2배는 과해 일반 학생 글이 밀린다.
--
-- 배수는 인자로 빼서 조절한다(크리에이터가 늘면 낮추고, 효과가 약하면 올린다).
-- 호출부는 앱의 features/explore/api.ts 한 곳뿐이며 인자를 넘기지 않아 기본값을 쓴다.

DROP FUNCTION IF EXISTS public.get_popular_post_ids(integer, integer, double precision);

CREATE FUNCTION public.get_popular_post_ids(
  p_limit integer DEFAULT 30,
  p_offset integer DEFAULT 0,
  p_half_life_hours double precision DEFAULT 120,
  p_creator_boost double precision DEFAULT 1.5
)
RETURNS TABLE(post_id uuid, score double precision)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  with params as (
    select
      least(greatest(coalesce(p_limit, 30), 1), 100)::integer as result_limit,
      least(greatest(coalesce(p_offset, 0), 0), 10000)::integer as result_offset,
      case
        when p_half_life_hours > 0 and p_half_life_hours <= 8760
          then p_half_life_hours
        else 120
      end::double precision as half_life_hours,
      case
        when p_creator_boost >= 1 and p_creator_boost <= 10
          then p_creator_boost
        else 1.5
      end::double precision as creator_boost
  ),
  me as (
    select auth.uid() as uid
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
  scored as (
    select
      post.id as post_id,
      post.created_at,
      (
        (1 + post.likes_count + 2 * post.comments_count)
        * power(
            0.5,
            (extract(epoch from (now() - post.created_at)) / 3600.0)
            / (select half_life_hours from params)
          )
        * case
            when author.is_promoted
              or exists (
                select 1 from public.official_accounts official
                where official.user_id = post.user_id
              )
            then (select creator_boost from params)
            else 1
          end
      )::double precision as score
    from public.posts post
    join public.users author on author.id = post.user_id
    where post.deleted_at is null
      and post.visibility = 'public'
      and post.user_id <> (select uid from me)
      and post.user_id not in (select uid from blocked)
      and exists (
        select 1
        from public.post_media media
        where media.post_id = post.id
      )
  )
  select scored_post.post_id, scored_post.score
  from scored scored_post
  order by scored_post.score desc, scored_post.created_at desc
  limit (select result_limit from params)
  offset (select result_offset from params);
$function$;

GRANT EXECUTE ON FUNCTION public.get_popular_post_ids(
  integer, integer, double precision, double precision
) TO anon, authenticated;
