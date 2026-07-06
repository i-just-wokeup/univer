-- 관리자 신고: 댓글(target_type='comment') 지원.
-- get_admin_reports: 댓글 신고의 내용(target_snapshot)을 target_content로 반환.
-- handle_admin_report: 댓글 삭제 = 하드 DELETE(대댓글/좋아요 ON DELETE CASCADE) + post comments_count 재계산.
--   ※ 댓글은 deleted_at 컬럼이 없어 복구(restore) 불가 → restore에는 comment 분기 없음.

CREATE OR REPLACE FUNCTION public.get_admin_reports(
  status_filter text DEFAULT 'all',
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      rep.id, rep.target_type, rep.target_id, rep.status, rep.created_at,
      json_build_object('id', reporter.id, 'nickname', reporter.nickname, 'avatar_url', reporter.avatar_url) AS reporter,
      json_build_object('id', author.id, 'nickname', author.nickname, 'avatar_url', author.avatar_url) AS target_author,
      CASE
        WHEN rep.target_type = 'post' THEN (
          SELECT json_build_object(
            'content', COALESCE(p.content, rep.target_snapshot->>'content'),
            'thumbnail_url', COALESCE(
              (SELECT pm.url FROM public.post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1),
              rep.target_snapshot->>'thumbnail_url'
            )
          ) FROM public.posts p WHERE p.id = rep.target_id
          UNION ALL
          SELECT json_build_object('content', rep.target_snapshot->>'content', 'thumbnail_url', rep.target_snapshot->>'thumbnail_url')
          WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE id = rep.target_id)
          LIMIT 1
        )
        WHEN rep.target_type = 'story' THEN (
          SELECT json_build_object('thumbnail_url', COALESCE(s.image_url, rep.target_snapshot->>'thumbnail_url'))
          FROM public.stories s WHERE s.id = rep.target_id
          UNION ALL
          SELECT json_build_object('thumbnail_url', rep.target_snapshot->>'thumbnail_url')
          WHERE NOT EXISTS (SELECT 1 FROM public.stories WHERE id = rep.target_id)
          LIMIT 1
        )
        WHEN rep.target_type = 'comment' THEN
          json_build_object('content', rep.target_snapshot->>'content', 'thumbnail_url', NULL)
        ELSE json_build_object('content', NULL, 'thumbnail_url', NULL)
      END AS target_content
    FROM public.reports rep
    JOIN public.users reporter ON reporter.id = rep.reporter_id
    LEFT JOIN public.users author ON author.id = rep.target_author_id
    WHERE (status_filter = 'all' OR rep.status = status_filter)
    ORDER BY rep.created_at DESC
    LIMIT limit_count OFFSET offset_count
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_admin_report(report_id uuid, action_type text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_report public.reports%ROWTYPE;
  v_post_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_report FROM public.reports WHERE id = report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;

  IF action_type = 'delete' THEN
    IF v_report.target_type = 'post' THEN
      UPDATE public.posts SET deleted_at = NOW() WHERE id = v_report.target_id;
    ELSIF v_report.target_type = 'story' THEN
      UPDATE public.stories SET deleted_at = NOW() WHERE id = v_report.target_id;
    ELSIF v_report.target_type = 'comment' THEN
      SELECT post_id INTO v_post_id FROM public.comments WHERE id = v_report.target_id;
      DELETE FROM public.comments WHERE id = v_report.target_id;
      IF v_post_id IS NOT NULL THEN
        PERFORM public.recount_post_comments(v_post_id);
      END IF;
    END IF;
    UPDATE public.reports SET status = 'action_taken'
    WHERE target_type = v_report.target_type AND target_id = v_report.target_id;
  ELSIF action_type = 'restore' THEN
    IF v_report.target_type = 'post' THEN
      UPDATE public.posts SET deleted_at = NULL WHERE id = v_report.target_id;
    ELSIF v_report.target_type = 'story' THEN
      UPDATE public.stories SET deleted_at = NULL WHERE id = v_report.target_id;
    END IF;
    UPDATE public.reports SET status = 'dismissed'
    WHERE target_type = v_report.target_type AND target_id = v_report.target_id;
  ELSIF action_type = 'dismiss' THEN
    UPDATE public.reports SET status = 'dismissed' WHERE id = report_id;
  END IF;

  RETURN json_build_object('success', true, 'action', action_type);
END;
$$;
