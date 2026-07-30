-- search_users 공개 플래그 적용 후에도 기존 같은 학교 검색 범위를 유지한다.
CREATE OR REPLACE FUNCTION public.search_users(search_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(r))
  INTO v_result
  FROM (
    SELECT
      u.id,
      u.nickname,
      u.avatar_url,
      CASE
        WHEN u.id = auth.uid() OR u.department_public THEN u.department
        ELSE NULL
      END AS department
    FROM public.users u
    WHERE
      u.deleted_at IS NULL
      AND u.university_id = (
        SELECT viewer.university_id
        FROM public.users viewer
        WHERE viewer.id = auth.uid()
      )
      AND u.nickname ILIKE '%' || search_query || '%'
    ORDER BY
      CASE WHEN LOWER(u.nickname) = LOWER(search_query) THEN 0 ELSE 1 END,
      u.nickname ASC
    LIMIT 20
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;
